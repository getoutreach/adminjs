var get = Ember.get;

var IndexController = Ember.ArrayController.extend({
  resourceName: null,

  fieldNames: Ember.computed(function() {
    var type = this.container.lookup('model:' + this.resourceName);
    var result = ['id'];
    get(type, 'attributes').forEach(function(name, meta) {
      result.push(name);
    });
    return result;
  }).property('resourceName')

});

export default IndexController;