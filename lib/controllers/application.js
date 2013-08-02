var ApplicationController = Ember.Controller.extend({

  resources: Ember.computed(function() {
    return this.namespace.managedResources.map(function(resource) {
      return resource + 's';
    });
  })

});

export default ApplicationController;