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
 */
//=============================================================================
function deleteJobByName(name, res) {
    Job.findOneAndRemove({name: name}, (err, job) => {
        if(err) {
            console.log(`There was a dBase access error while trying to remove
                job with name: ${name}`, err);
            return res.status(500).json({error: "Something went wrong. Please try again later."});
        }
        else {
            if(!job) {
                return res.status(409).json({error: "Job does not exist."});
            }
            else {

                return res.status(200).json({'success': {'deleted': job.name}});
            }
        }
    });
}

function deleteJobByCategory(category, res) {
    Job.remove({category: category}, (err) => {
        if(err) {
            console.log(`There was a dBase access error while trying to remove
                job with category: ${category}`, err);
            return res.status(500).json({error: "Something went wrong. Please try again later."});
        }
        else {
            return res.status(200).json({'success': {'deleted': category}});

        }
    });
}
//=============================================================================
/**
 * Export module
 */
//=============================================================================
module.exports = {
    deleteJobByName,
    deleteJobByCategory
};
//=============================================================================
