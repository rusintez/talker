var EventEmitter  = require('events').EventEmitter;
var through       = require('through2');
var Emitter       = require('./emitter');
var RPC           = require('./rpc');
var Streams       = require('./streams');

exports = module.exports = function(socket, auth) {

  var emitter = new EventEmitter();
  
  var handle = through.obj(function(chunk, enc, cb) {
    emitter.emit('received', JSON.parse(chunk.toString()));
    cb();
  })
  
  var ended = false;
  
  emitter.on('send', function(data) {
    if (ended) return console.log('Socket ended', data);
    socket.write(JSON.stringify(data));
  });
  
  socket.on('end', function() {
    ended = true;
  });
  
  socket
    .pipe(handle)
    .pipe(socket);
  
  if (auth) {
    socket.write(auth);
  }
  
  return {
    emitter: Emitter(emitter),
    rpc: RPC(emitter),
    streams: Streams(emitter)
  }
}