'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const
    mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs');
//=============================================================================
/**
 * User Schema
 */
//=============================================================================
const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    date_joined: {
        type: Date,
        default: Date.now,
        required: true
    },
    properties: [{
        property: String,
        value: String
    }]
});
//=============================================================================
/**
 * Implement indexing by username
 */
//=============================================================================
UserSchema.index({username: 1});
//=============================================================================
/**
 * Schema methods
 */
//=============================================================================
UserSchema.methods.generateHash = password => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

UserSchema.methods.validPassword = password => {
    return bcrypt.compareSync(password, this.password);
};
//=============================================================================
/**
 * Compile to Model
 */
//=============================================================================
const UserModel = mongoose.model('User', UserSchema);
//=============================================================================
/**
 * Export User Model
 */
//=============================================================================
module.exports = UserModel;
//=============================================================================
