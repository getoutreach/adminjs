import IndexRoute from 'adminjs/routes/index';
import IndexController from 'adminjs/controllers/index';
import IndexView from 'adminjs/views/index';
import SearchView from 'adminjs/views/search';
import ResourceView from 'adminjs/views/resource';
import ResourceController from 'adminjs/controllers/resource';

import ApplicationController from 'adminjs/controllers/application';
import ApplicationView from 'adminjs/views/application';

import group from 'adminjs/helpers/group';

import Config from 'adminjs/config';

Ember.ENV.HELPER_PARAM_LOOKUPS = true;

var Application = Ember.Application.extend({

  init: function() {
    this._super();
    this.configs = [];

    this.ApplicationController = ApplicationController;
    this.ApplicationView = ApplicationView;

    // These are some hacks to support view lookups for default field views
    // this could ultimately be supported better if the resolver could support
    // separate namespaces
    import IdFieldView from 'adminjs/views/id_field';
    this.IdFieldView = IdFieldView;

    import SpinnerDisplayComponent from 'adminjs/components/spinner_display';
    this.SpinnerDisplayComponent = SpinnerDisplayComponent;
  },

  manage: function(name, options) {

    var container = this.__container__;
    // HACK: we set EPF container here instead of going through the initializer,
    // this is because this manage method is run before the initializers
    Ep.__container__ = container;

    options = Ember.merge({name: name, container: container}, options || {});

    // TODO: move this to an initializer and make everything container based
    var config = Config.create(options);

    this.configs.push(config);

    // build the controllers/views/routes for this resource
    this[config.classifiedPlural + 'IndexRoute'] = IndexRoute.extend({
      config: config
    });
    this[config.classifiedPlural + 'IndexController'] = IndexController.extend({
      config: config
    });
    this[config.classifiedPlural + 'IndexView'] = IndexView.extend({
      config: config
    });
    this[config.classifiedPlural + 'SearchView'] = SearchView.extend({
      config: config
    });
    this[config.classified + 'View'] = ResourceView.extend({
      config: config
    });
    this[config.classified + 'Controller'] = ResourceController.extend({
      config: config
    });
  },

  configure: function(dsl) {
    dsl.call(this);
    this.buildRoutes();
  },

  buildRoutes: function() {
    var app = this;
    this.Router.map(function() {
      app.configs.forEach(function(config) {
        this.resource(config.plural, function() {
          this.resource(config.name, {path: '/:' + config.name + '_id'});
        });
      }, this);
    });
  }

});

export default Application;