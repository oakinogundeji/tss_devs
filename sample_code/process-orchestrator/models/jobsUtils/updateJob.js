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
function updateJob(name, property, value, res) {
    Job.findOne({name: name}, (err, result) => {
        if(err) {
            console.log(`There was a dBase access error, while trying to update job with job_name: ${name}`);
            return res.status(500).json({error: "Something went wrong. Please try again later."});
        }
        else {
            if(!result) {
                return res.status(409).json({error: "User does not exist."});
            }
            else {
                switch (property){
                    case 'command':
                        result.command = value;
                        break;
                    case 'category':
                        result.category = value;
                        break;
                    case 'parameters':
                        result.parameters = value;
                        break;
                    case 'database':
                        result.database = value;
                        break;
                    case 'table':
                        result.table = value;
                        break;
                    default :
                        return res.status(500).json({error:"Sorry, you can't update that property"});
                }

                result.save((err, job) => {
                    if(err) {
                        console.log(`There was a dBase access error, while trying to save updates to job: ` + err);
                        return res.status(500).json({error: "Something went wrong. Please try again later."});
                    }
                    return res.status(200).json({'success': {'updated': property}});
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
module.exports = updateJob;
//=============================================================================
