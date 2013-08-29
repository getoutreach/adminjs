import Renderer from 'adminjs/renderers/base';
import Editor from 'adminjs/editors/base';
import Filter from 'adminjs/filters/base';

function registerCustomizers(container) {
  var templates = Ember.TEMPLATES, match;
  if (!templates) { return; }

  for (var prop in templates) {
    if (match = prop.match(/^renderers\/(.*)$/)) {
      registerCustomizer(container, match[1], Renderer, "renderer");
    } else if (match = prop.match(/^editors\/(.*)$/)) {
      registerCustomizer(container, match[1], Editor, "editor");
    } else if (match = prop.match(/^filters\/(.*)$/)) {
      registerCustomizer(container, match[1], Filter, "filter");
    }
  }
}

function registerCustomizer(container, name, type, typeName) {
  var className = name.replace(/-/g, '_');
  var Customizer;

  var View = container.lookupFactory(typeName + ':' + className) || container.lookupFactory(typeName + ':' + name);
  if(!View) {
    View = type.extend();
    container.register(typeName + ':' + className, View);
  }
  View.reopen({
    layoutName: typeName + 's/' + name
  });
}

Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: 'adminjsRegisterCustomizers',
    after: 'registerComponents',
    initialize: registerCustomizers
  });
});