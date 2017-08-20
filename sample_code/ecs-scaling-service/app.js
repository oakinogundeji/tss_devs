'use strict';
if(process.env.NODE_ENV == "development") {
    require('dotenv').config();
}
//=============================================================================
const
    cp = require('child_process'),
    Promise = require('bluebird');
//=============================================================================
/**
 * Helpers
 */
//=============================================================================
const helpers = require('./helpers'),
    SQSHelper = helpers.SQShelper,
    log = helpers.Logger.getLogger("ProcessOrchestrator");

//=============================================================================
/**
 * App config
 */
//=============================================================================

const ENV = process.env.NODE_ENV || 'development';

let PO_QUEUE;

function startChildProcesses() {
    /*const STATE_MONITOR = cp.fork('./state-monitor', [PO_QUEUE], {silent: true}),
        AUTO_SCALE_IN = cp.fork('./scale-in', [], {silent: true});*/

    const STATE_MONITOR = cp.fork('./state-monitor', [PO_QUEUE]),
        AUTO_SCALE_IN = cp.fork('./scale-in', []);

    STATE_MONITOR.on('error', err => {
        log.error('error forking state-monitor process: ' + err);
    });

    AUTO_SCALE_IN.on('error', err => {
        log.error('error forking auto scale in process: ' + err);
    });

    STATE_MONITOR.on('exit', code => {
        log.warn('state-monitor process exited with code' + code);
    });
    AUTO_SCALE_IN.on('exit', code => {
        log.warn('auto scale in process exited with code' + code);
    });
}
//=============================================================================
/**
 * Define main function
 */
//=============================================================================
function main() {
    SQSHelper.getQueues()
        .then(data => {
            log.debug('getQueues data', data);
            console.log('getQueues data', data);
            PO_QUEUE = data.filter(url => {
                const regex = /orchestrator$/i;
                return regex.test(url);
            })[0];

            log.debug('PO_QUEUE:', PO_QUEUE);
            console.log('PO_QUEUE:', PO_QUEUE);

            console.log('All good...');

            startChildProcesses();

        })
        .catch(err => {
            log.error("Error starting ECSSS app: " + JSON.stringify(err));
            console.error("Error starting ECSSS app: " + JSON.stringify(err));
        });
}

main();
//=============================================================================
/**
 * Export module
 */
//=============================================================================
module.exports = main;
//=============================================================================
