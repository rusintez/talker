var Emitter = require('events').EventEmitter;

exports = module.exports = function(emitter, identity, client) {
  return function(ns) {
    ns = ns || '*';
  
    var receiveKey = ['received', identity, 'event', ns].join('-');
    var sendKey = ['send', identity].join('-');
    var em = new Emitter();
    
    em.client = client;
    em.$emit = em.emit.bind(em);
    
    emitter.on(receiveKey, function(data) {
      em.$emit.apply(null, data.args);
    });
    
    em.emit = function() {
      emitter.emit(sendKey, {
        type: 'event',
        ns: ns,
        args: [].slice.call(arguments)
      });
    }
    
    return em;
  }
}