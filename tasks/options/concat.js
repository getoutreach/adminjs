module.exports = {
  "app": {
    src: ['tmp/transpiled/app/**/*.js'],
    dest: 'tmp/public/assets/app.js'
  },

  "lib": {
    src: ['tmp/transpiled/lib/**/*.js'],
    dest: 'tmp/dist/adminjs.js'
  },

  "test": {
    src: 'tmp/transpiled/tests/**/*.js',
    dest: 'tmp/public/tests/tests.js'
  },

  "vendorCss": {
    src: ['vendor/**/*.css'],
    dest: 'tmp/public/assets/vendor.css'
  },

  "distCss": {
    src: ['tmp/dist/**/*.css'],
    dest: 'dist/adminjs.css'
  },

  // TODO: clean this up and put elsewhere
  "publicCss": {
    src: ['tmp/dist/**/*.css'],
    dest: 'tmp/public/assets/adminjs.css'
  }
};
