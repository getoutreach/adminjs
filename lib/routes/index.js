var IndexRoute = Ember.Route.extend({
  resourceName: null,
  model: function() {
    return this.session.query(this.resourceName);
  }
});

export default IndexRoute;