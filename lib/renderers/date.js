import BaseRenderer from 'adminjs/renderers/base';

var DateRenderer = BaseRenderer.extend({
  classNames: ['date-renderer'],

  formattedValue: Ember.computed(function() {
    var format = this.get('field').format || 'llll',
        value = this.get('value');
    return value && moment(value).format(format);
  }).property('field.format', 'value')
});

export default DateRenderer;