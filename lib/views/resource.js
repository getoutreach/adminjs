var ResourceView = Ember.View.extend({
  classNames: ['adminjs-resource-view'],
  templateName: 'adminjs/resource',

  didInsertElement: function() {
    this._super();

    // when navigating from a deeply scrolled
    // index view it is good to reset the scroll
    $('body').scrollTop(0);
  }
});

export default ResourceView;