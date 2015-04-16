exports = module.exports = function(emitter) {
  return function(ns) {
    ns = ns || '*';
    var registry = {};
    return {
      call: function() {
        var args = [].slice.call(arguments);
        var method = args.shift();
        var cb = function(){ };
        if (typeof args[args.length - 1] === 'function') {
          cb = args.pop();
        }
        var id = Math.random() + Date.now();
        registry[id] = cb;
        emitter.emit('send', {
          id: id,
          type: 'rpc',
          ns: ns,
          args: args,
          method: method
        });
        emitter.on('received', function(data) {
          if (data.type === 'rpc' && data.ns === ns) {
            var cb = registry[data.id];
            if (cb) {
              cb(data.error, data.result);
              delete registry[data.id];
            }
          }
        });
      }
    }
  }
}