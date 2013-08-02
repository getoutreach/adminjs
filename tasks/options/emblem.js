module.exports = {
  "app": {
    options: {
      root: 'app/templates/',
      dependencies: {
        jquery: 'vendor/jquery/jquery.js',
        ember: 'vendor/ember/ember.js',
        emblem: 'vendor/emblem/emblem.js',
        handlebars: 'vendor/handlebars/handlebars.js'
      }
    },
    files: {
      "tmp/public/assets/templates.js": "app/templates/**/*.emblem"
    }
  },
  "lib": {
    options: {
      root: 'lib/templates/',
      dependencies: {
        jquery: 'vendor/jquery/jquery.js',
        ember: 'vendor/ember/ember.js',
        emblem: 'vendor/emblem/emblem.js',
        handlebars: 'vendor/handlebars/handlebars.js'
      }
    },
    files: {
      "tmp/public/assets/templates.js": "lib/templates/**/*.emblem"
    }
  }
};
