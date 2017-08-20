'use strict';
//=============================================================================
/**
*Module Dependencies
*/
//=============================================================================
const
  express = require('express'),
  passport = require('../utils/passport-config'),
  Promise = require('bluebird');
//=============================================================================
/**
*Create Router instance
*/
//=============================================================================
const router = express.Router();
//=============================================================================
/**
* Module variables
*/
//=============================================================================
const isLoggedIn = require('../utils/isLoggedIn');
//=============================================================================
/**
*Middleware
*/
//=============================================================================
router.use(passport.initialize());
router.use(passport.session());
//=============================================================================
/**
 * helpers
 */
//=============================================================================
function getUserProfile(req, res) {
  return isLoggedIn(req)
    .then(ok => {
      console.log('user logged in...');
      const
        user = req.user,
        profile = {
          local: {
            email: user.local.email
          },
          fb: {
            displayName: user.social.fb.displayName,
            email: user.social.fb.email,
            accessToken: user.social.fb.token
          },
          twitter: {
            displayName: user.social.twitter.displayName,
            handle: user.social.twitter.handle,
            location: user.social.twitter.metaData.location,
            description: user.social.twitter.metaData.description
          },
          photo: user.social.twitter.photo || user.social.fb.photo,
          acctLinkStatus: function () {
            let
              localLink = 'not linked',
              fbLink = 'not linked',
              twitterLink = 'not linked';
            if(this.local.email) {
              localLink = 'linked';
            }
            if(this.fb.displayName) {
              fbLink = 'linked';
            }
            if(this.twitter.displayName) {
              twitterLink = 'linked';
            }
            return {
              local: localLink,
              fb: fbLink,
              twitter: twitterLink
            };
          }
        },
        person = profile.local.email || profile.fb.displayName || profile.twitter.displayName,
        local = profile.local,
        facebook = profile.fb,
        twitter = profile.twitter,
        currentProfile = function getCurrentProfile() {
          if(local.email) {
            return 'local';
          }
          if(facebook.displayName) {
            return 'facebook';
          }
          return 'twitter';
        }(),
        linkStatus = profile.acctLinkStatus();
        return res.status(200).json({
          user: profile,
          currentProfile: currentProfile,
          person: person,
          linkStatus: linkStatus
        });
    })
    .catch(err => res.status(401).json(err));
}
//=============================================================================
/**
*Routes
*/
//=============================================================================
router.post('/login', (req, res, next) => {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
    }
    if (!user) {
      return res.status(409).json({errMsg: info.errMsg});
    }
    req.login(user, function (err) {
      if(err){
        console.error(err);
        return next(err);
      }
      return getUserProfile(req, res);
    });
  })(req, res, next);
});

router.post('/signup', (req, res, next) => {
  return passport.authenticate('local-signup', function(err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
    }
    if (!user) {
      return res.status(409).json({errMsg: info.errMsg});
    }
    return req.login(user, function (err) {
      if(err){
        console.error(err);
        return next(err);
      }
      return getUserProfile(req, res);
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  return res.status(200).json({success: true});
});
//---------------------------OAuth Routes---------------------------------------
router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/callback',
  passport.authenticate('twitter', {
      successRedirect : '/',
      failureRedirect : '/'
  })
);

router.get('/facebook', passport.authenticate('facebook', {scope: 'user_posts'}));
router.get('/facebook/callback',
  passport.authenticate('facebook', {
      successRedirect : '/',
      failureRedirect : '/'
  })
);
//---------------------------Account linkage routes-----------------------------
//facebook
router.get('/connect/facebook',
  passport.authorize('facebook', { failureRedirect: '/' })
);
router.get('/connect/facebook/callback',
  passport.authorize('facebook', {
      successRedirect : '/',
      failureRedirect : '/'
  })
);
//twitter
router.get('/connect/twitter',
  passport.authorize('twitter', { failureRedirect: '/' })
);
router.get('/connect/twitter/callback',
  passport.authorize('twitter', {
      successRedirect : '/',
      failureRedirect : '/'
  })
);
//=============================================================================
/**
*Export Module
*/
//=============================================================================
module.exports = router;
//=============================================================================
