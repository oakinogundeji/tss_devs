'use strict';
const
    Promise = require('bluebird'),
    AWS = require('aws-sdk'),
    log = require('./logger').getLogger("AutoscalingHelper"),
    AUTO_SCALING = new AWS.AutoScaling();
/*=============================================================================

 Module config

 =============================================================================*/
AWS.config.update({region: process.env.AWS_REGION});


function detachEC2Instances(data) {
    const params = {
        AutoScalingGroupName: process.env.AUTOSCALING_GRP_NAME,
        InstanceIds: data,
        ShouldDecrementDesiredCapacity: true
    };

    return new Promise((resolve, reject) => {
        AUTO_SCALING.detachInstances(params, (err, resp) => {
            if (err) {
                log.error('detachInstances error: ' + err);
                reject(err);
            } else {
                log.debug('detachInstances succeeded');
                resolve(data);
            }
        });
    });
}

function updateAutoScalingGroup(count) {
    log.debug('new autoscale count ' + count);
    return new Promise((resolve, reject) => {
        const params = {
            AutoScalingGroupName: process.env.AUTOSCALING_GRP_NAME,
            MinSize: 1,
            DesiredCapacity: count,
            MaxSize: count + 1
        };

        AUTO_SCALING.updateAutoScalingGroup(params, (err, data) => {
            if (err) {
                log.error("updateAutoScalingGroup " + err);
                reject(err);
            } else {
                log.debug("updateAutoScalingGroup: " + data);
                resolve(data);
            }
        });
    });
}

module.exports = {
    detachEC2Instances,
    updateAutoScalingGroup,
    AUTO_SCALING
};
