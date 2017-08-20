'use strict';
//=============================================================================
//memcached helper function
//=============================================================================
const
    MEMCACHED = require('memcached'),
    MEMCACHED_CLIENT = new MEMCACHED('localhost:11211'),
    INVALID_MEMCACHED_CLIENT = new MEMCACHED('invalid_host'),
    Promise = require('bluebird'),
    SQS_QUEUE_NAME = process.env.SQS_QUEUE_NAME,
    ECS_CLUSTER = process.env.ECS_CLUSTER;

let
    SQS_QUEUE_SIZE,
    ECS_CLUSTER_STATE;

function storeSQSandClusterState(data, ECS_CLUSTER, SQS_QUEUE_NAME) {
    console.log('data sent to memcached for storage', data);
    if(!data) {
        return Promise.reject('data argument cannot be null or empty');
    }
    if((!ECS_CLUSTER) || (typeof(ECS_CLUSTER) != 'string') || (ECS_CLUSTER != process.env.ECS_CLUSTER)) {
        return Promise.reject('The ECS_CLUSTER argument must be a non empty string equal to the ECS_CLUSTER environment value');
    }
    if((!SQS_QUEUE_NAME) || (typeof(SQS_QUEUE_NAME) != 'string') || (SQS_QUEUE_NAME != process.env.SQS_QUEUE_NAME)) {
        return Promise.reject('The SQS_QUEUE_NAME argument must be a non empty string equal to the SQS_QUEUE_NAME environment value');
    }

    const SQS_QUEUE_SIZE = data.filter(val => typeof(val) == 'string')[0];
    const ECS_CLUSTER_STATE = data.filter(val => typeof(val) == 'object')[0];

    console.log('SQS_QUEUE_SIZE', SQS_QUEUE_SIZE);
    console.log('ECS_CLUSTER_STATE', ECS_CLUSTER_STATE);

    return Promise.all([
        new Promise((resolve, reject) => {
            MEMCACHED_CLIENT.set(ECS_CLUSTER, JSON.stringify(ECS_CLUSTER_STATE), 60, err => {
                if (err) {
                    console.log("error storing ecs cluster state to Memcache: " + err);
                    reject(err);
                } else {
                    console.log('stored Cluster data on memcached');
                    resolve(true);
                }
            });
        }),
        new Promise((resolve, reject) => {
            MEMCACHED_CLIENT.set(SQS_QUEUE_NAME, JSON.stringify(SQS_QUEUE_SIZE), 60, err => {
                if (err) {
                    console.log("Error storing sqs queue state to Memcache " + err);
                    reject(err);
                } else {
                    console.log('stored SQS data on memcached');
                    resolve(true);
                }
            });
        })
    ]);
}

function getSQSQueueSize(queueName) {
    console.log('queueName', queueName);
    if(typeof(queueName) != 'string') {
        return Promise.reject('queueName argument must be a string');
    }
    if(queueName != SQS_QUEUE_NAME) {
        return Promise.reject('The queueName argument must be a non empty string equal to the SQS_QUEUE_NAME environment value');
    }
    return new Promise((resolve, reject) => {
        MEMCACHED_CLIENT.get(queueName, (err, data) => {
            if (err) {
                console.log("Error getting SQS state from memcache: " + err);
                reject(err);
            }
            console.log('getSQSQueueSize data', data);
            let SQS_QUEUE_SIZE;
            if (data) {
                SQS_QUEUE_SIZE = JSON.parse(data);
            } else {
                reject(false);
            }
            if (SQS_QUEUE_SIZE < 1) {
                console.log('no queue data yet ' + data);
                reject(false);
            } else {
                resolve(data);
            }
        });
    })
}

function getClusterState(clusterName) {
    if(typeof(clusterName) != 'string') {
        return Promise.reject('clusterName argument must be a string');
    }
    if(clusterName != ECS_CLUSTER) {
        return Promise.reject('The clusterName argument must be a non empty string equal to the ECS_CLUSTER environment value');
    }
    return new Promise((resolve, reject) => {
        MEMCACHED_CLIENT.get(clusterName, (err, data) => {
            if (err) {
                console.log("Error getting cluster state from memcached: " + err);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function getSQSState(queueName) {
    if(typeof(queueName) != 'string') {
        return Promise.reject('queueName argument must be a string');
    }
    if(queueName != SQS_QUEUE_NAME) {
        return Promise.reject('The queueName argument must be a non empty string equal to the SQS_QUEUE_NAME environment value');
    }
    return new Promise((resolve, reject) => {
        MEMCACHED_CLIENT.get(queueName, (err, data) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function getNewClusterResources(cluster, REQUIRED) {
    if(typeof(cluster) != 'string') {
        return Promise.reject('cluster argument must be a string');
    }
    if(typeof(REQUIRED) != 'number') {
        return Promise.reject('REQUIRED argument must be a number');
    }
    if(cluster != ECS_CLUSTER) {
        return Promise.reject('The cluster argument must be a non empty string equal to the ECS_CLUSTER environment value');
    }
    return getClusterState(cluster)
        .then(data => {
            console.log('data from getClusterState for getNewClusterResources', data);
            let ECS_CLUSTER_STATE;
            if (data) {
                ECS_CLUSTER_STATE = JSON.parse(data);
                return new Promise((resolve, reject) => {
                    if (ECS_CLUSTER_STATE.existingInstancesARNS.length < REQUIRED) {
                        console.log('no new instances');
                        reject('nothing new...');
                    } else {
                        console.log('new instances, next step...');
                        console.log(ECS_CLUSTER_STATE.existingInstancesARNS);
                        resolve(ECS_CLUSTER_STATE.existingInstancesARNS);
                    }
                });
            } else {
                return Promise.reject(false);
            }
        });
}

function getClusterAndQueueState(clusterName, queueName) {
    return Promise.all([getClusterState(clusterName), getSQSState(queueName)]);
}

module.exports = {
    MEMCACHED_CLIENT,
    INVALID_MEMCACHED_CLIENT,
    storeSQSandClusterState,
    getSQSQueueSize,
    getClusterState,
    getSQSState,
    getNewClusterResources
};
