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
    valid_update = {
        username:'John',
        updateProperty: 'email',
        updateValue: 'test@test.com'
    },
    valid_update_password = {
        username:'John',
        updateProperty: 'password',
        updateValue: 'test123'
    },
    invalid_update_wrong_username = {
        username:'Doe',
        updateProperty: 'email',
        updateValue: 'test@test.com'
    },
    invalid_update_no_username = {
        updateProperty: 'email',
        updateValue: 'test@test.com'
    },
    invalid_update_no_updateProperty = {
        username:'John',
        updateValue: 'test@test.com'
    },
    invalid_update_no_updateValue = {
        username:'John',
        updateProperty: 'email'
    };
//=============================================================================
/**
 * Tests
 */
//=============================================================================
describe('WE_JUST_DO User Management App, User update Tests', function () {
    this.timeout(10000);
    before(function (done) {
        User.create(valid_user, done);
      });
     after(function (done) {
        User.remove({}, done);
      });
    describe('PUT /api/updateUser', function () {
        describe('failing test', function () {
            it('should return HTTP 409 and "User does not exist"', function (done) {
                request.
                    put('/api/updateUser').
                    send(invalid_update_wrong_username).
                    expect(409).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.text.should.equal('{"error":"User does not exist."}');
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
        describe('failing test', function () {
            it('should return HTTP 409 and "Please provide username"', function (done) {
                request.
                    put('/api/updateUser').
                    send(invalid_update_no_username).
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
            it('should return HTTP 409 and "Please provide a property to update"', function (done) {
                request.
                    put('/api/updateUser').
                    send(invalid_update_no_updateProperty).
                    expect(409).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.text.should.equal('{"error":"Please provide a property to update."}');
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
        describe('failing test', function () {
            it('it should return HTTP 409 and "Please provide a value for the property"', function (done) {
                request.
                    put('/api/updateUser').
                    send(invalid_update_no_updateValue).
                    expect(409).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.text.should.equal('{"error":"Please provide a value for the property."}');
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
        describe('passing test', function () {
            it('should return HTTP 200 and the name of the updated property', function (done) {
                request.
                    put('/api/updateUser').
                    send(valid_update).
                    expect(200).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.body.success.updated.should.equal(valid_update.updateProperty);
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
        describe('passing test', function () {
            it('should return HTTP 200 and "password"', function (done) {
                request.
                    put('/api/updateUser').
                    send(valid_update_password).
                    expect(200).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.body.success.updated.should.equal('password');
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
    });
});
//=============================================================================
