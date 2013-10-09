var WHITESPACE_REGEX = /\s+/;
var KEY_SUFFIX_REGEX = /_id$/;

function humanize(word) {

  var inflected = word; // Ember.Inflector.inflect(word,Ember.Inflector.rules.humans);

  inflected = inflected.replace(KEY_SUFFIX_REGEX,'');
  inflected = inflected.replace(WHITESPACE_REGEX,' ');
  inflected = inflected.replace(/_/g,' ');

  return Ember.String.capitalize(inflected);
}

export default humanize;