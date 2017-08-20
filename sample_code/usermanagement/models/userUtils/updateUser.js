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
function updateUser(username, property, value, res) {
    User.findOne({username: username}, (err, user) => {
        if(err) {
            console.log(`There was a dBase access error, while trying to update
                user with username: %s`, username);
            errorHandler(err);
            return res.status(500).json({error: "Something went wrong. Please try again later."});
        }
        else {
            if(!user) {
                return res.status(409).json({error: "User does not exist."});
            }
            else {
                if(property == 'password') {
                    user.password = user.generateHash(value);
                }
                else {
                    user.properties.push({
                        property: property,
                        value: value
                    });
                }
                user.save((err, user) => {
                    if(err) {
                        console.log(`There was a dBase access error, while trying
                            to save updates to user with username: ${user.username}`);
                        errorHandler(err);
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
module.exports = updateUser;
//=============================================================================
