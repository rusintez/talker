exports = module.exports = function(emitter, identity, client) {
  return function(ns, api) {
    if (typeof api === 'undefined') {
      api = ns;
      ns = '*';
    }
    
    var receiveKey = ['received', identity, 'rpc', ns].join('-');
    var sendKey = ['send', identity].join('-');
  
    emitter.on(receiveKey, function(data) {
      var method = api[data.method];
      
      if (method) {
        var cb = function(err, result) {
          emitter.emit(sendKey, {
            id: data.id,
            type: 'rpc',
            ns: ns,
            error: err,
            result: result
          });
        }
        var args = data.args.concat(cb);
        method.apply({ client: client }, args);
      } else {
        emitter.emit(sendKey, {
          type: 'rpc',
          ns: ns,
          id: data.id,
          error: 'method ' + data.method + ' not found'
        });
      }
    });
  }
}