var through  = require('through2').obj;
var EventEmitter = require('events').EventEmitter;
var EventStream = require('../es');

function getProxy(emitter, identity, ns, id) {
  var proxy = new EventEmitter();
  proxy.$emit = proxy.emit;
  proxy.emit = function() {
    emitter.emit('send-' + identity, {
      type: 'streams',
      ns: ns,
      id: id,
      args: [].slice.call(arguments)
    });
  }
  emitter.on('received-' + identity, function(data) {
    if (data.type === 'streams' && data.ns === ns && data.id === id) {
      proxy.$emit.apply(proxy, data.args);
    }
  });
  return proxy;
}

exports = module.exports = function(emitter, identity, getClient) {
  return function(ns, cb) {
    if (typeof ns === 'function') {
      cb = ns;
      ns = '*';
    }
    
    var proxies = {};
    emitter.on('received-' + identity, function(data) {
      if (data.type !== 'streams' || data.ns !== ns) return;
      if (proxies[data.id]) return;
      var proxy = proxies[data.id] = getProxy(emitter, identity, ns, data.id);
      var es = new EventStream(proxy);
      var head = data.args[1];
      var stream;
      if (head.readable) {
        stream = es.createWriteStream(head);
        proxy.on('end', function() {
          delete proxies[data.id];
          proxy.removeAllListeners();
        });
      } else if (head.writable) {
        stream = es.createReadStream(head);
        stream.on('end', function() {
          delete proxies[data.id];
          proxy.removeAllListeners();
        });
      }
      cb(head, stream, getClient());
    });
  }
}