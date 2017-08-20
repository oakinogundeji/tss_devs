'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const
    express = require('express'),
    createUser = require('../models/userUtils').createUser,
    getUser = require('../models/userUtils').getUser,
    updateUser = require('../models/userUtils').updateUser,
    deleteUser = require('../models/userUtils').deleteUser;
//=============================================================================
/**
 * Router instance
 */
//=============================================================================
const router = express.Router();
//=============================================================================
/**
 * API Routes
 */
//=============================================================================
router.post('/createUser', (req, res) => {
    if(!req.body.username) {
        return res.status(409).json({error: "Please provide username."});
    }
    else if(!req.body.password) {
        return res.status(409).json({error: "Please provide password."});
    }
    else {
        const
            username = req.body.username,
            password = req.body.password;
        return createUser(username, password, res);
    }
});

router.get('/getUser', (req, res) => {
    if(!req.query.username) {
        return res.status(409).json({error: "Please provide username."});
    }
    else {
        const username = req.query.username;
        return getUser(username, res);
    }
});

router.put('/updateUser', (req, res) => {
    if(!req.body.username) {
        return res.status(409).json({error: "Please provide username."});
    }
    else if(!req.body.updateProperty) {
        return res.status(409).json({error: "Please provide a property to update."});
    }
    else if(!req.body.updateValue) {
        return res.status(409).json({error: "Please provide a value for the property."});
    }
    else {
        const
            username = req.body.username,
            property = req.body.updateProperty,
            value = req.body.updateValue;
        return updateUser(username, property, value, res);
    }
});

router.delete('/deleteUser', (req, res) => {
    if(!req.body.username) {
        return res.status(409).json({error: "Please provide username."});
    }
    else {
        const username = req.body.username;
        return deleteUser(username, res);
    }
});
//=============================================================================
/**
 * Export Router
 */
//=============================================================================
module.exports = router;
//=============================================================================
