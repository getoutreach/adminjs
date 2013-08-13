var Config = Ember.Object.extend({

  init: function() {
    this._super();
    // TODO: add Ember-Inflector
    this.plural = this.name + 's';
    this.classified = Ember.String.classify(this.name);
    this.classifiedPlural = Ember.String.classify(this.plural);
  }

});

export default Config;