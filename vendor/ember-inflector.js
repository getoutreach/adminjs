(function() {
Ember.INFLECTED_CLASSIFY = Ember.ENV.INFLECTED_CLASSIFY;

if (typeof Ember.INFLECTED_CLASSIFY === 'undefined') {
  Ember.INFLECTED_CLASSIFY = false;
}


Ember.String.pluralize = function(word) {
  return Ember.Inflector.inflect(word, Ember.Inflector.rules.plurals);
};

Ember.String.singularize = function(word) {
  return Ember.Inflector.inflect(word, Ember.Inflector.rules.singular);
};

Ember.String.humanize = function(word) {

  var inflected = Ember.Inflector.inflect(word,Ember.Inflector.rules.humans);

  inflected = inflected.replace(Ember.Inflector.KEY_SUFFIX_REGEX,'');
  inflected = inflected.replace(Ember.Inflector.WHITESPACE_REGEX,' ');
  inflected = inflected.replace(/_/g,' ');

  // acronymize?

  return Ember.String.capitalize(inflected);
};

Ember.String.titleize = function(word) {
   var result = Ember.String.humanize(word);

   result = result.
     replace(/\b(?:<!['’`])[a-z]/).
     toLowerCase().
     replace(/^.|\s\S/g, function(a) { return a.toUpperCase(); });

  return result;
};

Ember.String.capitalize = function(word) {
  return word.replace(Ember.Inflector.FIRST_LETTER_REGEX, function(match) {
    return match.toUpperCase();
  });
};

Ember.String.tableize = function(word) {
  return Ember.String.pluralize(Ember.String.underscore(word.toLowerCase()));
};

if (Ember.INFLECTED_CLASSIFY) {
  Ember.String.classify = function(word) {
    return Ember.String.capitalize(Ember.String.camelize(Ember.String.singularize(word)));
  };
}

})();



(function() {
Ember.Inflector = {
  FIRST_LETTER_REGEX: /^\w/,
  WHITESPACE_REGEX: /\s+/,
  KEY_SUFFIX_REGEX: /_id$/,
  BLANK_REGEX: /^\s*$/,

  _CACHE: {},
  cache: function(word, rules, value){
    Ember.Inflector._CACHE[word] = Ember.Inflector._CACHE[word] || {};

    if (value){
      Ember.Inflector._CACHE[word][rules] = value;
    }

    return Ember.Inflector._CACHE[word][rules];
  },

  clearCache: function(){
    Ember.Inflector._CACHE = {};
  },

  clearRules: function(){
    Ember.Inflector.rules.plurals     = [];
    Ember.Inflector.rules.plurals     = [];
    Ember.Inflector.rules.singular    = [];
    Ember.Inflector.rules.humans      = [];
    Ember.Inflector.rules.uncountable = {};
    Ember.Inflector.rules.irregular   = {};
    Ember.Inflector.rules.irregularInverse = {};
  },

  rules: {
    plurals:  [],
    singular: [],
    humans:   [],
    irregular: {},
    irregularInverse: {},
    uncountable: {}
  },

  reset: function(){
    Ember.Inflector.clearCache();
    Ember.Inflector.clearRules();
  },

  plural: function(rule,substituion){
    Ember.Inflector.rules.plurals.addObject([rule, substituion]);
  },

  singular: function(rule,substituion){
    Ember.Inflector.rules.singular.addObject([rule, substituion]);
  },

  human: function(rule,substituion){
    Ember.Inflector.rules.humans.addObject([rule, substituion]);
  },

  irregular: function(rule,substituion){
    Ember.Inflector.rules.irregular[rule] = substituion;
    Ember.Inflector.rules.irregularInverse[substituion] = rule;
  },

  uncountable: function(uncountable) {
    uncountable.forEach(function(word) {
      Ember.Inflector.rules.uncountable[word] = true;
    });
  },

  inflect: function(word, rules) {
    var inflection, substitution, result, lowercase,
    isCached, isIrregular, isIrregularInverse, rule;

    if (Ember.Inflector.BLANK_REGEX.test(word)){
      return word;
    }

    lowercase = word.toLowerCase();

    isCached =  Ember.Inflector.cache(lowercase,rules);
    if (isCached){
      // cached
      return isCached;
    }

    if (Ember.Inflector.rules.uncountable[lowercase]){
      // uncountable
      return word;
    }

    isIrregular = Ember.Inflector.rules.irregular[lowercase];

    if (isIrregular){
      // irregular
      return isIrregular;
    }

    isIrregularInverse = Ember.Inflector.rules.irregularInverse[lowercase];

    if (isIrregularInverse){
      // irregular
      return isIrregularInverse;
    }

    for(var i = rules.length, min = 0; i > min; i--){
      inflection = rules[i-1],
      rule = inflection[0];

      if(rule.test(word)){
        break;
      }
    }

    inflection = inflection || [];

    rule = inflection[0];
    substitution = inflection[1];

    result = word.replace(rule,substitution);

    Ember.Inflector.cache(lowercase,rules,result);
    return result;

  }
};

})();



(function() {
Ember.Inflector.loadAll = function(){
  Ember.Inflector.plural(/$/, 's');
  Ember.Inflector.plural(/s$/i, 's');
  Ember.Inflector.plural(/^(ax|test)is$/i, '$1es');
  Ember.Inflector.plural(/(octop|vir)us$/i, '$1i');
  Ember.Inflector.plural(/(octop|vir)i$/i, '$1i');
  Ember.Inflector.plural(/(alias|status)$/i, '$1es');
  Ember.Inflector.plural(/(bu)s$/i, '$1ses');
  Ember.Inflector.plural(/(buffal|tomat)o$/i, '$1oes');
  Ember.Inflector.plural(/([ti])um$/i, '$1a');
  Ember.Inflector.plural(/([ti])a$/i, '$1a');
  Ember.Inflector.plural(/sis$/i, 'ses');
  Ember.Inflector.plural(/(?:([^f])fe|([lr])f)$/i, '$1$2ves');
  Ember.Inflector.plural(/(hive)$/i, '$1s');
  Ember.Inflector.plural(/([^aeiouy]|qu)y$/i, '$1ies');
  Ember.Inflector.plural(/(x|ch|ss|sh)$/i, '$1es');
  Ember.Inflector.plural(/(matr|vert|ind)(?:ix|ex)$/i, '$1ices');
  Ember.Inflector.plural(/^(m|l)ouse$/i, '$1ice');
  Ember.Inflector.plural(/^(m|l)ice$/i, '$1ice');
  Ember.Inflector.plural(/^(ox)$/i, '$1en');
  Ember.Inflector.plural(/^(oxen)$/i, '$1');
  Ember.Inflector.plural(/(quiz)$/i, '$1zes');

  Ember.Inflector.singular(/s$/i, '');
  Ember.Inflector.singular(/(ss)$/i, '$1');
  Ember.Inflector.singular(/(n)ews$/i, '$1ews');
  Ember.Inflector.singular(/([ti])a$/i, '$1um');
  Ember.Inflector.singular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)(sis|ses)$/i, '$1sis');
  Ember.Inflector.singular(/(^analy)(sis|ses)$/i, '$1sis');
  Ember.Inflector.singular(/([^f])ves$/i, '$1fe');
  Ember.Inflector.singular(/(hive)s$/i, '$1');
  Ember.Inflector.singular(/(tive)s$/i, '$1');
  Ember.Inflector.singular(/([lr])ves$/i, '$1f');
  Ember.Inflector.singular(/([^aeiouy]|qu)ies$/i, '$1y');
  Ember.Inflector.singular(/(s)eries$/i, '$1eries');
  Ember.Inflector.singular(/(m)ovies$/i, '$1ovie');
  Ember.Inflector.singular(/(x|ch|ss|sh)es$/i, '$1');
  Ember.Inflector.singular(/^(m|l)ice$/i, '$1ouse');
  Ember.Inflector.singular(/(bus)(es)?$/i, '$1');
  Ember.Inflector.singular(/(o)es$/i, '$1');
  Ember.Inflector.singular(/(shoe)s$/i, '$1');
  Ember.Inflector.singular(/(cris|test)(is|es)$/i, '$1is');
  Ember.Inflector.singular(/^(a)x[ie]s$/i, '$1xis');
  Ember.Inflector.singular(/(octop|vir)(us|i)$/i, '$1us');
  Ember.Inflector.singular(/(alias|status)(es)?$/i, '$1');
  Ember.Inflector.singular(/^(ox)en/i, '$1');
  Ember.Inflector.singular(/(vert|ind)ices$/i, '$1ex');
  Ember.Inflector.singular(/(matr)ices$/i, '$1ix');
  Ember.Inflector.singular(/(quiz)zes$/i, '$1');
  Ember.Inflector.singular(/(database)s$/i, '$1');

  Ember.Inflector.irregular('person', 'people');
  Ember.Inflector.irregular('man', 'men');
  Ember.Inflector.irregular('child', 'children');
  Ember.Inflector.irregular('sex', 'sexes');
  Ember.Inflector.irregular('move', 'moves');
  Ember.Inflector.irregular('cow', 'kine');
  Ember.Inflector.irregular('zombie', 'zombies');

  Ember.Inflector.uncountable("equipment information rice money species series fish sheep jeans police".w());
};

})();



(function() {
Ember.Inflector.rules.ordinalization = {
  'default': 'th',
  0:  '',
  1:  'st',
  2:  'nd',
  3:  'rd',
  11: 'th',
  12: 'th',
  13: 'th'
};

Ember.Inflector.ordinal = function(number) {
  number = parseInt(number,10);
  number = Math.abs(number);

  if (number > 10 && number < 14){
    number %= 100;
  } else {
    number %= 10;
  }

  var ordinalization = Ember.Inflector.rules.ordinalization;

  return ordinalization[number] || ordinalization['default'];
};

Ember.String.ordinalize = function (word) {
  var ordinalization = Ember.Inflector.ordinal(word);

  return [word, ordinalization].join('');
};

})();



(function() {
var pluralize = Ember.String.pluralize,
    singularize = Ember.String.singularize,
    humanize = Ember.String.humanize,
    titleize = Ember.String.titleize,
    capitalize = Ember.String.capitalize,
    tableize = Ember.String.tableize,
    classify = Ember.String.classify;

if (Ember.EXTEND_PROTOTYPES) {
    
    /*
     * 
     */
    String.prototype.pluralize = function() {
       return pluralize(this, arguments);
    };

    /*
     * 
     */
    String.prototype.singularize = function() {
       return singularize(this, arguments);
    };

    /*
     * 
     */
    String.prototype.humanize = function() {
       return humanize(this, arguments);
    };

    /*
     * 
     */
    String.prototype.titleize = function() {
       return titleize(this, arguments);
    };

    /*
     * 
     */
    String.prototype.capitalize = function() {
       return capitalize(this, arguments);
    };

    /*
     * 
     */
    String.prototype.tableize = function() {
       return tableize(this, arguments);
    };

    /*
     * 
     */
    String.prototype.classify = function() {
       return classify(this, arguments);
    };
}

})();



(function() {

})();



(function() {

})();

