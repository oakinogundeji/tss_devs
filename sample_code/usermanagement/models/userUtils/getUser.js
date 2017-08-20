'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const User = require('../users');
//=============================================================================
/**
 * Module functionality
 */
//=============================================================================
function getUser(username, res) {
    User.findOne({username: username}, (err, user) => {
        if(err) {
            console.log(`There was a dBase access error, while trying to access
                user with username: %s`, username);
            errorHandler(err);
            return res.status(500).json({error: "Something went wrong. Please try again later."});
        }
        else {
            if(!user) {
                return res.status(409).json({error: "User does not exist."});
            }
            else {
                return res.status(200).json(user.username);
            }
        }
    });
}
//=============================================================================
/**
 * Export module
 */
//=============================================================================
module.exports = getUser;
//=============================================================================
