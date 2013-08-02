module.exports = {
  main: {
    files: ['app/**/*', 'public/**/*', 'vendor/**/*', 'tests/**/*', 'lib/**/*'],
    tasks: ['build:debug']
  },
  test: {
    files: ['app/**/*', 'public/**/*', 'vendor/**/*', 'tests/**/*', 'lib/**/*'],
    tasks: ['build:debug', 'karma:server:run']
  }
};
