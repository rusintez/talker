var EventEmitter = require('events').EventEmitter;
var EventStream = require('../es');

function getProxy(emitter, ns, id) {
  var proxy = new EventEmitter();

  proxy.$emit = proxy.emit;
  
  proxy.emit = function() {
    emitter.emit('send', {
      type: 'streams',
      ns: ns,
      id: id,
      args: [].slice.call(arguments)
    });
  }
  
  emitter.on('received', function(data) {
    if (data.type === 'streams' && data.ns === ns && data.id === id) {
      proxy.$emit.apply(proxy, data.args);
    }
  });
  
  emitter.on('disconnect', function() {
    proxy.$emit.apply(proxy, ['disconnect']);
  });
  
  return proxy;
}

exports = module.exports = function(emitter) {
  return {
    createReadStream: function(ns, head) {
      if (typeof ns !== 'string') {
        head = ns;
        ns = '*';
      }
      
      head = head || {};
      var id = Date.now() + Math.random();
      head.id = id;
      head.readable = true;
      var proxy = getProxy(emitter, ns, id);
      var es = new EventStream(proxy);
      return es.createReadStream(head, true);
    },
    createWriteStream: function(ns, head) {
      if (typeof ns !== 'string') {
        head = ns;
        ns = '*';
      }
      
      head = head || {};
      var id = Date.now() + Math.random();
      head.id = id;
      head.writable = true;
      var proxy = getProxy(emitter, ns, id);
      var es = new EventStream(proxy);
      return es.createWriteStream(head, true);
    }
  }
}