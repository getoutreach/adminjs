import PaginatedModelArray from 'adminjs/utils/paginated_model_array';

var IndexController = Ember.ArrayController.extend({

  content: Ember.A([]),

  query: Ember.computed(function() {
    return {q: this.get('q')};
  }).property('q'),

  updateContent: Ember.observer(function() {
    var config = this.get('config'),
        query = this.get('query');

    var content = PaginatedModelArray.create({
      session: this.session,
      query: query,
      type: config.name
    });
    this.set('content', content);
    this.more();
  }, 'query'),

  more: function() {
    this.get('content').more();
  }

});

export default IndexController;