'use strict';
//=============================================================================
/**
 * Import sub-modules
 */
//=============================================================================
const
    createUser = require('./createUser'),
    getUser = require('./getUser'),
    deleteUser = require('./deleteUser'),
    updateUser = require('./updateUser');
//=============================================================================
/**
 * Export module
 */
//=============================================================================
module.exports = {
    createUser,
    getUser,
    updateUser,
    deleteUser
};
//=============================================================================
