var debug = require('debug')('ploy');

exports = module.exports = function(emitter) {
  return function(ns) {
    ns = ns || '*';
    var registry = {};
    var receiveKey = ['received', 'rpc', ns].join('-');
    
    emitter.on(receiveKey, function(data) {
      var cb = registry[data.id];
      if (cb) {
        cb(data.error, data.result);
        delete registry[data.id];
      } else {
        debug('Cant find callback for', data);
      }
    });
    
    return {
      call: function() {
        var args = [].slice.call(arguments);
        var method = args.shift();
        var cb = args.pop();
        var id = Math.random() + Date.now();
        registry[id] = cb;
        emitter.emit('send', {
          id: id,
          type: 'rpc',
          ns: ns,
          args: args,
          method: method
        });
      }
    }
  }
}