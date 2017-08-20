'use strict';
//=============================================================================
const
    expect = require('chai').expect,
    MEMCACHED_MOCKS = require('./mocks/memcache-mocks'),
    ECS_CLUSTER = process.env.ECS_CLUSTER,
    SQS_QUEUE_NAME = process.env.SQS_QUEUE_NAME;
//=============================================================================
/**
* module variables
*/
//=============================================================================
const
    MOCK_SQS_QUEUE_SIZE = Math.floor((Math.random() * 101) + 0),
    DATA = [
        JSON.stringify(MOCK_SQS_QUEUE_SIZE),
        {
            ECS_CONTAINER_INSTANCES_COUNT: 1,
            ECS_CLUSTER_TOTAL_CAPACITY: 10,
            ECS_CLUSTER_AVAILABLE_CAPACITY: 10,
            PARTIALLY_ENGAGED_INSTANCES_COUNT: 0,
            IDLE_INSTANCES_COUNT: 1,
            idleInstancesID: ['qwerty123456'],
            idleInstancesARN: ['uiopy098765'],
            partiallyEngagedInstances: [],
            existingInstancesARNS: ['uiopy098765']
        }
   ];
//=============================================================================
/**
* Test suite
*/
//=============================================================================
describe('Memcache Helper functions Unit tests', function () {
    this.timeout(10000);
    before(function (done) {
        MEMCACHED_MOCKS.MEMCACHED_CLIENT.flush((err, resp) => {
            if(err) {
                done(err);
            }
            done(null, resp);
        });
      });
     after(function (done) {
         MEMCACHED_MOCKS.MEMCACHED_CLIENT.flush((err, resp) => {
             if(err) {
                 done(err);
             }
             done(null, resp);
         });
      });
    describe('storeSQSandClusterState tests', function () {
        describe('failing test', function () {
            it('should fail because no data is provided for storage', function (done) {
                MEMCACHED_MOCKS.storeSQSandClusterState(null, ECS_CLUSTER, SQS_QUEUE_NAME)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('data argument cannot be null or empty');
                        done();
                    });
            });
        });
        describe('failing test', function () {
            it('it should fail because of invalid ECS_CLUSTER value', function (done) {
                MEMCACHED_MOCKS.storeSQSandClusterState(DATA, 'some_cluster', SQS_QUEUE_NAME)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('The ECS_CLUSTER argument must be a non empty string equal to the ECS_CLUSTER environment value');
                        done();
                    });
            });
        });
        describe('failing test', function () {
            it('it should fail because of invalid SQS_QUEUE_NAME value', function (done) {
                MEMCACHED_MOCKS.storeSQSandClusterState(DATA, ECS_CLUSTER, 'some_queue_name')
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('The SQS_QUEUE_NAME argument must be a non empty string equal to the SQS_QUEUE_NAME environment value');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass because all parameters are valid', function (done) {
                MEMCACHED_MOCKS.storeSQSandClusterState(DATA, ECS_CLUSTER, SQS_QUEUE_NAME)
                    .then(data => {
                        expect(data).to.be.ok;
                        done();
                    })
                    .catch(err => {
                        done(err);
                    })
            });
        });
    });
    describe('getSQSQueueSize tests', function () {
        describe('failing test', function () {
            it('should fail because invalid data type used as queueName argument', function (done) {
                MEMCACHED_MOCKS.getSQSQueueSize(1)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('queueName argument must be a string');
                        done();
                    });
            });
        });
        describe('failing test', function () {
            it('should fail because of invalid value for queueName argument', function (done) {
                MEMCACHED_MOCKS.getSQSQueueSize('some_queue_name')
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('The queueName argument must be a non empty string equal to the SQS_QUEUE_NAME environment value');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass because valid queueName argument is used', function (done) {
                MEMCACHED_MOCKS.getSQSQueueSize(SQS_QUEUE_NAME)
                    .then(data => {
                        expect(JSON.parse(data)).to.be.at.least(0);
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            });
        });
    });
    describe('getClusterState tests', function () {
        describe('failing test', function () {
            it('should fail because invalid data type used as clusterName argument', function (done) {
                MEMCACHED_MOCKS.getClusterState(1)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('clusterName argument must be a string');
                        done();
                    });
            });
        });
        describe('failing test', function () {
            it('should fail because invalid value passed as clusterName argument', function (done) {
                MEMCACHED_MOCKS.getClusterState('some_cluster')
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('The clusterName argument must be a non empty string equal to the ECS_CLUSTER environment value');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass becasue valid value used for clusterName argument', function (done) {
                MEMCACHED_MOCKS.getClusterState(ECS_CLUSTER)
                    .then(data => {
                        expect(JSON.parse(data)).to.deep.equal(DATA[1]);
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            });
        });
    });
    describe('getSQSState tests', function () {
        describe('failing test', function () {
            it('should fail because invalid data type passed as queueName argument', function (done) {
                MEMCACHED_MOCKS.getSQSState(1)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('queueName argument must be a string');
                        done();
                    });
            });
        });
        describe('failing test', function () {
            it('should fail because invalid value passed as queueName argument', function (done) {
                MEMCACHED_MOCKS.getSQSState('some_queue_name')
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('The queueName argument must be a non empty string equal to the SQS_QUEUE_NAME environment value');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass becasue valid value used for queueName argument', function (done) {
                MEMCACHED_MOCKS.getSQSState(SQS_QUEUE_NAME)
                    .then(data => {
                        expect(JSON.parse(data)).to.be.at.least(0);
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            });
        });
    });
    describe('getNewClusterResources tests', function () {
        describe('failing test', function () {
            it('should fail because invalid data type passed as cluster argumant', function (done) {
                MEMCACHED_MOCKS.getNewClusterResources(1, 1)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('cluster argument must be a string');
                        done();
                    });
            });
        });
        describe('failing test', function () {
            it('it should fail because of invalid value passed as cluster argument', function (done) {
                MEMCACHED_MOCKS.getNewClusterResources('some_cluster', 1)
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('The cluster argument must be a non empty string equal to the ECS_CLUSTER environment value');
                        done();
                    });
            });
        });
        describe('failing test', function () {
            it('should fail because invalid data type passed as REQUIRED argumant', function (done) {
                MEMCACHED_MOCKS.getNewClusterResources(ECS_CLUSTER, '1')
                    .then(data => {
                        const errVal = new Error(data);
                        done(errVal);
                    })
                    .catch(err => {
                        expect(err).to.equal('REQUIRED argument must be a number');
                        done();
                    });
            });
        });
        describe('passing test', function () {
            it('should pass because all parameters are valid', function (done) {
                MEMCACHED_MOCKS.getNewClusterResources(ECS_CLUSTER, 1)
                    .then(data => {
                        expect(data.length).to.be.at.least(1);
                        done();
                    })
                    .catch(err => {
                        done(err);
                    })
            });
        });
    });
    describe('MEMCACHED_CLIENT tests', function () {
        describe('passing test', function () {
            it('should pass because MEMCACHED_CLIENT connected successfully to the memecached server', function (done) {
                MEMCACHED_MOCKS.MEMCACHED_CLIENT.stats((err, resp) => {
                    if(err) {
                        console.error('passss errr =>', err);
                        done(err);
                    } else {
                        console.log('pass resp', resp);
                        done();
                    }
                });
            });
        });
    });
});
//=============================================================================
