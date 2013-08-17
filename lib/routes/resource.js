var ResourceRoute = Ember.Route.extend({

  model: function(params) {
    var config = this.get('config');
    var id = params[config.name + "_id"];
    if(id === 'new') return undefined;
    return this.get('session').load(config.name, id);
  },

  serialize: function(model, params) {
    if(!model || model.get('isNew')) model = {id: 'new'};
    return this._super(model, params);
  },

  setupController: function(controller, model) {
    this._super(controller, model);
    if(model.get('isNew')) controller.edit();
  }
  
});

ResourceRoute.reopenClass({

  extendWithConfig: function(config) {
    return this.extend({config: config});
  }

});

export default ResourceRoute;