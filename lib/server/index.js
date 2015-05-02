var EventEmitter  = require('events').EventEmitter;
var through       = require('through2');
var head          = require('./head');
var Emitter       = require('./emitter');
var RPC           = require('./rpc');
var debug         = require('debug')('talker');
var Streams       = require('./streams');

exports = module.exports = function(authFn, cb) {
  
  var emitter = new EventEmitter();
  
  return function(stream) {
    var client;
    var identity = Math.random() + Date.now();    
    var handle = through.obj(function(chunk, enc, cb) {
      var data;
      try {
        data = JSON.parse(chunk.toString());
      } catch (e) {
        cb(e);
      }
      
      if (data) {
        emitter.emit('received-' + identity, data);
        cb();
      }
    });
    
    emitter.on('send-' + identity, function(data) {
      stream.write(JSON.stringify(data));
    });
    
    var auth = head(function(buffer, done) {
      if (authFn) {
        authFn(buffer.toString(), function(err, res) {
          if (err) return done(err);
          client = res;
          done();
        });
      } else {
        done();
      }
    });
    
    auth.on('error', function(err) {
      debug(err);
      stream.destroy();
    });
    
    function getClient() {
      return client;
    }
    
    stream
      .pipe(auth)
      .pipe(handle)
      .pipe(stream);
    
    cb({
      emitter: Emitter(emitter, identity, getClient),
      rpc: RPC(emitter, identity, getClient),
      streams: Streams(emitter, identity, getClient)
    });
  }
}
