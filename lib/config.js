var get = Ember.get;

var Config = Ember.Object.extend({

  init: function() {
    this._super();
    this.plural = Ember.String.pluralize(this.name);
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
      name: 'id',
      title: 'Id',
      editable: false
    }];
    get(type, 'attributes').forEach(function(name, meta) {
      result.push({
        name: name,
        title: Ember.String.titleize(Ember.String.underscore(name))
      });
    });
    return result;
  }),

  itemFields: Ember.computed.alias('fields')

});

export default Config;