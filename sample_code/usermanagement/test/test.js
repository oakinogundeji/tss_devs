'use strict';
process.env.NODE_ENV = 'test';
//=============================================================================
/**
 * dependencies
 */
//=============================================================================
const
    server = require('../server'),
    should = require('chai').should();
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
 * Tests
 */
//=============================================================================
describe('GET /test', function () {
    it('should respond with HTTP 200 and JSON OK', function (done) {
        request.
            get('/test').
            expect(200).
            end(function (err, res) {
                if(err) {
                    return errorHandler(err, done);
                }
                else {
                    res.body.toLowerCase().should.equal('ok');
                    res.header['content-type'].should.include('application/json');
                    done();
                }
            });
    });
});
//=============================================================================
