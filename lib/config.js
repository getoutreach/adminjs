var get = Ember.get;

var Config = Ember.Object.extend({

  init: function() {
    this._super();
    // TODO: add Ember-Inflector
    this.plural = this.name + 's';
    this.classified = Ember.String.classify(this.name);
    this.classifiedPlural = Ember.String.classify(this.plural);
  },

  getField: function(name) {
    var fields = get(this, 'fields');
    return fields.findProperty('name', name);
  },

  fields: Ember.computed(function() {
    var type = this.container.lookup('model:' + this.name);
    var result = [{
      name: 'id'
    }];
    get(type, 'attributes').forEach(function(name, meta) {
      result.push({name: name});
    });
    return result;
  }),

  itemFields: Ember.computed.alias('fields')

});

export default Config;