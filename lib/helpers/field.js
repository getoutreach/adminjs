var get = Ember.get, set = Ember.set, EmberHandlebars = Ember.Handlebars;

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

  if(isEditing) {
    var editor = field.editor || field.name;
    FieldView = config.container.lookupFactory('editor:' + editor);
    if(!FieldView) {
      FieldView = config.container.lookupFactory('editor:text');
    }
  } else {
    var renderer = field.renderer || field.name; 
    FieldView = config.container.lookupFactory('renderer:' + renderer);
  }

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