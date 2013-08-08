import Resolver from 'resolver';

import server from 'adminjs/app/server';

var App = AJS.Application.create({
  LOG_ACTIVE_GENERATION: true,
  LOG_VIEW_LOOKUPS: true,
  modulePrefix: 'adminjs/app', // TODO: loaded via config
  resolver: Resolver
});

App.configure(function() {
  this.manage('customer');
  this.manage('order');
});

export default App;
