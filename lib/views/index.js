import field from 'adminjs/helpers/field';
import ListView from 'adminjs/views/list';

var IndexView = Ember.View.extend({
  classNames: ['adminjs-index-view'],
  templateName: 'adminjs/index',

  didInsertElement: function() {
    var $this = this.$();
    var view = this;
    var lastScroll = 0;
    $(window).on('scroll.infinite', function() {
      var scroll = $(window).scrollTop();

      if(lastScroll < scroll) {
        // infinite scroll
        var buffer = 120;
        var pageHeight = $this.height() + $this.position().top;
        //if($(window).scrollTop() + $(window).height() + buffer > pageHeight)
          //view.controller.more();
      }
      lastScroll = scroll;
    });
  },

  willDestroyElement: function() {
    $(window).off('scroll.infinite');
  },

  ListView: ListView
});

export default IndexView;