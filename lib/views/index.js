import field from 'adminjs/helpers/field';

var IndexView = Ember.View.extend({
  classNames: ['adminjs-index-view'],
  templateName: 'adminjs/index',

  TableView: Ember.View.extend({
    tagName: 'table',
    classNames: ['adminjs-index-table-view'],

    config: Ember.computed.alias('parentView.config'),
    fields: Ember.computed.alias('config.fields'),

    // Dynamically create the template as an optimization. This
    // is faster than have an inner {{each}} which loops over the columns
    template: Ember.computed(function() {

      var hbs = "<tr>";
      var fields = this.get('fields');
      fields.forEach(function(field) {
        hbs += "<th>" + field.name + "</th>";
      });
      hbs += "</tr>";

      hbs += "{{#each this}}";
      hbs += "<tr>";
      fields.forEach(function(field) {
        hbs += "<td>{{field \"" + field.name + "\"}}</td>";
      });
      hbs += "</tr>";
      hbs += "{{/each}}";

      return Ember.Handlebars.compile(hbs);

    }).property('fieldNames')

  })
});

export default IndexView;