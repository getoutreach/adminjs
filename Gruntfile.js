module.exports = function(grunt) {
  var config = {
    pkg: grunt.file.readJSON('package.json'),
    env: process.env,
    clean: ['tmp']
  };

  grunt.util._.extend(config, loadConfig('./tasks/options/'));

  grunt.initConfig(config);

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  grunt.loadTasks('tasks');

  grunt.registerTask('default', "Build (in debug mode) & test your application.", ['build:debug', 'test']);
  grunt.registerTask('build',   [
                     'lock',
                     'clean',
                     'copy:prepare',
                     'transpile',
                     'jshint',
                     'copy:stage',
                     'emberTemplates',
                     'stylus',
                     'emblem',
                     'concat',
                     'unlock' ]);

  grunt.registerTask('build:debug', "Build a development-friendly version of your app.", [
                     'build',
                     'copy:vendor',
                     'copy:dist' ]);

  grunt.registerTask('build:prod', "Build a minified & production-ready version of your app.", [
                     'useminPrepare',
                     'build',
                     'uglify',
                     'rev',
                     'usemin' ]);

  grunt.registerTask('test', "Run your apps's tests once. Uses Google Chrome by default. Logs coverage output to tmp/public/coverage.", [
                     'karma:test' ]);

  grunt.registerTask('test:ci', "Run your app's tests in PhantomJS. For use in continuous integration (i.e. Travis CI).", [
                     'karma:ci' ]);

  grunt.registerTask('test:server', "Start a Karma test server. Automatically reruns your tests when files change and logs the results to the terminal.", [
                     'build:debug', 'karma:server', 'connect', 'watch:test']);

  grunt.registerTask('server', "Run your server in development mode, auto-rebuilding when files change.",
                     ['build:debug', 'connect', 'watch:main']);
  grunt.registerTask('server:dist', "Preview production (minified) assets.",
                     ['build:prod', 'connect:server:keepalive']);
};


// TODO: extract this out
function loadConfig(path) {
  var string = require('string');
  var glob = require('glob');
  var object = {};
  var key;

  glob.sync('*', {cwd: path}).forEach(function(option) {
    key = option.replace(/\.js$/,'');
    key = string(key).camelize().s;
    object[key] = require(path + option);
  });

  return object;
}

