'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const mongoose = require('mongoose');
//=============================================================================
/**
 * Jobs Schema
 */
//=============================================================================
const JobsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    command: {
        type: String,
        required: true
    },
    category:{
        type:String
    },
    parameters: {
        type: Array,
        default : []
    },
    database:{
        type: String,
        required: true
    },
    table:{
        type: String,
        required: true
    },
    last_run_date: {
        type: Date
    },
    last_run_result: {
        type:String
    }

});
//=============================================================================
/**
 * Compile to Model
 */
//=============================================================================
const JobsModel = mongoose.model('Jobs', JobsSchema);
//=============================================================================
/**
 * Export Jobs Model
 */
//=============================================================================
module.exports = JobsModel;
//=============================================================================
