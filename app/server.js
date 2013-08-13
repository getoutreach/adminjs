// fake REST backend

var DATA = {
  customers: {},
  orders: {}
};

var orderId = 1;
for(var customerId = 1; customerId < 100; customerId++) {
  var customer = {
    id: customerId + '',
    name: Faker.Name.findName(),
    email: Faker.Internet.email(),
    created_at: new Date()
  };

  var numOrders = Math.floor(Math.random() * 4);
  var maxId = orderId + numOrders;
  var orderIds = [];
  for(;orderId < maxId; orderId++) {
    var order = {
      id: orderId + '',
      total: 29.99,
      state: 'new',
      created_at: new Date(),
      customer_id: customerId
    };
    DATA.orders[orderId + ''] = order;
    orderIds.push(orderId + '');
  }
  customer.order_ids = orderIds;

  DATA.customers[customerId + ''] = customer;
}

var server = sinon.fakeServer.create();

server.respondWith(/\/([^\/]*)/, function(xhr, resource) {
  var data = DATA[resource];
  var arr = [];
  for(var id in data) {
    if(!data.hasOwnProperty(id)) continue;
    arr.push(data[id]);
  }
  var res = {};
  res[resource] = arr;

  xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify(res));
});

server.respondWith(/\/([^\/]*)\/(\d+)/, function (xhr, resource, id) {
  var res = DATA[resource][id];

  xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify(res));
});

server.autoRespond = true;

export default server;