var IndexView = Ember.View.extend({
  templateName: 'adminjs/index',

  TableView: Ember.View.extend({
    tagName: 'table',

    fieldNames: Ember.computed.alias('controller.fieldNames'),

    // Dynamically create the template as an optimization. This
    // is faster than have an inner {{each}} which loops over the columns
    template: Ember.computed(function() {

      var hbs = "<tr>";
      var fieldNames = this.get('fieldNames');
      fieldNames.forEach(function(name) {
        hbs += "<th>" + name + "</th>";
      });
      hbs += "</tr>";

      hbs += "{{#each this}}";
      hbs += "<tr>";
      fieldNames.forEach(function(name) {
        hbs += "<td>{{" + name + "}}</td>";
      });
      hbs += "</tr>";
      hbs += "{{/each}}";

      return Ember.Handlebars.compile(hbs);

    }).property('fieldNames')

  })
});

export default IndexView;