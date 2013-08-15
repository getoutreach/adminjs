var SpinnerDisplayComponent = Ember.Component.extend({

  classNames: ['spinner-display'],
  spinner: null,

  didInsertElement: function() {
    var opts = {
      radius: 4,
      length: 3,
      lines: 9,
      width: 3,
      color: "#2693FF"
    };
    this.spinner = new Spinner(opts).spin(this.$()[0]);
  },

  willRemoveElement: function() {
    this.spinner.stop();
  }

});

export default SpinnerDisplayComponent;