'use strict';
require('dotenv').config();
//=============================================================================
/**
 * dependencies
 */
//=============================================================================
const
  Vue = require('vue'),
  VueRouter = require('vue-router'),
  Web3 = require('web3'),
  Promise = require('bluebird'),
  jQ = require('jquery'),
  HOSTNAME = window.location.hostname,
  ETH_CLIENT_URI = 'http://'+ HOSTNAME +':8545';
let W3 = new Web3(new Web3.providers.HttpProvider(ETH_CLIENT_URI));
//=============================================================================
/**
 * config
 */
//=============================================================================
Vue.use(require('vue-resource'));
Vue.http.options.root = '/root';
Vue.use(VueRouter);
/*window.addEventListener('load', function() {
  if (typeof(web3) != 'undefined') {
    // Use Mist/MetaMask's provider
    console.log('injected web3 found...');
    W3 = window.web3 = new Web3(web3.currentProvider);
  } else {
    console.log('Injected web3 Not Found!!!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    W3 = window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
  }
  // Now you can start your app & access web3 freely:
  startApp();
});*/
/*if (typeof(web3) != 'undefined') {
  // Use Mist/MetaMask's provider
  console.log('injected web3 found...');
  W3 = window.web3 = new Web3(web3.currentProvider);
} else {
  console.log('Injected web3 Not Found!!!')
  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  W3 = window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}*/
//startApp();
//=============================================================================
/**
 * variables
 */
//=============================================================================
const CONTRACT_URI = './Caysos.sol';
let cBase;
//=============================================================================
/**
 * router object
 */
//=============================================================================
const
    routes = [
        {
            path: '/',
            name: 'home',
            component: require('./components/app_home')
        },
        {
            path: '/admin',
            name: 'admin',
            component: require('./components/app_admin')(jQ, W3, Promise)
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: require('./components/app_dashboard')(jQ, W3)
        }
    ],
    router = new VueRouter({routes});
//=============================================================================
/**
 * components
 */
//=============================================================================
const
    AppNav = require('./components/app_nav')(jQ),
    AppFooter = require('./components/app_footer');
//=============================================================================
/**
 * VM
 */
//=============================================================================
const VM = new Vue({
    router,
    data: {
      dashboardObj: null,
      contractExists: false
    },
    components: {
        'app-nav': AppNav,
        'app-footer': AppFooter
    },
    methods: {
      signUpSuccess: function (obj) {
        console.log('main VM intercepted signUpSuccess event...');
        console.log(obj);
        this.dashboardObj = obj;
        return this.$router.push({name: 'dashboard'});
      },
      logInSuccess: function (obj) {
        console.log('main VM intercepted logInSuccess event...');
        console.log(obj);
        this.dashboardObj = obj;
        return this.$router.push({name: 'dashboard'});
      },
      existingContract: function (addr) {
        console.log('existingContract event intercepted');
        return this.contractExists = addr;
      }
    }
});
//=============================================================================
/**
 * mount VM to View
 */
//=============================================================================
VM.$mount('#app');
//=============================================================================
