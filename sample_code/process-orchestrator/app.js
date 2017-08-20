'use strict';
if(process.env.NODE_ENV == 'development') {
    require('dotenv').config();
}
//=============================================================================
const
    http = require('http'),
    express = require('express'),
    bParser = require('body-parser'),
    cp = require('child_process'),
    SQS_CONSUMER = require('sqs-consumer'),
    Promise = require('bluebird'),
    mongoose = require('mongoose'),
    app = express(),
    server = http.createServer(app),
    createJob = require('./models/jobsUtils').createJob,
    getJob = require('./models/jobsUtils').getJob,
    deleteJob = require('./models/jobsUtils').deleteJob,
    updateJob = require('./models/jobsUtils').updateJob;

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

const
    PORT = process.env.PORT || 3030,
    ENV = process.env.NODE_ENV || 'development',
    DBURL = process.env.DBURL;

app.set('port', PORT);
app.set('env', ENV);

//=============================================================================
/**
 * middleware pipeline
 */
//=============================================================================
if (ENV != 'production') {
    app.use(require('morgan')('dev'));
    require('clarify');
}

app.use(bParser.json());
app.use(bParser.urlencoded({extended: true}));


let sendQ,
    receiveQ,
    errorQ,
    db;


function processMessageFromExecutor() {
    log.debug('processMessageFromExecutor up!');

    const executor = SQS_CONSUMER.create({
        queueUrl: receiveQ,
        handleMessage: SQSHelper.handleSQSMsg,
        sqs: SQSHelper.SQS
    });

    executor.on('error', err => {
        log.error('executor msg error: ' + err);
    });

    executor.on('message_received', msg => {
        log.info('just received a msg from executor:' + msg);
    });

    executor.on('message_processed', msg => {
        log.info('finished processing msg:' + msg);
    });

    executor.on('processing_error', err => {
        log.error('there was a processing error: ' + err);
    });

    executor.start();
}

function processErrorMessageFromExecutor() {
    log.debug('processErrorMessageFromExecutor up!');

    const executorError = SQS_CONSUMER.create({
        queueUrl: errorQ,
        handleMessage: SQSHelper.handleExecutorErrorMsg,
        sqs: SQSHelper.SQS
    });

    executorError.on('error', err => {
        log.error('executor msg error: ' + err);
    });

    executorError.on('executorError message_received', msg => {
        log.info('just received a msg from executor:' + msg);
    });

    executorError.on('executorError message_processed', msg => {
        log.info('finished processing msg:' + msg);
    });

    executorError.on('executorError processing_error', err => {
        log.error('there was a processing error: ' + err);
    });

    executorError.start();
}
//=============================================================================
/**
 * Database
 */
//=============================================================================

mongoose.connect(DBURL);
db = mongoose.connection;
db.on('error', err => {
    log.error('There was a db connection error: ' + err);
});
db.once('connected', () => {
    return log.info('Successfully connected to ' + DBURL);
});
db.once('disconnected', () => {
    log.info('Successfully disconnected from ' + DBURL);
});
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        log.error('dBase connection closed due to app termination');
        return process.exit(0);
    });
});

//=============================================================================
/**
 * Routes
 */
//=============================================================================


app.get('/test', (req, res) => {
    return res.status(200).json('Healthy!');
});

app.post('/api/runRobot', (req, res) => {
    if(!req.body.name){
        return res.status(409).json({error: "Please provide name of robot."});
    }
    else{
        const
            name = req.body.name,
            commandPromise = getJob.getCommandForJob(name);

        commandPromise.then(function(result,err){
            if(err){
                console.log('ERROR: ' + err);
                return res.status(500).json('Error running robot: ' + name + ' Error Message: ' + err);
            }else{
                console.log(result);
                var cmd = result.command;
                return {
                    command: cmd,
                    parameters: result.parameters,
                    database: result.database,
                    table: result.table
                };
            }
        }).then(function(instruction){
            instruction = JSON.stringify(instruction);
            SQSHelper.addMessageToSQSQueue(sendQ, instruction);
            return res.status(200).json('Running robot: ' + name);
        });
    }
});

app.post('/api/createJob', (req,res) => {
    if(!req.body.name) {
        return res.status(409).json({error: "Please provide name of robot."});
    }
    else if(!req.body.command) {
        return res.status(409).json({error: "Please provide command to run robot."});
    }
    else {
        const
            job = {
                name: req.body.name,
                command: req.body.command,
                parameters: req.body.parameters,
                category: req.body.category,
                database: req.body.database,
                table: req.body.table
            };
        return createJob(job,res);
    }
});

app.post('/api/deleteJobByName', (req,res) => {
    if(!req.body.name) {
        return res.status(409).json({error: "Please provide Job Name."});
    }
    else{
        const name = req.body.name;
        return deleteJob.deleteJobByName(name,res);
    }
});

app.get('/api/getJobByName', (req, res) => {
    if(!req.query.name) {
        return res.status(409).json({error: "Please provide job name."});
    }
    else{
        const name = req.query.name;
        return getJob.getJobByName(name,res);
    }
});

app.post('/api/updateJob', (req,res) => {
    if(!req.body.name){
        return res.status(409).json({error: "Please provide Job Name."});
    }
    else if(!req.body.property){
        return res.status(409).json({error: "Please provide Job Property to update."});
    }
    else if(!req.body.value){
        return res.status(409).json({error: "Please provide Job Property update value."});
    }
    else{
        const name = req.body.name,
            property = req.body.property,
            value = req.body.value;
        return updateJob(name,property,value,res);
    }
});
//=============================================================================
/**
 * Bind server to port
 */
//=============================================================================
SQSHelper.queuesUp()
    .then(data => {
        log.debug('qUp data', data);
        sendQ = data.filter(url => {
            const regex = /orchestrator$/i;
            return regex.test(url);
        })[0];
        receiveQ = data.filter(url => {
            const regex = /executor$/i;
            return regex.test(url);
        })[0];
        errorQ = data.filter(url => {
            const regex = /errorMsgs$/i;
            return regex.test(url);
        })[0];

        log.debug('sendQ', sendQ);
        log.debug('receiveQ', receiveQ);
        log.debug('errorQ', errorQ);

        server.listen(PORT, () => {
            console.log('All good!');
            return log.info(`Scheduler up on port: ${server.address().port} in ${ENV} mode`);
        });

        processMessageFromExecutor();
        processErrorMessageFromExecutor();
    })
    .catch(err => {
        log.error("Error starting app: " + err);
    });

//=============================================================================
/**
 * Export module
 */
//=============================================================================
module.exports = server;
//=============================================================================
