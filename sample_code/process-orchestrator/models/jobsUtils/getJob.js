'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const Job = require('../jobs');
//=============================================================================
/**
 * Module functionality
 * Either return API call success or Promise for data manipulation
 * TBC
 */
//=============================================================================
function getJobByName(name, res) {
    Job.findOne({name: name}, (err, job) => {
        if(err) {
            console.log(`There was a dBase access error, while trying to access
                job with name: ${name}`);
            return res.status(500).json({error: "Something went wrong. Please try again later."});
        }
        else {
            if(!job) {
                return res.status(409).json({error: "Job does not exist."});
            }
            else {
                return res.status(200).json(job);
            }
        }
    });
}

function getCommandForJob(name){
    return Job.findOne({name: name});
}

function getJobByCategory(category, res) {
    Job.find({category: category}, (err, job) => {
        if(err) {
            console.log(`There was a dBase access error, while trying to access
                job with category: ${category}`);
            return res.status(500).json({error: "Something went wrong. Please try again later."});
        }
        else {
            if(!job) {
                return res.status(409).json({error: "Job does not exist."});
            }
            else {
                return res.status(200).json(job);
            }
        }
    });
}
//=============================================================================
/**
 * Export module
 */
//=============================================================================
module.exports = {
    getJobByName,
    getJobByCategory,
    getCommandForJob
};
//=============================================================================
