'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const Job = require('../jobs');
//=============================================================================
/**
 * module functionality
 */
//=============================================================================
function createJob(job,res) {
    Job.findOne({name: job.name}, (err, result) => {
        if (err) {
            console.log(`There was a dBase access error while trying to create
                job with name: ${name}`, err);
            return res.status(500).json({error: "Something went wrong. Please try again later."});
        }
        else {
            if (result) {
                return res.status(409).json({error: "A job with that name already exists."});
            }
            else {
                const newJob = new Job();
                newJob.name = job.name;
                newJob.command = job.command;
                newJob.parameters = job.parameters;
                newJob.category = job.category;
                newJob.database = job.database;
                newJob.table = job.table;
                newJob.save((err, job) => {
                    if (err) {
                        console.log(`There was a dBase access error:%s, while trying to save job:`, err);
                        return res.status(500).json({error: "Something went wrong. Please try again later."});
                    }
                    return res.status(200).json(job.name);
                });
            }
        }
    });
}
//=============================================================================
/**
 * Export module
 */
//=============================================================================
module.exports = createJob;
//=============================================================================
