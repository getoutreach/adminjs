import titleize from 'adminjs/utils/titleize';

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
      type: 'id',
      editable: false
    }];
    get(type, 'attributes').forEach(function(name, meta) {
      result.push({
        name: name,
        type: meta.type,
        title: titleize(Ember.String.underscore(name))
      });
    });
    type.eachRelationship(function(name, relationship) {
      var typeName = relationship.type.toString().split(".")[1].underscore();
      var isManaged = this.namespace.configs.some(function(config) {
        return config.name === typeName;
      });
      result.push({
        name: name,
        editable: false,
        type: relationship.kind,
        modelType: relationship.type,
        modelTypeName: typeName,
        modelTypePlural: Ember.String.pluralize(typeName),
        isManaged: isManaged,
        title: titleize(Ember.String.underscore(name))
      });
    }, this);
    return result;
  }),

  itemFields: Ember.computed.alias('fields')

});

export default Config;