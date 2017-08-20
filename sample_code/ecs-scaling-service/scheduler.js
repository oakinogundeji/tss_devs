'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const
    helpers = require('./helpers'),
    log = helpers.Logger.getLogger("Scheduler"),
    ECSHelper = helpers.ECSHelper,
    AutoscalingHelper = helpers.AutoscalingHelper,
    ECS_CLUSTER = process.env.ECS_CLUSTER,
    MUX = process.env.MUX,
    TASK_DEF_ARN = process.env.TASK_DEF_ARN;
//=============================================================================
/**
 * Scheduler object
 */
//=============================================================================
const Scheduler = {
    taskScheduler(ECS_CLUSTER_STATE, SQS_QUEUE_SIZE) {
        log.info('Task scheduler started');
        log.debug('existing ECS Cluster state', ECS_CLUSTER_STATE);
        log.debug('SQS message count', SQS_QUEUE_SIZE);
        const
            EXECUTOR_TD_RAM = 450,
            SUFFICIENT_RESOURCES = ((EXECUTOR_TD_RAM * SQS_QUEUE_SIZE) <= ECS_CLUSTER_STATE.REMAINING_RESOURCES.TOTAL_RAM_COUNT)
                && (ECS_CLUSTER_STATE.REMAINING_RESOURCES.RAM.every(ram => ram >= EXECUTOR_TD_RAM)),
            ECS_CLUSTER_AVAILABLE_CAPACITY = ECS_CLUSTER_STATE.ECS_CLUSTER_AVAILABLE_CAPACITY,
            ECS_CLUSTER_AVAILABLE_INSTANCES_COUNT = Math.ceil(ECS_CLUSTER_AVAILABLE_CAPACITY / MUX),
            REQUIRED_EC2_INSTANCES = Math.ceil(SQS_QUEUE_SIZE / MUX),
            EXISTING_EC2_INSTANCES_ARNS = ECS_CLUSTER_STATE.existingInstancesARNS,
            IDLE_EC2_INSTANCES_ARNS = ECS_CLUSTER_STATE.idleInstancesARN;

        log.debug('ECS_CLUSTER_AVAILABLE_CAPACITY ', ECS_CLUSTER_AVAILABLE_CAPACITY);
        log.debug('ECS_CLUSTER_AVAILABLE_INSTANCES_COUNT ', ECS_CLUSTER_AVAILABLE_INSTANCES_COUNT);
        log.debug('REQUIRED_EC2_INSTANCES ', REQUIRED_EC2_INSTANCES);
        log.debug('IDLE_EC2_INSTANCES_ARNS ', IDLE_EC2_INSTANCES_ARNS);
        
        if(SUFFICIENT_RESOURCES) {
            log.info('sufficient resources exist on the cluster - runTask...');
            for (let i = 0; i < SQS_QUEUE_SIZE; i++) {
                ECSHelper.run_ECS_Tasks(ECS_CLUSTER, TASK_DEF_ARN);
            }
            return null;
        } else {
            //spinup new instances before starting tasks
            log.info('sufficient resources do not exist on the cluster - startTask...');
            log.debug('start tasks');
            const
                AVAILABLE = ECS_CLUSTER_AVAILABLE_CAPACITY,
                REMAINDER = SQS_QUEUE_SIZE - AVAILABLE;
            return AutoscalingHelper.updateAutoScalingGroup(REQUIRED_EC2_INSTANCES)
                .then(ok => ECSHelper.deployTasks(ECS_CLUSTER, AVAILABLE, REMAINDER,
                     REQUIRED_EC2_INSTANCES, IDLE_EC2_INSTANCES_ARNS,
                     EXISTING_EC2_INSTANCES_ARNS));
        }
    }
};
//=============================================================================
/**
 * Export Scheduler
 */
//=============================================================================
module.exports = Scheduler;
//=============================================================================
