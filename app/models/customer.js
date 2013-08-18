var Customer = Ep.Model.extend({
  firstName: Ep.attr('string'),
  lastName: Ep.attr('string'),
  email: Ep.attr('string'),
  createdAt: Ep.attr('date'),
  notes: Ep.attr('string'),
  lastIp: Ep.attr('string'),
  company: Ep.attr('string'),
  phone: Ep.attr('string'),

  orders: Ep.hasMany('order')
});

Customer.toString = function() {
  return ".Customer";
};

export default Customer;