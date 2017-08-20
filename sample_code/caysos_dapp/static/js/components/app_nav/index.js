'use strict';
//=============================================================================
/**
 * module
 */
//=============================================================================
module.exports = function (jQ) {
  return {
      template: require('./template.html'),
      data: function () {
        return {
          username: '',
          password: '',
          contractExists: false,
          showLoginErr: false,
          showServerErr: false,
          spinner: false,
          checkContractExistsURL: '/checkContractExists',
          adminLoginURL: '/adminLogin',
          signUpURL: '/auth/signup',
          signUpSpinner: false,
          showSignUpErr: false,
          signUpErrMsg: '',
          email: '',
          logInURL: '/auth/login',
          logInErrMsg: '',
          showLogInErr: false,
          logInSpinner: false
        }
      },
      methods: {
        submitAdminCreds: function () {
          if(this.username && this.password) {
            this.spinner = true;
            console.log(`username: ${this.username}, password: ${this.password}`);
            const data = {
              username: this.username,
              password: this.password
            };
            return this.$http.post(this.adminLoginURL, {
              data: data
            })
              .then(resp => {
                this.spinner = false;
                this.username = this.password = '';
                jQ('#closeAdminLoginModal').trigger('click');
                return this.$router.push({name: 'admin'});
              })
              .catch(err => {
                this.spinner = false;
                let $errMsg = jQ('#login-err');
                this.showLoginErr = true;
                $errMsg.fadeIn(200).fadeOut(4500);
                this.username = this.password = '';
                return this.showLoginErr = false;
              });
          } else {
            return null;
          }
        },
        submitSignUp: function () {
          if(!this.contractExists) {
            jQ('#closeSignUpModal').trigger('click');
            return jQ('#noContractModalBtn').trigger('click');
          }
          if(this.email && this.password) {
            this.signUpSpinner = true;
            console.log(`email: ${this.email}, password: ${this.password}`);
            const data = {
              email: this.email,
              password: this.password
            };
            return this.$http.post(this.signUpURL, {
              email: this.email,
              password: this.password
            })
            .then(resp => {
              this.signUpSpinner = false;
              this.email = this.password = '';
              console.log('resp from submit signup');
              console.log(resp.body);
              this.$emit('signupsuccess', resp.body);
              console.log('emitted signupsuccess event...');
              return jQ('#closeSignUpModal').trigger('click');
            })
            .catch(err => {
              console.log(err);
              this.signUpSpinner = false;
              let $errMsg = jQ('#signup-err');
              this.showSignUpErr = true;
              this.signUpErrMsg = err.body.errMsg;
              $errMsg.fadeIn(200).fadeOut(9500);
              this.email = this.password = '';
              return this.showSignUpErr = false;
            });
          } else {
            return null;
          }
        },
        submitLogIn: function () {
          if(!this.contractExists) {
            jQ('#closeLogInModal').trigger('click');
            return jQ('#noContractModalBtn').trigger('click');
          }
          if(this.email && this.password) {
            this.logInSpinner = true;
            console.log(`email: ${this.email}, password: ${this.password}`);
            const data = {
              email: this.email,
              password: this.password
            };
            return this.$http.post(this.logInURL, {
              email: this.email,
              password: this.password
            })
            .then(resp => {
              this.logInSpinner = false;
              this.email = this.password = '';
              console.log('resp from login');
              console.log(resp.body);
              this.$emit('loginsuccess', resp.body);
              console.log('emitted loginsuccess event...');
              return jQ('#closeLogInModal').trigger('click');
            })
            .catch(err => {
              console.log(err);
              this.logInSpinner = false;
              let $errMsg = jQ('#login-err');
              this.showLogInErr = true;
              this.logInErrMsg = err.body.errMsg;
              $errMsg.fadeIn(200).fadeOut(9500);
              this.email = this.password = '';
              return this.showLogInErr = false;
            });
          } else {
            return null;
          }
        }
      },
      beforeMount: function () {
        console.log(`initial contractExits: ${this.contractExists}`);
        this.$http.get(this.checkContractExistsURL)
          .then(ok => {
            console.log('resp from app nav contract exists..');
            console.log(ok.body);
            this.contractExists = true;
            console.log(`final contractExits: ${this.contractExists}`);
            this.$emit('contractexists', ok.body);
          })
          .catch(err => {
            console.log(`final contractExits: ${this.contractExists}`);
            console.log(err);
          });
        }
      }
  };
//=============================================================================
