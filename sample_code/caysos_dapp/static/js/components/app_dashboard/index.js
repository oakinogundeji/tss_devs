'use strict';
//=============================================================================
module.exports = function (jQ, web3) {
  return {
    template: require('./template.html'),
    data: function () {
      return {
        recommendationSpinner: false,
        showRecommendErr: false,
        showRecommendSuccess: false,
        recipient: '',
        senderEmail: '',
        senderName: '',
        msg: '',
        sendRecommendationURL: '/sendRecommendationEmail'
      };
    },
    props: ['dashboardObject'],
    methods: {
      sendRecommendation: function () {
        console.log('sendRecommendation btn clicked');
        if(this.senderEmail && this.senderName && this.recipient && this.msg) {
          const
            sender = this.senderEmail,
            senderName = this.senderName,
            recipient = this.recipient,
            content = this.msg;
          return this.$http.post(this.sendRecommendationURL, {
            sender,
            senderName,
            recipient,
            content
          })
            .then(resp => {
              console.log('resp from server');
              console.log(resp);
              this.senderEmail = this.senderName = this.recipient = this.msg = '';
              return jQ('#closeRecommendPercaysoModal').trigger('click');
            })
            .catch(err => {
              console.log(err);
              this.senderEmail = this.senderName = this.recipient = this.msg = '';
              return jQ('#closeRecommendPercaysoModal').trigger('click');
            });
        } else {
          return null;
        }
      }
    },
    created: function () {
      console.log('dashboard obj from main VM...');
      console.log(this.dashboardObject);
    }
  };
};
//=============================================================================
