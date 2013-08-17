var BaseFilter = Ember.Component.extend({

  classNames: ['adminjs-filter-view'],
  config: Ember.computed.alias('controller.config')

});

export default BaseFilter;