var get = Ember.get;

var IndexController = Ember.ArrayController.extend({

  fieldNames: Ember.computed(function() {
    var type = this.container.lookup('model:' + this.config.name);
    var result = ['id'];
    get(type, 'attributes').forEach(function(name, meta) {
      result.push(name);
    });
    return result;
  }).property('config.name')

});

export default IndexController;