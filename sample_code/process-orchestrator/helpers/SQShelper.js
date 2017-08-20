'use strict';
const AWS = require('aws-sdk'),
    Promise = require('bluebird'),
    log = require('./logger').getLogger("SQSHelper"),
    SQS = new AWS.SQS(),
    _config =require('../config').SQS;

AWS.config.update({region: process.env.AWS_REGION});
//=============================================================================
/**
 * SQS Helper functions
 */
//=============================================================================
function createSendQueue(params) {
    if (params.QueueName != 'orchestrator') {
        const err = new Error('Invalid queue name');
        return Promise.reject(err);
    }
    return new Promise((resolve, reject) => {
        SQS.createQueue(params, (err, data) => {
            if (err) {
                log.error("Error creating SendQ: " + err);
                reject(err);
            } else {
               log.info('SendQ created');
                resolve(data.QueueUrl);
            }
        });
    });
}

function createReceiveQueue(params) {
    if (params.QueueName != 'executor') {
        const err = new Error('Invalid queue name');
        return Promise.reject(err);
    }
    return new Promise((resolve, reject) => {
        SQS.createQueue(params, (err, data) => {
            if (err) {
                log.error("Error creating ReceiveQ: " + err);
                reject(err);
            } else {
                log.info('ReceiveQ created');
                resolve(data.QueueUrl);
            }
        });
    });
}

function createErrorQueue(params) {
    if (params.QueueName != 'errorMsgs') {
        const err = new Error('Invalid queue name');
        return Promise.reject(err);
    }
    return new Promise((resolve, reject) => {
        SQS.createQueue(params, (err, data) => {
            if (err) {
                log.error("Error creating errorQ: " + err);
                reject(err);
            } else {
                log.info('errorQ created');
                resolve(data.QueueUrl);
            }
        });
    });
}

function queuesUp() {
    return Promise.all([createSendQueue(_config.sendQParams),
        createReceiveQueue(_config.receiveQParams),
        createErrorQueue(_config.errorQParams)]);
}


function addMessageToSQSQueue(sendQ, msg) {
    const regex = /orchestrator$/i;
    if(!regex.test(sendQ)) {
        const err = new Error('Invalid value for sendQ parameter');
        return Promise.reject(err);
    }
    if((typeof(sendQ) != 'string') && (sendQ.length < 1)) {
        const err = new Error('The expected data type for the sendQ parameter must be a non-empty string');
        return Promise.reject(err);
    }
    if((typeof(msg) != 'string') && (msg.length < 1)) {
        const err = new Error('The message to be sent must be a non-empty string');
        return Promise.reject(err);
    }
    return new Promise((resolve, reject) => {
        SQS.sendMessage({QueueUrl: sendQ, MessageBody: msg, DelaySeconds: 0}, (err, data) => {
            if (err) {
                log.error("Error sending msg to executor: " + JSON.stringify(err));
                reject(err);
            } else {
                log.info(msg + " send to executor");
                resolve(true);
            }
        });
    });
}

function handleSQSMsg(msg, done) {
    log.debug('handleSQSMsg: msg from executor' + msg);
    done();
}

function handleExecutorErrorMsg(errMsg, done) {
    log.debug('handleExecutorErrorMsg: errorMsg from executor' + errMsg);
    done();
}

module.exports = {
    createSendQueue,
    createReceiveQueue,
    createErrorQueue,
    addMessageToSQSQueue,
    handleSQSMsg,
    handleExecutorErrorMsg,
    queuesUp,
    SQS
};
