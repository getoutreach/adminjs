import IndexRoute from 'adminjs/routes/index';
import IndexController from 'adminjs/controllers/index';
import IndexView from 'adminjs/views/index';
import SearchView from 'adminjs/views/search';
import ResourceView from 'adminjs/views/resource';
import ResourceController from 'adminjs/controllers/resource';
import ResourceRoute from 'adminjs/routes/resource';

import group from 'adminjs/helpers/group';

import Config from 'adminjs/config';

Ember.ENV.HELPER_PARAM_LOOKUPS = true;

var Application = Ember.Application.extend({

  init: function() {
    this._super();
    this.configs = [];

    var container = this.__container__;

    // TODO: should be in an initializer
    Ember.Inflector.loadAll();

    // These are some hacks to support lookups in the incorporating application
    // this could ultimately be supported better if the resolver could support
    // separate namespaces

    import ApplicationController from 'adminjs/controllers/application';
    this.ApplicationController = ApplicationController;

    import ApplicationView from 'adminjs/views/application';
    this.ApplicationView = ApplicationView;

    import IdRenderer from 'adminjs/renderers/id';
    this.IdRenderer = IdRenderer;

    import DateRenderer from 'adminjs/renderers/date';
    this.DateRenderer = DateRenderer;

    import TextFilter from 'adminjs/filters/text';
    this.TextFilter = TextFilter;

    import CheckboxesFilter from 'adminjs/filters/checkboxes';
    this.CheckboxesFilter = CheckboxesFilter;

    import SpinnerDisplayComponent from 'adminjs/components/spinner_display';
    this.SpinnerDisplayComponent = SpinnerDisplayComponent;

    import TextEditor from 'adminjs/editors/text';
    this.TextEditor = TextEditor;

    container.register('editor:default', TextEditor);
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
    this[config.classifiedPlural + 'IndexController'] = IndexController.extendWithConfig(config);
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
    this[config.classified + 'Route'] = ResourceRoute.extendWithConfig(config);
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

    this.IndexRoute = Ember.Route.extend({

      beforeModel: function() {
        this.transitionTo(app.configs[0].plural);
      }

    });
  }

});

export default Application;