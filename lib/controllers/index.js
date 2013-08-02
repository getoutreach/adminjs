var get = Ember.get;

var IndexController = Ember.ArrayController.extend({
  resourceName: null,

  fieldNames: Ember.computed(function() {
    var type = this.container.lookup('model:' + this.resourceName);
    var result = [];
    get(type, 'attributes').forEach(function(name, meta) {
      result.push(name);
    });
    return result;
  }).property('resourceName'),

  arrangedContent: Ember.computed(function() {
    var fieldNames = this.get('fieldNames');
    var content = this.get('content');
    return content.map(function(model) {
      return fieldNames.map(function(name) {
        return model.get(name);
      });
    });
  }).property('fieldNames', 'content')

});

export default IndexController;