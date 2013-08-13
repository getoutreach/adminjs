module.exports = {
  main: {
    options: {
      livereload: true,
    },
    files: ['app/**/*', 'public/**/*', 'vendor/**/*', 'tests/**/*', 'lib/**/*'],
    tasks: ['build:debug']
  },
  test: {
    files: ['app/**/*', 'public/**/*', 'vendor/**/*', 'tests/**/*', 'lib/**/*'],
    tasks: ['build:debug', 'karma:server:run']
  }
};
