'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const User = require('../users');
//=============================================================================
/**
 * module functionality
 */
//=============================================================================
function createUser(username, password, res) {
    User.findOne({username: username}, (err, user) => {
        if(err) {
            console.log(`There was a dBase access error, while trying to create
                user with username: %s`, username);
            errorHandler(err);
            return res.status(500).json({error: "Something went wrong. Please try again later."});
        }
        else {
            if(user) {
                return res.status(409).json({error: "A user with that username already exists."});
            }
            else {
                const newUser = new User();
                newUser.username = username;
                newUser.password = newUser.generateHash(password);
                newUser.save((err, user) => {
                    if(err) {
                        console.log(`There was a dBase access error, while trying to save
                            user with username: %s`, user.username);
                        errorHandler(err);
                        return res.status(500).json({error: "Something went wrong. Please try again later."});
                    }
                    return res.status(200).json(user.username);
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
module.exports = createUser;
//=============================================================================
