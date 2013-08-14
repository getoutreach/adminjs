var Adapter = Ep.RestAdapter.extend({

  // meta isnt supported in EPF's serialization *yet*
  didReceiveDataForFind: function(data, type) {
    var meta = data['meta'];
    var res = this._super(data, type);
    res.set('meta', meta);
    return res;
  }

});

export default Adapter;