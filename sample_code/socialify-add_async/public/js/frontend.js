'use strict';
/**
*Module dependencies
*/
//-----------------------------------------------------------------------------
var
  Vue = require('vue'),
  VueRouter = require('vue-router')
  $ = require('jquery');
//=============================================================================
/**
*Module variables
*/
//-----------------------------------------------------------------------------
var
  socket = io(),
  appStateGlobal = {
    profileInfo: {
      fname: window.userdata.fname,
      lname: window.userdata.lname,
      email: window.userdata.email,
      photo: window.userdata.photo,
      status: window.userdata.status,
      hasFriends: window.userdata.hasFriends,
      hasPage: window.userdata.hasPage
    }
  };
function generateRandomFileName(filename) {
  var
    ext_regex = /(?:\.([^.]+))?$/,
    ext = ext_regex.exec(filename)[1],
    date = new Date().getTime(),
    xterBank = 'abcdefghijklmnopqrstuvwxyz',
    fstring = '',
    i;
  for(i = 0; i < 15; i++) {
    fstring += xterBank[parseInt(Math.random()*26)];
  }
  return (fstring += date +'.'+ ext);
}
//=============================================================================
/**
*Module config
*/
//-----------------------------------------------------------------------------
//Vue resource setup
Vue.use(require('vue-resource'));
Vue.http.options.root = '/root';
Vue.http.headers.common['Authorization'] = 'Basic YXBpOnBhc3N3b3Jk';
//Vue router setup
Vue.use(VueRouter);
//initial socket connection
socket.on('connect', function () {
  console.log('Connected to Socialify server!!');
  if(appStateGlobal.profileInfo.hasPage) {
    return socket.emit('getUserPageInfo');
  }
  return null;
});
//on disconnect
socket.on('disconnect', function () {
  return console.log('Disconnected from Socialify server!!');
});
//=============================================================================
/**
*Define base app
*/
//-----------------------------------------------------------------------------
var App = Vue.extend({
  template: require('./baseAppTemplate.html'),
  data: function () {
    return {
      userMetaData: {
        profileInfo: {
          fname: appStateGlobal.profileInfo.fname,
          lname: appStateGlobal.profileInfo.lname,
          email: appStateGlobal.profileInfo.email,
          photo: appStateGlobal.profileInfo.photo,
          status: appStateGlobal.profileInfo.status,
          hasFriends: appStateGlobal.profileInfo.hasFriends,
          hasPage: appStateGlobal.profileInfo.hasPage,
          friendsList: []
        }
      },
      userActivity: [],
      appTrends: [],
      chatVisible: false
    };
  },
  computed: {

  },
  methods: {
    showChat: function () {
      console.log('show chat btn clciked');
      console.log('text of show chat btn', this.$els.showChatBtn.textContent);
      if(!this.chatVisible) {
        this.chatVisible = true;
        return this.$els.showChatBtn.textContent = 'Hide Chat';
      }
      this.chatVisible = false;
      return this.$els.showChatBtn.textContent = 'Show Chat';
    }
  },
  events : {
    'newPageCreated': function () {
      console.log('new page created event received by base app');
      this.hasPage = true;
      return console.log('updated value for has page from base app', this.hasPage);
    },
    'userStatusChanged': function () {
      console.log('base app notified of user status change');
      var notification = '<p>'+ this.userMetaData.profileInfo.fname +' '+
        this.userMetaData.profileInfo.lname +' has changed status</p>';
      return this.userActivity.unshift(notification);
    },
    'newPostCreated': function (title) {
      console.log('base app notified of creation of post with title', title);
      var notification = '<p>'+ this.userMetaData.profileInfo.fname +' '+
        this.userMetaData.profileInfo.lname +' has created a post entitled ' +'"'+
        title +'"</p>';
      return this.userActivity.unshift(notification);
    },
    'likedPost': function (title) {
      console.log('base app notified of user like of post with title', title);
      var notification = '<p>'+ this.userMetaData.profileInfo.fname +' '+
        this.userMetaData.profileInfo.lname +' liked a post entitled ' +'"'+
        title +'"</p>';
      return this.userActivity.unshift(notification);
    },
    'commentOnPost': function (title) {
      console.log('base app notified of user comment on post with title', title);
      var notification = '<p>'+ this.userMetaData.profileInfo.fname +' '+
        this.userMetaData.profileInfo.lname +' commented on a post entitled ' +'"'+
        title +'"</p>';
      return this.userActivity.unshift(notification);
    },
    'likedComment': function (author) {
      console.log('base app notified of user liking a comment by', author);
      var notification = '<p>'+ this.userMetaData.profileInfo.fname +' '+
        this.userMetaData.profileInfo.lname +' liked a comment made by ' +'"'+
        author +'"</p>';
      return this.userActivity.unshift(notification);
    },
    'addedFriend': function (friend) {
      console.log('base app notified of user liking a comment by', friend);
      var notification = '<p>'+ this.userMetaData.profileInfo.fname +' '+
        this.userMetaData.profileInfo.lname +' has added a new friend ' +'"'+
        friend +'"</p>';
      this.userActivity.unshift(notification);
      return socket.emit('addedFriend', friend);//required to update feed
    }
  },
  components: {
    'app-nav': require('./components/app_nav'),
    'app-contact-list': require('./components/app_contact_list'),
    'app-chat': require('./components/app_chat')($, socket),
    'app-feeds': require('./components/app_feeds')($, socket)
  },
  ready: function () {
    var self = this;
    //check if logged in user already has a 'page'
    if(!appStateGlobal.profileInfo.hasPage) {
        //if not - set page to '/profile'
        this.$route.router.go({name: 'profile'});
      }
      //else - set page to '/hub'
    else {        
        socket.emit('getUserPageInfo');
        console.log('requesting for user proflie info');
        socket.emit('getUserProfileInfo');
        this.$route.router.go({name: 'hub'});
      }
      //after user creates new page and uploads profile pix
      socket.on('updatedUserInfo', function (data) {
        this.userMetaData.profileInfo.fname = data.firstName;
        this.userMetaData.profileInfo.lname = data.lastName;
        this.userMetaData.profileInfo.email = data.email;
        this.userMetaData.profileInfo.photo = data.profilePhoto;
        this.userMetaData.profileInfo.status = data.status;
        this.userMetaData.profileInfo.hasFriends = data.hasFriends;
        this.userMetaData.profileInfo.hasPage = data.hasPage;
        this.userMetaData.profileInfo.friendsList = data.friendsList;
        console.log('updated user info', data);
        return this.$route.router.go({name: 'hub'});
      }.bind(this));
      //after any user profile data update
      socket.on('updatedUserProfile', function () {
        return socket.emit('getUserProfileInfo');;
      });
      //when user profile is requested
      socket.on('userProfileInfo', function (data) {
        console.log('got user profile info');
        console.log('the user profile', data);
        this.userMetaData.profileInfo.fname = data.firstName;
        this.userMetaData.profileInfo.lname = data.lastName;
        this.userMetaData.profileInfo.email = data.email;
        this.userMetaData.profileInfo.photo = data.profilePhoto;
        this.userMetaData.profileInfo.status = data.status;
        this.userMetaData.profileInfo.hasFriends = data.hasFriends;
        this.userMetaData.profileInfo.hasPage = data.hasPage;
        this.userMetaData.profileInfo.friendsList = data.friendsList;
        return null;
      }.bind(this));
      //when friend status changes
      socket.on('statusChangeNotification', function (data) {
        return this.userActivity.unshift(data);
      }.bind(this));
      //when user has been tagged
      socket.on('tagNotification', function (data) {
        return this.userActivity.unshift(data);
      }.bind(this));
      //when friend creates new post
      socket.on('newPostNotification', function (data) {
        return this.userActivity.unshift(data);
      }.bind(this));
      //when friend likes post
      socket.on('likePostNotification', function (data) {
        return this.userActivity.unshift(data);
      }.bind(this));
      //when friend makes a comment
      socket.on('madeCommentNotification', function (data) {
        return this.userActivity.unshift(data);
      }.bind(this));
      //when friend likes comment
      socket.on('likeCommentNotification', function (data) {
        return this.userActivity.unshift(data);
      }.bind(this));
      //when friend adds a new friend
      socket.on('addNewFriendNotification', function (data) {
        return this.userActivity.unshift(data);
      }.bind(this));
    }
});
//=============================================================================
/**
*Define components
*/
//-----------------------------------------------------------------------------
var
  Hub = require('./components/app_hub')($, socket, generateRandomFileName),
  Profile = require('./components/app_profile'),
  Cr8Hub = require('./components/app_newhub')($, socket),
  UploadPix = require('./components/app_profilepix')($, socket);
//=============================================================================
/**
*Create new Router instance
*/
//-----------------------------------------------------------------------------
var router = new VueRouter();
//=============================================================================
/**
*Create Routes
*/
//-----------------------------------------------------------------------------
router.map({
  '/hub': {
    name: 'hub',
    component: Hub
  },
  '/profile': {
    name: 'profile',
    component: Profile,
    subRoutes: {
      '/cr8Hub': {
        name: 'cr8Hub',
        component: Cr8Hub
      },
      '/uploadPix': {
        name: 'uploadPix',
        component: UploadPix
      }
    }
  }
});
//=============================================================================
/**
*Bind baseApp to shell template
*/
//-----------------------------------------------------------------------------
router.start(App, '#app');
//=============================================================================
