'use strict';
process.env.NODE_ENV = 'test';
//=============================================================================
/**
 * dependencies
 */
//=============================================================================
const
    server = require('../server'),
    should = require('chai').should(),
    User = require('../models/users');
let request = require('supertest');
//=============================================================================
/**
 * config
 */
//=============================================================================
request = request(server);
function errorHandler(err, done) {
    console.log('There was an error running the test');
    console.error(err);
    return done(err);
}
//=============================================================================
/**
 * variables
 */
//=============================================================================
const
    valid_user = {
        username: 'John',
        password: 'qwerty123'
    },
    no_username = {
        password: 'qwerty123'
    },
    no_password = {
        username: 'John'
    };
//=============================================================================
/**
 * Tests
 */
//=============================================================================
describe('WE_JUST_DO User Management App, User creation Tests', function () {
    before(function (done) {
        User.remove({}, done);
      });
     after(function (done) {
        User.remove({}, done);
      });
    describe('POST /api/createUser', function () {
        describe('failing test', function () {
            it('should return HTTP 409 and "Please provide username"', function (done) {
                request.
                    post('/api/createUser').
                    send(no_username).
                    expect(409).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.text.should.equal('{"error":"Please provide username."}');
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
        describe('failing test', function () {
            it('should return HTTP 409 and "Please provide password"', function (done) {
                request.
                    post('/api/createUser').
                    send(no_password).
                    expect(409).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.text.should.equal('{"error":"Please provide password."}');
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
        describe('passing test', function () {
            it('should return HTTP 200 and a string equal to valid username', function (done) {
                request.
                    post('/api/createUser').
                    send(valid_user).
                    expect(200).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.body.should.equal(valid_user.username);
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
        describe('failing test', function () {
            it('should return HTTP 409 and "A user with that username already exists"', function (done) {
                request.
                    post('/api/createUser').
                    send(valid_user).
                    expect(409).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.text.should.equal('{"error":"A user with that username already exists."}');
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
    });
});
//=============================================================================
