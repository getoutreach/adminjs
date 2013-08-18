import field from 'adminjs/helpers/field';

var IndexView = Ember.View.extend({
  classNames: ['adminjs-index-view'],
  templateName: 'adminjs/index',

  didInsertElement: function() {
    var $this = this.$();
    var view = this;
    var lastScroll = 0;
    var lastHScroll = 0;
    $(window).on('scroll.infinite', function() {
      var scroll = $(window).scrollTop();

      var hscroll = $(window).scrollLeft();
      // fix the header on horizontal scroll
      if(hscroll != lastHScroll) {
        lastHScroll = hscroll;
        var maxHScroll = $(document).width() - $(window).width();
        hscroll = Math.min(Math.max(0, hscroll), maxHScroll);
        $('.adminjs-application-view > header, .adminjs-index-view > header').css({
          'left': hscroll + 'px'
        });
      }

      if(lastScroll < scroll) {
        // infinite scroll
        var buffer = 120;
        var pageHeight = $this.height() + $this.position().top;
        if($(window).scrollTop() + $(window).height() + buffer > pageHeight)
          view.controller.more();
      }
      lastScroll = scroll;
    });
  },

  willDestroyElement: function() {
    $(window).off('scroll.infinite');
  },

  TableView: Ember.View.extend({
    tagName: 'table',
    classNames: ['adminjs-index-table-view'],

    config: Ember.computed.alias('parentView.config'),
    fields: Ember.computed.alias('config.fields'),

    // Dynamically create the template as an optimization. This
    // is faster than have an inner {{each}} which loops over the columns
    template: Ember.computed(function() {

      var hbs = "<tr><thead>";
      var fields = this.get('fields');
      fields.forEach(function(field) {
        hbs += "<th>" + field.name + "</th>";
      });
      hbs += "</thead></tr>";

      hbs += "<tbody>{{#each this}}";
      hbs += "<tr>";
      fields.forEach(function(field) {
        hbs += "<td>{{field \"" + field.name + "\"}}</td>";
      });
      hbs += "</tr>";
      hbs += "{{/each}}</tbody>";

      return Ember.Handlebars.compile(hbs);

    }).property('fieldNames')

  })
});

export default IndexView;