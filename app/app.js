import Resolver from 'resolver';

import server from 'adminjs/app/server';

var App = AJS.Application.create({
  LOG_ACTIVE_GENERATION: true,
  LOG_VIEW_LOOKUPS: true,
  modulePrefix: 'adminjs/app', // TODO: loaded via config
  resolver: Resolver
});

import Adapter from 'adminjs/app/adapter';

App.Adapter = Adapter;

App.configure(function() {
  this.manage('customer', {
    filters: [{
      name: 'Name',
      param: 'name',
      type: 'text'
    },
    {
      name: 'Email',
      param: 'email',
      type: 'text'
    },
    {
      name: 'Notes',
      param: 'notes',
      type: 'text'
    }]
  });
  this.manage('order', {
    filters: [{
      name: 'state',
      type: 'checkboxes',
      options: ['new', 'fulfilled']
    }]
  });
});

export default App;
