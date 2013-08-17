var get = Ember.get;

var ResourceController = Ember.ObjectController.extend({

  _originalContent: null,
  editingSession: null,
  isEditing: false,

  edit: function() {
    this.set('isEditing', true);
    this._originalContent = this.get('content');
    // create a child session to to the editing in
    var session = this.get('session');
    this.editingSession = session.newSession();
    this.set('content', this.editingSession.add(this.get('content')));
  },

  cancel: function() {
    this.set('isEditing', false);
    this.set('content', this._originalContent);
    if(this.get('content.isNew')) {
      this.target.transitionTo(this.get('config.plural'));
    }
  },

  save: function() {
    this.editingSession.flush();
    this.set('isEditing', false);
    this.set('content', this._originalContent);
  },

  remove: function() {
    var config = this.get('config');
    if(window.confirm("Are you sure you want to delete this " + config.name + "?")) {
      this.get('session').deleteModel(this.get('content'));
      this.target.transitionTo(config.plural);
    }
  }

});

export default ResourceController;