'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const
    helpers = require('./helpers'),
    log = helpers.Logger.getLogger("ScaleIn"),
    Scheduler = require('./scheduler'),
    SQSHelper = helpers.SQShelper,
    ECSHelper = helpers.ECSHelper,
    Promise = require('bluebird');

const
    ECS_CLUSTER = process.env.ECS_CLUSTER,
    STATE_MONITOR_INTERVAL = process.env.STATE_MONITOR_INTERVAL,
    SEND_QUEUE = process.argv[2];
//=============================================================================
/**
 * Main
 */
//=============================================================================
function getECSClusterAndSQSQueueState(ECS_CLUSTER, SEND_QUEUE) {
    return Promise.all([ECSHelper.getECSClusterState(ECS_CLUSTER),
        SQSHelper.getSQSQueueSize(SEND_QUEUE)]);
}

function main() {
    return getECSClusterAndSQSQueueState(ECS_CLUSTER, SEND_QUEUE)
        .then(data => {
            log.debug('SQS queue and ECS data: ', data);
            const
                SQS_DATA = data.filter(val => {
                    return typeof(val) == 'string';
                })[0],
                ECS_DATA = data.filter(val => {
                    return typeof(val) == 'object';
                })[0];
            log.debug('ECS data', ECS_DATA);
            log.debug('SQS data', SQS_DATA);

            if(SQS_DATA > 0) {
                log.debug('New messages on SQS queue', SQS_DATA);
                log.debug('invoking taskScheduler');
                return Scheduler.taskScheduler(ECS_DATA, SQS_DATA);
            }
        })
        .catch(err => {
            log.error("Error retreiving SQS queue and ECS data in state-monitor: " + err);
        });
}
//=============================================================================
main();
setInterval(main, STATE_MONITOR_INTERVAL);
//=============================================================================
