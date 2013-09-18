var get = Ember.get, set = Ember.set;

var PaginatedModelArray = Ember.ArrayProxy.extend({
  session: null,
  query: {},
  type: null,
  currentPage: null,
  perPage: null,
  totalEntries: null,
  init: function () {
    set(this, 'content', []);
    this._super();
  },

  isLoading: false,
  more: function () {
    var query, self;
    if (get(this, 'isLoading'))
      return;
    query = Ember.copy(get(this, 'query'));
    Ember.merge(query, get(this, 'nextPaginationQuery'));
    set(this, 'isLoading', true);
    self = this;
    return get(this, 'session').query(get(this, 'type'), query).then(function (modelArray) {
      var content;
      self.beginPropertyChanges();
      self.extractMeta(modelArray);
      content = get(self, 'content');
      modelArray.forEach(function (model) {
        return content.pushObject(model);
      });
      set(self, 'isLoading', false);
      return self.endPropertyChanges();
    });
  },

  extractMeta: function (modelArray) {
    var meta;
    meta = get(modelArray, 'meta');
    set(this, 'currentPage', get(meta, 'current_page'));
    set(this, 'perPage', get(meta, 'per_page'));
    return set(this, 'totalEntries', get(meta, 'total_entries'));
  },

  nextPaginationQuery: Ember.computed(function () {
    var currentPage, params, perPage;
    params = {};
    currentPage = get(this, 'currentPage');
    if (currentPage)
      set(params, 'page', currentPage + 1);
    perPage = get(this, 'perPage');
    if (perPage)
      set(params, 'per_page', perPage);
    return params;
  }).property('currentPage', 'perPage'),

  hasMore: Ember.computed(function () {
    var numPages, perPage;
    perPage = get(this, 'perPage') || 10;
    if (!get(this, 'totalEntries'))
      return false;
    numPages = Math.ceil(get(this, 'totalEntries') / perPage);
    return get(this, 'currentPage') < numPages;
  }).property('perPage', 'totalEntries', 'currentPage')

});

export default PaginatedModelArray;