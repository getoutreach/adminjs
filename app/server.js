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

// extract out url and params
function parseUrl(url) {
  var parts = url.split('?');
  var path = parts[0];
  var query = parts[1];

  if(query) {

    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

    var params = {};
    while (match = search.exec(query))
       params[decode(match[1])] = decode(match[2]);

   }

   return {path: path, params: params};
}

// returns true or false if the hash would match the search criteria
function emulateSearch(hash, params) {
  // for not just "fulltext" param
  var q = params.q.toLowerCase();

  for(var key in hash) {
    if(!hash.hasOwnProperty(key)) continue;

    var value = hash[key];
    if(typeof value !== "string") continue;

    if(value.toLowerCase().indexOf(q) !== -1) return true;
  }

  return false;
}

var server = sinon.fakeServer.create();

server.respondWith(/\/([^\/]*)/, function(xhr, url) {
  var parsed = parseUrl(url);
  var resource = parsed.path;
  var params = parsed.params;
  var data = DATA[resource];
  var arr = [];
  for(var id in data) {
    if(!data.hasOwnProperty(id)) continue;
    var hash = data[id];

    if(!params || emulateSearch(hash, params)) {
      arr.push(hash);
    }
    
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