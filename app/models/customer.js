var Customer = Ep.Model.extend({
  name: Ep.attr('string'),
  email: Ep.attr('string'),
  createdAt: Ep.attr('date'),
  notes: Ep.attr('string'),

  orders: Ep.hasMany('order')
});

Customer.toString = function() {
  return ".Customer";
};

export default Customer;