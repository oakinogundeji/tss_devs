'use strict';

const
    AWS = require('aws-sdk'),
    ECS = new AWS.ECS(),
    Promise = require('bluebird'),
    log = require('./logger').getLogger("ECSHelper"),
    DEPLOY_TASKS_RETRY_INTERVAL = process.env.DEPLOY_TASKS_RETRY_INTERVAL,
    TASK_DEF_ARN = process.env.TASK_DEF_ARN;


AWS.config.update({region: process.env.AWS_REGION});

function run_ECS_Tasks(CLUSTER_NAME,TD) {

    log.debug('task definition: ', TD);

    const params = {
        cluster: CLUSTER_NAME,
        taskDefinition: TD
    };

    return new Promise((resolve, reject) => {
        ECS.runTask(params, (err, data) => {
            if (err) {
                log.error("runTask:" + err);
                reject(err);
            } else {
                log.debug("runTask: " + data);
                resolve(data);
            }
        });
    });
}

function start_ECS_Tasks(CLUSTER_NAME, TD, CONTAINER_INSTANCE_ARN) {
    log.debug('task definition: ', TD);

    const params = {
        cluster: CLUSTER_NAME,
        taskDefinition: TD,
        containerInstances: [CONTAINER_INSTANCE_ARN]
    };

    return new Promise((resolve, reject) => {
        ECS.startTask(params, (err, data) => {
            if (err) {
                log.error("startTask: " + err);
                reject(err);
            } else {
                log.debug("startTask " + data);
                resolve(data);
            }
        });
    });
}

