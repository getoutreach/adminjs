var ListView = Ember.ListView.extend({
  classNames: ['adminjs-list-view'],
  height: 500,
  rowHeight: 32,
  config: Ember.computed.alias('parentView.config'),
  tagName: 'table',
  containerTagName: 'tbody',

  render: function(buffer) {
    buffer.push('<thead><tr>');
    var fields = this.get('config.fields');
    fields.forEach(function(field) {
      buffer.push("<th>" + field.name + "</th>");
    });
    buffer.push('</tr></thead>');
    this._super(buffer);
  },

  itemViewClass: Ember.computed(function() {
    
    // Dynamically create the template as an optimization. This
    // is faster than have an inner {{each}} which loops over the columns
    var fields = this.get('config.fields');
    var hbs = "";
    fields.forEach(function(field) {
      hbs += "<td>{{field \"" + field.name + "\"}}</td>";
    });
    var template = Ember.Handlebars.compile(hbs);

    return Ember.ListItemView.extend({
      tagName: "tr",
      template: template
    });
  })
});

export default ListView;