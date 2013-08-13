var ApplicationController = Ember.Controller.extend({

  resources: Ember.computed(function() {
    return this.namespace.configs.mapProperty('plural');
  })

});

export default ApplicationController;