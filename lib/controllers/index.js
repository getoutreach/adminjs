var IndexController = Ember.ArrayController.extend({

  content: Ember.A([]),

  query: Ember.computed(function() {
    return {q: this.get('q')};
  }).property('q'),

  updateContent: Ember.observer(function() {
    var config = this.get('config'),
        query = this.get('query'),
        controller = this;
    this.session.query(config.name, query).then(function(results) {
      controller.set('content', results);
    });
  }, 'query')

});

export default IndexController;