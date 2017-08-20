'use strict';

const AWS = require('aws-sdk'),
    Promise = require('bluebird'),
    log = require('./logger').getLogger("SQSHelper"),
    SQS = new AWS.SQS();

AWS.config.update({region: process.env.AWS_REGION});
//=============================================================================
/**
 * SQS Helper functions
 */
//=============================================================================
function getQueues() {
    const params = {};
    return new Promise((resolve, reject) => {
        SQS.listQueues(params, (err, resp) => {
            if (err) {
                log.error('getQueues err ' + JSON.stringify(err));
                reject(err);
            } else {
                log.info('getQueues success');
                console.log('getQueues success:', resp);
                resolve(resp.QueueUrls);
            }
        });
    });
}

function getSQSQueueSize(PO_QUEUE) {
    const regex = /orchestrator$/i;
    if(!regex.test(PO_QUEUE)) {
        const err = new Error('Invalid value for PO_QUEUE parameter');
        return Promise.reject(err);
    }
    if((typeof(PO_QUEUE) != 'string') && (PO_QUEUE.length < 1)) {
        const err = new Error('The expected data type for the PO_QUEUE parameter must be a non-empty string');
        return Promise.reject(err);
    }
    log.debug('querying SQS queue');
    return new Promise((resolve, reject) => {
        const params = {
            AttributeNames: ["ApproximateNumberOfMessages"],
            QueueUrl: PO_QUEUE
        };
        SQS.getQueueAttributes(params, (err, data) => {
            if (err) {
                log.error('There was an error retrieving the size of the ' + PO_QUEUE + 'queue > error: ' + err);
                reject(err.message);
            } else {
                log.info('queue size data', data);
                resolve(data.Attributes.ApproximateNumberOfMessages);
            }
        });
    });
}

module.exports = {
    getQueues,
    getSQSQueueSize,
    SQS
};