function listClusterContainerInstances(cluster) {
    return new Promise((resolve, reject) => {
        const params = {cluster: cluster};
        ECS.listContainerInstances(params, (err, data) => {
            if (err) {
                log.error('There was an error retrieving container instances for cluster ' + cluster + '> error: ' + err);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function getClusterContainerInstanceTasks(cluster, containerInstances) {
    return new Promise((resolve, reject) => {
        const params = {
            cluster: cluster,
            containerInstances: containerInstances
        };
        ECS.describeContainerInstances(params, (err, data) => {
            if (err) {
                log.error('There was an error retrieving tasks running on container instances on cluster ' + cluster + '> error: ' + err);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function getECSClusterState(ECS_CLUSTER) {
    return listClusterContainerInstances(ECS_CLUSTER)
        .then(data => {
            log.debug('listClusterContainerInstances data: ', data);
            return getClusterContainerInstanceTasks(ECS_CLUSTER, data.containerInstanceArns);
        })
        .then(data => {
            log.debug('getClusterContainerInstanceTasks data: ', data);
            return data.containerInstances;
        })
        .then(data => {
            return processECSStateData(data);
        })
        .catch(err => {
            log.error('There was an error retrieving ECS Cluster and SQS Queue state');
            log.error(err);
        });
}

function processECSStateData(data) {
    /*
    This function receives data which represents the existing state of the ECS cluster
    It processes this data to derive several metrics needed to have a clear idea of
    the present state of the ECS Cluster with respect to the following:
    1. ECS_CONTAINER_INSTANCES_COUNT: Number of container instances registered on the cluster
    2. ECS_CLUSTER_TOTAL_CAPACITY: Total number of Tasks/Docker containers that can be run on
    the cluster with the existing resources - this includes presently running tasks and
    any excess/free capacity.
    3. ECS_CLUSTER_AVAILABLE_CAPACITY: Number of additional tasks that can be run on the cluster
    without scaling up. If the POST command is less than this value, the scheduler will trigger
    ECS.runTask(), if more than this value, the scheduler will scale up, run this number
    of tasks on the exsiting cluster resources before running the remaining tasks on
    the new resources.
    4. existingInstancesARNSArray: an array of ARNs for the existing container instances bound to the cluster
    this is used to filter the newly spun up EC2 instances when ECS.startTask() is invoked
    5. partiallyEngagedInstancesArray: an array of existing instances which have free capacity,
    there should only ever be one such instance by design.
    6. idleInstancesArray: an array of EC2 instances on which no tasks are runnignat the moment,
    used by the scale-in module to determine whetehr or not to scale down.

    These metrics allow the scheduler to correctly determine if a POST request will require
    additional resources or not.
    */
    let ECS_CLUSTER_DATA = {},
        existingInstancesARNSArray = [],
        REMAINING_RESOURCES = {},
        CPU_COUNT_ARRAY = [],
        RAM_COUNT_ARRAY = [];

    const
        MUX = process.env.MUX,
        ECS_CONTAINER_INSTANCES_COUNT = data.length,
        ECS_CLUSTER_TOTAL_CAPACITY = ECS_CONTAINER_INSTANCES_COUNT * MUX,
        ECS_CLUSTER_AVAILABLE_CAPACITY = ECS_CLUSTER_TOTAL_CAPACITY - data.map(instance => (instance.runningTasksCount + instance.pendingTasksCount))
                .reduce((prev, curr) => prev + curr);

    data.forEach(instance => {
        return instance.remainingResources.forEach(obj => {
            if(obj.name == 'CPU') {
                return CPU_COUNT_ARRAY.push(obj.integerValue);
            }
            if(obj.name == 'MEMORY') {
                return RAM_COUNT_ARRAY.push(obj.integerValue);
            }
        });
    });

    REMAINING_RESOURCES.TOTAL_CPU_COUNT = CPU_COUNT_ARRAY.reduce((prev, curr) => prev + curr);
    REMAINING_RESOURCES.TOTAL_RAM_COUNT = RAM_COUNT_ARRAY.reduce((prev, curr) => prev + curr);
    REMAINING_RESOURCES.CPU = CPU_COUNT_ARRAY;
    REMAINING_RESOURCES.RAM = RAM_COUNT_ARRAY;

    log.info('REMAINING_RESOURCES.TOTAL_CPU_COUNT:- ', REMAINING_RESOURCES.TOTAL_CPU_COUNT);
    log.info('REMAINING_RESOURCES.TOTAL_RAM_COUNT:- ', REMAINING_RESOURCES.TOTAL_RAM_COUNT);
    log.info('REMAINING_RESOURCES.CPU:- ', REMAINING_RESOURCES.CPU);
    log.info('REMAINING_RESOURCES.RAM:- ', REMAINING_RESOURCES.RAM);

    data.forEach(instance => existingInstancesARNSArray.push(instance.containerInstanceArn));

    let partiallyEngagedInstancesArray = data.filter(instance => {
        const total = instance.runningTasksCount + instance.pendingTasksCount;
        return (total > 0 && total < 10);
    });

    let idleInstancesArray = data.filter(instance => {
        const total = instance.runningTasksCount + instance.pendingTasksCount;
        return (total === 0);
    });

    const
        PARTIALLY_ENGAGED_INSTANCES_COUNT = partiallyEngagedInstancesArray.length,
        IDLE_INSTANCES_COUNT = idleInstancesArray.length;
    let
        idleInstancesID = idleInstancesArray.map(instance => {
            return instance.ec2InstanceId;
        }),
        idleInstancesARN = idleInstancesArray.map(instance => {
            return instance.containerInstanceArn;
        }),
        partiallyEngagedInstances = partiallyEngagedInstancesArray.map(instance => {
            const AVAILABLE_FOR_USE = 10 - instance.runningTasksCount;
            return {
                containerInstanceArn: instance.containerInstanceArn,
                AVAILABLE_FOR_USE: AVAILABLE_FOR_USE
            };
        });

    ECS_CLUSTER_DATA.ECS_CONTAINER_INSTANCES_COUNT = ECS_CONTAINER_INSTANCES_COUNT;
    ECS_CLUSTER_DATA.ECS_CLUSTER_TOTAL_CAPACITY = ECS_CLUSTER_TOTAL_CAPACITY;
    ECS_CLUSTER_DATA.ECS_CLUSTER_AVAILABLE_CAPACITY = ECS_CLUSTER_AVAILABLE_CAPACITY;
    ECS_CLUSTER_DATA.PARTIALLY_ENGAGED_INSTANCES_COUNT = PARTIALLY_ENGAGED_INSTANCES_COUNT;
    ECS_CLUSTER_DATA.IDLE_INSTANCES_COUNT = IDLE_INSTANCES_COUNT;
    ECS_CLUSTER_DATA.REMAINING_RESOURCES = REMAINING_RESOURCES;
    ECS_CLUSTER_DATA.idleInstancesID = idleInstancesID;
    ECS_CLUSTER_DATA.idleInstancesARN = idleInstancesARN;
    ECS_CLUSTER_DATA.partiallyEngagedInstances = partiallyEngagedInstances;
    ECS_CLUSTER_DATA.existingInstancesARNS = existingInstancesARNSArray;

    log.info('ECS_CLUSTER_DATA ', ECS_CLUSTER_DATA);
    return Promise.resolve(ECS_CLUSTER_DATA);
}

function getNewClusterResources(ECS_CLUSTER, REQUIRED) {
    return getECSClusterState(ECS_CLUSTER)
        .then(data => {
            log.debug('data from getECSClusterState for getNewClusterResources', data);
            let ECS_CLUSTER_STATE;
            if (data) {
                ECS_CLUSTER_STATE = JSON.parse(data);
                return new Promise((resolve, reject) => {
                    if (ECS_CLUSTER_STATE.existingInstancesARNS.length < REQUIRED) {
                        log.info('no new instances');
                        reject('nothing new...');
                    } else {
                        log.info('new instances, next step...');
                        log.debug(ECS_CLUSTER_STATE.existingInstancesARNS);
                        resolve(ECS_CLUSTER_STATE.existingInstancesARNS);
                    }
                });
            } else {
                return Promise.reject(false);
            }
        })

}

let
    ORIG_ECS_CLUSTER,
    ORIG_AVAILABLE,
    ORIG_REMAINDER,
    ORIG_REQUIRED_EC2_INSTANCES,
    ORIG_IDLE_EC2_INSTANCES_ARNS,
    ORIG_EXISTING_EC2_INSTANCES_ARNS;

function deployTasks(ECS_CLUSTER, AVAILABLE, REMAINDER, REQUIRED_EC2_INSTANCES, IDLE_EC2_INSTANCES_ARNS, EXISTING_EC2_INSTANCES_ARNS) {
    log.debug('deploy tasks AVAILABLE', AVAILABLE);
    log.debug('deploy tasks REMAINDER', REMAINDER);

    ORIG_ECS_CLUSTER = ORIG_ECS_CLUSTER || ECS_CLUSTER;
    ORIG_AVAILABLE = ORIG_AVAILABLE || AVAILABLE;
    ORIG_REMAINDER = ORIG_REMAINDER || REMAINDER;
    ORIG_REQUIRED_EC2_INSTANCES = ORIG_REQUIRED_EC2_INSTANCES || REQUIRED_EC2_INSTANCES;
    ORIG_IDLE_EC2_INSTANCES_ARNS = ORIG_IDLE_EC2_INSTANCES_ARNS || IDLE_EC2_INSTANCES_ARNS;
    ORIG_EXISTING_EC2_INSTANCES_ARNS = ORIG_EXISTING_EC2_INSTANCES_ARNS || EXISTING_EC2_INSTANCES_ARNS;

    let newEC2_ARNs;
    return getNewClusterResources(ECS_CLUSTER, REQUIRED_EC2_INSTANCES)
        .then(data => {
            log.debug('data from resolution of getNewClusterResources', data);

            const SQS_QUEUE_SIZE = AVAILABLE + REMAINDER;

            for (let i = 0; i < SQS_QUEUE_SIZE; i++) {
                run_ECS_Tasks(ECS_CLUSTER, TASK_DEF_ARN);
            }
            return null;
        })
        .catch(err => {
            log.error(JSON.stringify(err) + '> retrying in 30 secs...');
            return setTimeout(() => deployTasks(ORIG_ECS_CLUSTER, ORIG_AVAILABLE,
            ORIG_REMAINDER, ORIG_REQUIRED_EC2_INSTANCES, ORIG_IDLE_EC2_INSTANCES_ARNS,
            ORIG_EXISTING_EC2_INSTANCES_ARNS), DEPLOY_TASKS_RETRY_INTERVAL);
        });
}


module.exports = {
    run_ECS_Tasks,
    start_ECS_Tasks,
    listClusterContainerInstances,
    getClusterContainerInstanceTasks,
    getECSClusterState,
    processECSStateData,
    deployTasks,
    ECS
};
