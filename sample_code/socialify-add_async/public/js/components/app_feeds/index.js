module.exports = function (jQ, socket) {
  return {
    template: require('./template.html'),
    data: function () {
      return {};
    },
    props: ['userActivity', 'appTrends'],
    methods: {
      getActivity: function () {
        return console.log('getActivity btn clicked!');
      },
      getTrends: function () {
        return console.log('getTrends btn clicked!');
      }
    }
  };
};
