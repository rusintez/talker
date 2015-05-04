var EventEmitter  = require('events').EventEmitter;
var through       = require('through2').obj;
var head          = require('./head');
var Emitter       = require('./emitter');
var RPC           = require('./rpc');
var debug         = require('debug')('talker');
var Streams       = require('./streams');

function parse(message, cb) {
  var data;
  try {
    data = JSON.parse(message);
  } catch (e) {
    cb(e);
  }
  cb(null, data);
}

exports = module.exports = function(authFn, cb) {
  
  var emitter = new EventEmitter();
  
  return function(stream) {
    
    var client;
    var identity = Math.random() + Date.now();    
    
    emitter.on(['send', identity].join('-'), function(data) {
      stream.write(JSON.stringify(data));
    });
    
    function init() {
      cb({
        emitter: Emitter(emitter, identity, client),
        rpc: RPC(emitter, identity, client),
        streams: Streams(emitter, identity, client)
      });
    }
    
    var auth = head(function(buffer, done) {
      if (authFn) {
        authFn(buffer.toString(), function(err, result) {
          if (err) return done(err);
          client = result;
          init();
          done();
        });
      } else {
        init();
        done();
      }
    }).on('error', function(err) {
      debug(err);
      stream.destroy();
    });
    
    var handle = through(function(chunk, enc, cb) {
      parse(chunk.toString(), function(err, data) {
        if (err) return cb(err);
        var key = ['received', identity, data.type, data.ns].join('-');
        emitter.emit(key, data);
        cb();
      });
    });
    
    stream
      .pipe(auth)
      .pipe(handle)
      .pipe(stream);
    
    stream.on('end', function() {
      emitter.emit('disconnect');
    });
    
    stream.on('close', function() {
      emitter.emit('disconnect');
    });
  }
}
