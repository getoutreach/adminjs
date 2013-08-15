var SearchView = Ember.View.extend({
  classNameBindings: [':adminjs-search-view', 'controller.content.isLoading:loading'],
  templateName: 'adminjs/search',
});

export default SearchView;