'use strict';
/*=============================================================================

 Module dependencies

 =============================================================================*/
const
    Promise = require('bluebird'),
    helpers = require('./helpers'),
    log = helpers.Logger.getLogger("ScaleIn"),
    EC2Helper = helpers.EC2Helper,
    ECSHelper = helpers.ECSHelper,
    AutoscalingHelper = helpers.AutoscalingHelper,
    ECS_CLUSTER = process.env.ECS_CLUSTER,
    SCALE_IN_START_DELAY = process.env.SCALE_IN_START_DELAY,
    SCALE_IN_INTERVAL = process.env.SCALE_IN_INTERVAL;

/*=============================================================================

 Helper functions

 =============================================================================*/


function scaleIn(data) {
    log.debug('start scale-in op...');
    return AutoscalingHelper.detachEC2Instances(data)
        .then(instanceIDs => EC2Helper.terminateEC2Instances(instanceIDs))
        .then(() => log.info('scale-in success!'))
        .catch(err => {
            log.error('scale-in err:' + err);
        })
}

function shouldScaleIn(data) {
    log.debug('data passed to shouldScaleIn', data);
    if (data > 1) {
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }
}
//=============================================================================
/**
 * main function
 */
//=============================================================================
function main() {
    log.debug('scale-in module running, checking for idle instances every 5 minutes...');
    let ECS_CLUSTER_STATE;

    return ECSHelper.getECSClusterState(ECS_CLUSTER)
        .then(data => {
            log.debug('ECS_CLUSTER state from scale-in:', data);
            if(data) {
              ECS_CLUSTER_STATE = data;
              return shouldScaleIn(ECS_CLUSTER_STATE.IDLE_INSTANCES_COUNT);
            }
            return false;
        })
        .then(ok => {
            log.debug('response from shouldScaleIn', ok);
            if (ok) {
                //scale-in
                ECS_CLUSTER_STATE.idleInstancesID.pop();//ensures at least one instance will be running
                return scaleIn(ECS_CLUSTER_STATE.idleInstancesID);
            } else {
                //do nothing
                return null;
            }
        })
        .then(data => {
            log.debug('scaleIn op data', data);
        })
        .catch(err => {
            log.error("Error scaling in: " + err);
        });
}
//=============================================================================
setTimeout(main, SCALE_IN_START_DELAY);
setInterval(main, SCALE_IN_INTERVAL);
//=============================================================================
