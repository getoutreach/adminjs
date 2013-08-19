import PaginatedModelArray from 'adminjs/utils/paginated_model_array';

var IndexController = Ember.ArrayController.extend({

  content: Ember.A([]),
  timer: null,

  updateContent: Ember.observer(function() {
    var config = this.get('config'),
        query = this.get('query'),
        perPage = this.get('config.index.perPage');

    var content = PaginatedModelArray.create({
      session: this.session,
      query: query,
      type: config.name,
      perPage: perPage
    });
    this.set('content', content);
    // add a slight delay to prevent many overlapping
    // requests while typing
    if(this.timer) Ember.run.cancel(this.timer);
    this.timer = Ember.run.later(this, 'more', 250);
  }, 'query'),

  more: function() {
    this.get('content').more();
  },

  toggleMore: function() {
    this.toggleProperty('showMore');
  },

  hasFilters: Ember.computed(function() {
    return this.get('config.filters.length') > 0;
  }).property('config'),

  createResource: function() {
    var session = this.get('session');
    var config = this.get('config');
    var resource = session.create(config.name);
    this.target.transitionTo(config.name, resource);
  }

});

IndexController.reopenClass({

  extendWithConfig: function(config) {

    // dynamically extend the class to take into account
    // the configuration

    var queryDeps = (config.filters || []).map(function(filter) {
      return filter.param || filter.name;
    });

    queryDeps.push('q');

    var queryProp = Ember.computed(function() {
      var query = {q: this.get('q')};

      if(config.filters) {
        config.filters.forEach(function(filter) {
          var param = filter.param || filter.name;
          query[param] = this.get(param);
        }, this);
      }

      return query;
    });

    queryProp = queryProp.property.apply(queryProp, queryDeps);

    return this.extend({

      config: config,
      query: queryProp

    });

  }

});

export default IndexController;