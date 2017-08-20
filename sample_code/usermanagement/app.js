'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const
    express = require('express'),
    helmet = require('helmet'),
    nocache = require('nocache'),
    hpp = require('hpp'),
    bParser = require('body-parser'),
    mongoose = require('mongoose');
//=============================================================================
/**
 * express instance
 */
//=============================================================================
const app = express();
//=============================================================================
/**
 * Module variables
 */
//=============================================================================
const
    port = process.env.PORT,
    env = process.env.NODE_ENV,
    DBURL = process.env.DBURL;
let db;
//=============================================================================
/**
 * App config
 */
//=============================================================================
app.set('port', port);
app.set('env', env);
const routes = require('./routes/routes');
//=============================================================================
/**
 * database config
 */
//=============================================================================
mongoose.connect(DBURL);
db = mongoose.connection;
db.on('error', err => {
  console.error('There was a db connection error');
  return  console.error(err.message);
});
db.once('connected', () => {
  return console.log('Successfully connected to ' + DBURL);
});
db.once('disconnected', () => {
  return console.error('Successfully disconnected from ' + DBURL);
});
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.error('dBase connection closed due to app termination');
    return process.exit(0);
  });
});
//=============================================================================
/**
 * Module middleware
 */
//=============================================================================
if(env != 'production') {
    require('clarify');
    app.use(require('morgan')('dev'));
}
app.use(helmet());
app.use(nocache());
app.use(bParser.json());
app.use(bParser.urlencoded({extended: true}));
app.use(hpp());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    if(req.method == 'OPTIONS') {
        res.status(200).end();
    }
    else {
        next();
    }
});
//=============================================================================
/**
 * Routes
 */
//=============================================================================
app.get('/test', (req, res) => {
    return res.status(200).json('OK');
});
app.use('/api', routes);
//=============================================================================
/**
 * Export app
 */
//=============================================================================
module.exports = app;
//=============================================================================
