'use strict';
const
    Promise = require('bluebird'),
    AWS = require('aws-sdk'),
    log = require('./logger').getLogger("EC2helper"),
    EC2 = new AWS.EC2();
/*=============================================================================

 Module config

 =============================================================================*/
AWS.config.update({region: process.env.AWS_REGION});


function terminateEC2Instances(data) {
    const params = {
        InstanceIds: data
    };

    return new Promise((resolve, reject) => {
        EC2.terminateInstances(params, (err, resp) => {
            if (err) {
                log.error('terminate instances error: ' + err);
                reject(err);
            } else {
                log.debug('terminate instances success');
                resolve(resp);
            }
        });
    });
}

module.exports = {
    terminateEC2Instances,
    EC2
};
