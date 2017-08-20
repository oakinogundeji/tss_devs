'use strict';
/**
* module dependencies
*/
//=============================================================================
const
    MOCK_AWS = require('mock-aws'),
    Promise = require('bluebird'),
    SQS = new MOCK_AWS.SQS();
//=============================================================================
/**
* mocks
*/
//=============================================================================
MOCK_AWS.mock('SQS', 'createQueue', (params = {}, cb) => {
  if (params.QueueName == 'orchestrator') {
      return cb(null, {QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/012345678912/orchestrator'});
  }
  if (params.QueueName == 'executor') {
      return cb(null, {QueueUrl: "https://sqs.eu-west-1.amazonaws.com/012345678912/executor"});
  }
  if (params.QueueName == 'errorMsgs') {
      return cb(null, {QueueUrl: "https://sqs.eu-west-1.amazonaws.com/012345678912/errorMsgs"});
  } else {
      return cb('Invalid queue name');
  }
});

MOCK_AWS.mock('SQS', 'sendMessage', (params = {}, cb) => {
  if ((params.QueueUrl == 'https://sqs.eu-west-1.amazonaws.com/012345678912/orchestrator')
    && (typeof(params.MessageBody) == 'string')
    && (params.MessageBody.length > 0)) {
      return cb(null, 'Success');
  } else {
      return cb('Invalid QueueUrl or MessageBody parameters');
  }
});

MOCK_AWS.mock('SQS', 'getQueueAttributes', (params = {}, cb) => {
    if (params.QueueUrl == 'https://sqs.eu-west-1.amazonaws.com/012345678912/orchestrator') {
        const queueSize = Math.floor((Math.random() * 101) + 0);
        return cb(null, {Attributes: {ApproximateNumberOfMessages: JSON.stringify(queueSize)}});
    } else {
        return cb('Invalid QueueUrl parameter');
    }
});
//=============================================================================
/**
 * SQS Helper functions
 */
//=============================================================================
function createSendQueue(params) {
    return new Promise((resolve, reject) => {
        SQS.createQueue(params, (err, data) => {
            if (err) {
                console.error('Error creating SendQ');
                reject(err);
            } else {
                console.log('SendQ created');
                resolve(data.QueueUrl);
            }
        });
    });
}

function createReceiveQueue(params) {
    return new Promise((resolve, reject) => {
        SQS.createQueue(params, (err, data) => {
            if (err) {
                console.error('Error creating ReceiveQ');
                reject(err);
            } else {
                console.log('ReceiveQ created');
                resolve(data.QueueUrl);
            }
        });
    });
}

function createErrorQueue(params) {
    return new Promise((resolve, reject) => {
        SQS.createQueue(params, (err, data) => {
            if (err) {
                console.error('Error creating errorQ');
                reject(err);
            } else {
                console.log('errorQ created');
                resolve(data.QueueUrl);
            }
        });
    });
}

function addMessageToSQSQueue(sendQ, msg) {
    if((typeof(msg) != 'string') && (msg.length < 1)) {
        const errMsg = 'The message to be sent must be a non-empty string';
        return Promise.reject(errMsg);
    }
    return new Promise((resolve, reject) => {
        SQS.sendMessage({QueueUrl: sendQ, MessageBody: msg, DelaySeconds: 0}, (err, data) => {
            if (err) {
                console.error('Error sending msg to executor');
                reject(err);
            } else {
                console.log(msg + ' send to executor');
                resolve(true);
            }
        });
    });
}

function getSQSQueueSize(sendQ) {
    console.log('querying SQS queue');
    return new Promise((resolve, reject) => {
        const params = {
            AttributeNames: ["ApproximateNumberOfMessages"],
            QueueUrl: sendQ
        };
        SQS.getQueueAttributes(params, (err, data) => {
            if (err) {
                console.log('There was an error retrieving the size of the ' + sendQ + 'queue > error: ' + err);
                reject(err);
            } else {
                console.log('queue size data', data);
                resolve(data.Attributes.ApproximateNumberOfMessages);
            }
        });
    });
}
//=============================================================================
/**
* export module
*/
//=============================================================================
module.exports = {
    createSendQueue,
    createReceiveQueue,
    createErrorQueue,
    addMessageToSQSQueue,
    getSQSQueueSize
};
//=============================================================================
