'use strict';

const config = module.exports = {
    SQS: {
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
    }
};
