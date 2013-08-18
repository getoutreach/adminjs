// fake REST backend

var DATA = {
  customers: {},
  orders: {}
};

var IDS = {};
function createId(resourceName) {
  var id = (IDS[resourceName] || 0)+1;
  IDS[resourceName] = id;
  return id + '';
}


var orderId = 1;
for(var i = 1; i <= 10000; i++) {
  var customer = {
    id: createId('customer'),
    first_name: Faker.Name.firstName(),
    last_name: Faker.Name.lastName(),
    email: Faker.Internet.email(),
    notes: Faker.Lorem.paragraphs(),
    created_at: new Date(),
    last_ip: Faker.Internet.ip(),
    company: Faker.Company.companyName(),
    phone: Faker.PhoneNumber.phoneNumber()
  };

  var numOrders = Math.floor(Math.random() * 4);
  var orderIds = [];
  var orderStates = ['new', 'fulfilled'];
  for(var j = 0; j < numOrders; j++) {
    var order = {
      id: createId('order'),
      total: 29.99,
      state: orderStates[Math.floor(Math.random() * orderStates.length)],
      created_at: new Date(),
      customer_id: customer.id
    };
    DATA.orders[order.id] = order;
    orderIds.push(orderId);
  }
  customer.order_ids = orderIds;

  DATA.customers[customer.id] = customer;
}

// TODO swap out with inflector
function singularize(plural) {
  return plural.substring(0, plural.length - 1);
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

    return {path: path, params: params};
   }

   return {path: path};
}

// returns true or false if the hash would match the search criteria
function emulateSearch(hash, params) {
  // for not just "fulltext" param
  var q = params.q && params.q.toLowerCase();

  for(var key in hash) {
    if(!hash.hasOwnProperty(key)) continue;

    var value = hash[key];
    if(typeof value !== "string") continue;

    if(!q || value.toLowerCase().indexOf(q) !== -1) return true;
  }

  return false;
}

var server = sinon.fakeServer.create();


server.respondWith("GET", /\/([^\/]*)/, function(xhr, url) {
  var parsed = parseUrl(url);
  var resource = parsed.path;
  var params = parsed.params || {};
  var data = DATA[resource];
  var arr = [];

  var perPage = params.per_page && parseInt(params.per_page, 10) || 24;
  var totalEntries = 0;
  var page = params.page && parseInt(params.page, 10) || 1;

  var start = (page - 1) * perPage;

  for(var id in data) {
    if(!data.hasOwnProperty(id)) continue;
    var hash = data[id];

    if(emulateSearch(hash, params)) {
      if(totalEntries++ >= start && totalEntries <= start + perPage) {
        arr.push(hash);
      }
    }
  }

  var res = {};
  res[resource] = arr;
  res.meta = {
    per_page: perPage,
    total_entries: totalEntries,
    current_page: page
  };

  xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify(res));
});

server.respondWith("GET", /\/([^\/]*)\/(\d+)/, function (xhr, resource, id) {
  var data = DATA[resource][id];
  var res = {};
  res[resource] = data;

  xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify(res));
});

server.respondWith("PUT", /\/([^\/]*)\/(\d+)/, function (xhr, resource, id) {
  var hash = JSON.parse(xhr.requestBody);
  hash = hash[singularize(resource)];
  var data = DATA[resource][id];
  var res = {};
  res[resource] = data;

  Ember.merge(data, hash);

  xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify(res));
});

server.respondWith("POST", /\/([^\/]*)/, function(xhr, resource) {
  var hash = JSON.parse(xhr.requestBody);
  hash = hash[singularize(resource)];
  hash.id = createId(resource);
  DATA[resource][hash.id] = hash;
  var res = {};
  res[resource] = hash;

  xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify(res));
});

server.respondWith("DELETE", /\/([^\/]*)\/(\d+)/, function (xhr, resource, id) {
  delete DATA[resource][id];

  xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify({}));
});


server.autoRespond = true;

export default server;