var BaseRenderer = Ember.Component.extend({

  config: Ember.computed.alias('targetObject.config'),
  resource: Ember.computed.alias('_parentView.context')

});

export default BaseRenderer;