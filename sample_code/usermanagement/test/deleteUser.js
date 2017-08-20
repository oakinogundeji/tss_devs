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
    valid_delete = {username:'John'},
    invalid_delete_wrong_username = {username:'Doe'},
    invalid_update_no_username = {};
//=============================================================================
/**
 * Tests
 */
//=============================================================================
describe('WE_JUST_DO User Management App, User delete Tests', function () {
    before(function (done) {
        User.create(valid_user, done);
      });
     after(function (done) {
        User.remove({}, done);
      });
    describe('DELETE /api/deleteUser', function () {
        describe('failing test', function () {
            it('should return HTTP 409 and "User does not exist"', function (done) {
                request.
                    delete('/api/deleteUser').
                    send(invalid_delete_wrong_username).
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
                    delete('/api/deleteUser').
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
        describe('passing test', function () {
            it('should return HTTP 200 and the deleted username', function (done) {
                request.
                    delete('/api/deleteUser').
                    send(valid_delete).
                    expect(200).
                    end(function (err, res) {
                        if(err) {
                            return errorHandler(err, done);
                        }
                        else {
                            res.body.success.deleted.should.equal(valid_delete.username);
                            res.header['content-type'].should.include('application/json');
                            done();
                        }
                    });
            });
        });
    });
});
//=============================================================================
