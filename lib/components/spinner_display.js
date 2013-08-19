var SpinnerDisplayComponent = Ember.Component.extend({

  classNames: ['spinner-display'],
  spinner: null,
  color: "#2693FF",

  didInsertElement: function() {
    var opts = {
      radius: 4,
      length: 3,
      lines: 9,
      width: 3,
      color: this.get('color')
    };
    this.spinner = new Spinner(opts).spin(this.$()[0]);
  },

  willRemoveElement: function() {
    this.spinner.stop();
  }

});

export default SpinnerDisplayComponent;