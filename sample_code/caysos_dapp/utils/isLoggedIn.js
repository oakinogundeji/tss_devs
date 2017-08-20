'use strict';

const Promise = require('bluebird');

function isLoggedIn(req) {
  console.log('isLoggedIn triggered...');
  return new Promise((resolve, reject) => {
    if(req.isAuthenticated()) {
      return resolve(true);
    } else {
      return reject(false);
    }
  });
}

module.exports = isLoggedIn;
