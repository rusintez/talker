var through  = require('through2').obj;
var EventEmitter = require('events').EventEmitter;
var EventStream = require('../es');

function getProxy(emitter, identity, ns, id) {
  var proxy       = new EventEmitter();
  var sendKey     = ['send', identity].join('-');
  var receiveKey  = ['received', identity, 'streams', ns].join('-');
  proxy.$emit     = proxy.emit.bind(proxy);
  
  proxy.emit = function() {
    emitter.emit(sendKey, {
      type: 'streams',
      ns: ns,
      id: id,
      args: [].slice.call(arguments)
    });
  }
  
  emitter.on(receiveKey, function(data) {
    if (data.id !== id) return;
    proxy.$emit.apply(null, data.args);
  });
  
  emitter.on('disconnect', function() {
    proxy.$emit.apply(null, ['disconnect']);
  });
  
  return proxy;
}

exports = module.exports = function(emitter, identity, client) {
  return function(ns, cb) {
    if (typeof ns === 'function') {
      cb = ns;
      ns = '*';
    }
    
    var receiveKey = ['received', identity, 'streams', ns].join('-');
    
    var proxies = {};
    
    emitter.on(receiveKey, function(data) {
      if (proxies[data.id]) return;
      
      var proxy = proxies[data.id] = getProxy(emitter, identity, ns, data.id);
      
      proxy.on('end', function() {
        delete proxies[data.id];
        proxy.removeAllListeners();
      });
      
      var es = new EventStream(proxy);
      var head = data.args[1];
      var stream = head.readable ? es.createWriteStream(head) : es.createReadStream(head);
      
      cb(head, stream, client);
    });
  }
}