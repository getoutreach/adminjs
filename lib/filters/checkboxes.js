import BaseFilter from 'adminjs/filters/base';

var CheckboxesFilterView = BaseFilter.extend({
  classNames: ['checkboxes-filter'],
  templateName: 'adminjs/checkboxes_filter',

  options: Ember.computed(function() {
    var options = this.get('filter.options');
    return options.map(function(option) {
      return {value: option, checked: false};
    });
  }).property('filter'),

  optionsChanged: Ember.observer(function() {
    var options = this.get('options');
    var selectedValues = options.filterProperty('checked').mapProperty('value');
    this.set('value', selectedValues);
  }, 'options.@each.checked')

});

export default CheckboxesFilterView;