var get = Ember.get, set = Ember.set, EmberHandlebars = Ember.Handlebars;


var caches = {
  'editor': Ember.Map.create(),
  'renderer': Ember.Map.create()
};

function lookup(type, config, field) {
  var cache = caches[type];
  var cached = cache.get(field);
  if(cached !== undefined) {
    return cached;
  }
  var candidates = Ember.A([field[type], field.name, field.type, 'default']).compact();
  var result;
  for(var i = 0; i < candidates.length; i++) {
    var name = candidates[i];
    result = config.container.lookupFactory(type + ':' + name);
    if(result) break;
  }
  cache.set(field, result);
  return result;
}

/**
  Renders a field based on the configuration.
*/
EmberHandlebars.registerHelper('field', function(name, options) {
  if (options.types[0] === "ID") {
    name = Ember.Handlebars.get(options.contexts[0], name, options);
  }

  var config = options.data.keywords.controller.get('config'),
      view = options.data.view,
      field = config.getField(name),
      FieldView;

  var isEditing = !!options.hash.edit && field.editable !== false;

  FieldView = lookup(isEditing ? 'editor' : 'renderer', config, field);

  if(FieldView) {
    // normalize the path to be relative to the view
    var opts = {
      valueBinding: "_parentView.context." + field.name,
      field: field
    };
    view.appendChild(FieldView, opts);
  } else {
    // the "default renderer" is just a binding
    return EmberHandlebars.helpers.bind.apply(this, [name, options]);
  }
});