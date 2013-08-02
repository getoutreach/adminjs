var Order = Ep.Model.extend({
  state: Ep.attr('string'),
  total: Ep.attr('number'),
  createdAt: Ep.attr('date'),

  customer: Ep.belongsTo('order')
});

Order.toString = function() {
  return ".Order";
};

export default Order;