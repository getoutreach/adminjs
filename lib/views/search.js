var SearchView = Ember.View.extend({
  classNameBindings: [':adminjs-search-view', 'controller.content.isLoading:loading'],
  templateName: 'adminjs/search',

  filters: Ember.computed(function() {
    // loop over filter configurations and lookup view classes
    var views = [],
        config = this.get('config');

    return config.filters.map(function(filter) {
      var filterName = filter.type || "text";

      var FilterView = config.container.lookupFactory('filter:' + filterName);

      var param = filter.param || filter.name;

      FilterView = FilterView.extend({
        filter: filter,
        valueBinding: 'targetObject.' + param
      });

      return FilterView;
    });
  }).property('config'),
});

export default SearchView;