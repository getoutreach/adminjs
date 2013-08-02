import IndexRoute from 'adminjs/routes/index';
import IndexController from 'adminjs/controllers/index';
import IndexView from 'adminjs/views/index';
import ApplicationController from 'adminjs/controllers/application';

import group from 'adminjs/helpers/group';

Ember.ENV.HELPER_PARAM_LOOKUPS = true;

var Application = Ember.Application.extend({

  init: function() {
    this._super();
    this.managedResources = [];
    this.ApplicationController = ApplicationController;
  },

  manage: function(resourceName) {
    this.managedResources.push(resourceName);

    // build the controllers/views/routes for this resource
    var plural = resourceName + 's';
    var classified = Ember.String.classify(resourceName);
    var classifiedPlural = Ember.String.classify(plural);
    this[classifiedPlural + 'IndexRoute'] = IndexRoute.extend({
      resourceName: resourceName
    });
    this[classifiedPlural + 'IndexController'] = IndexController.extend({
      resourceName: resourceName
    });
    this[classifiedPlural + 'IndexView'] = IndexView.extend({
      resourceName: resourceName
    });
  },

  configure: function(dsl) {
    dsl.call(this);
    this.buildRoutes();
  },

  buildRoutes: function() {
    var app = this;
    this.Router.map(function() {
      app.managedResources.forEach(function(resourceName) {
        var plural = resourceName + 's';
        this.resource(plural, function() {
          this.resource(resourceName, {path: '/:' + resourceName + '_id'}, function() {
            this.route('edit');
          });
        });
      }, this);
    });
  }

});

export default Application;