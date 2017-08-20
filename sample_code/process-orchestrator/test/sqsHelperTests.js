'use strict';
//=============================================================================
/**
* module dependencies
*/
//=============================================================================
const
    expect = require('chai').expect,
    SQS_MOCKS = require('./mocks/sqs-mocks');
//=============================================================================
/**
* module variables
*/
//=============================================================================
const config = {
    valid: {
        sendQParams: {
            Attributes: {
                ReceiveMessageWaitTimeSeconds: '20',
                VisibilityTimeout: '60'
            },
            QueueName: 'orchestrator'
        },
        receiveQParams: {
            Attributes: {
                ReceiveMessageWaitTimeSeconds: '20',
                VisibilityTimeout: '60'
            },
            QueueName: 'executor'
        },
        errorQParams: {
            Attributes: {
                ReceiveMessageWaitTimeSeconds: '20',
                VisibilityTimeout: '60'
            },
            QueueName: 'errorMsgs'
        }
    },
    invalid: {
        sendQParams: {
            Attributes: {
                ReceiveMessageWaitTimeSeconds: '20',
                VisibilityTimeout: '60'
            },
            QueueName: 'foo'
        },
        receiveQParams: {
            Attributes: {
                ReceiveMessageWaitTimeSeconds: '20',
                VisibilityTimeout: '60'
            },
            QueueName: 'bar'
        },
        errorQParams: {
            Attributes: {
                ReceiveMessageWaitTimeSeconds: '20',
                VisibilityTimeout: '60'
            },
            QueueName: 'baz'
        }
    }
};

let sendQ;
//=============================================================================
/**
* Tests suite
*/
//=============================================================================
describe('SQS Helper functions Unit tests', function () {
    describe('createSendQ tests', function () {
        describe('failing test', function () {
            it('should fail with error "Invalid queue name"', function (done) {
                SQS_MOCKS.createSendQueue(config.invalid.sendQParams)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('Invalid queue name');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass returning a URL string with value containing the string "orchestrator"', function (done) {
                SQS_MOCKS.createSendQueue(config.valid.sendQParams)
                    .then(data => {
                        expect(data).to.be.a('string');
                        expect(data).to.include('orchestrator');
                        sendQ = data;
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            });
        });
    });
    describe('createReceiveQueue tests', function () {
        describe('failing test', function () {
            it('should fail with error "Invalid queue name"', function (done) {
                SQS_MOCKS.createReceiveQueue(config.invalid.receiveQParams)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('Invalid queue name');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass returning a URL string with value containing the string "executor"', function (done) {
                SQS_MOCKS.createReceiveQueue(config.valid.receiveQParams)
                    .then(data => {
                        expect(data).to.be.a('string');
                        expect(data).to.include('executor');
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            });
        });
    });
    describe('createErrorQueue tests', function () {
        describe('failing test', function () {
            it('should fail with error "Invalid queue name"', function (done) {
                SQS_MOCKS.createErrorQueue(config.invalid.errorQParams)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('Invalid queue name');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass returning a URL string with value containing the string "errorMsgs"', function (done) {
                SQS_MOCKS.createErrorQueue(config.valid.errorQParams)
                    .then(data => {
                        expect(data).to.be.a('string');
                        expect(data).to.include('errorMsgs');
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            });
        });
    });
    describe('addMessageToSQSQueue tests', function () {
        describe('failing test', function () {
            it('should fail because of invalid QueueUrl parameter', function (done) {
                SQS_MOCKS.addMessageToSQSQueue('https://some_queue_url', 'valid msg')
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('Invalid QueueUrl or MessageBody parameters');
                        done();
                    });
            });
        });
        describe('failing test', function () {
            it('should fail because MessageBody is not a string', function (done) {
                SQS_MOCKS.addMessageToSQSQueue(sendQ, 1234)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.be.a('string');
                        expect(err).to.equal('Invalid QueueUrl or MessageBody parameters');
                        done();
                    });
            });
        });
        describe('failing test', function () {
            it('should fail because MessageBody is an empty string', function (done) {
                SQS_MOCKS.addMessageToSQSQueue(sendQ, '')
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('Invalid QueueUrl or MessageBody parameters');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass with valid QueueUrl and MessageBody parameters', function (done) {
                SQS_MOCKS.addMessageToSQSQueue(sendQ, 'Valid message')
                    .then(data => {
                        expect(data).to.be.true;
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            });
        });
    });
    describe('getSQSQueueSize tests', function () {
        describe('failing test', function () {
            it('should fail because of invalid sendQ value', function (done) {
                SQS_MOCKS.getSQSQueueSize('https://some_queue_url')
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('Invalid QueueUrl parameter');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass because of valid sendQ value', function (done) {
                SQS_MOCKS.getSQSQueueSize(sendQ)
                    .then(data => {
                        console.log('getSQSQueueSize data:', data);
                        expect(data).to.be.a('string');
                        expect(Number(data)).to.be.at.least(0);
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            });
        });
    });
});
//=============================================================================
