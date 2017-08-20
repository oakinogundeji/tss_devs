'use strict';
//=============================================================================
/**
 * Module dependencies
 */
//=============================================================================
const
  nodemailer = require('nodemailer'),
  sgTransport = require('nodemailer-sendgrid-transport'),
  Promise = require('bluebird');
//=============================================================================
/**
 * Module variables
 */
//=============================================================================
const
  sgtOptions = {
    auth: {
        api_key: process.env.SENDGRID_APIKEY
      }
    },
  mailer = nodemailer.createTransport(sgTransport(sgtOptions));
//=============================================================================
/**
 * Export Module
 */
//=============================================================================
module.exports = function (sender, senderName, recipient, content) {
  const msg = {
    to: recipient,
    from: sender,
    subject: senderName + ' suggests you should try Percayso',
    text: content
  };
  //send email
  return new Promise((resolve, reject) => {
    mailer.sendMail(msg, function(err, resp) {
      if(err) {
        console.error(err);
        return reject(err);
        }
        console.log(resp);
        return resolve(resp);
    });
  });
};
//=============================================================================
