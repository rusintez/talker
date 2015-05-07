var through = require('through2').obj;

function EventedStream(emitter) {
  if (!(this instanceof EventedStream)) {
    return new EventedStream(emitter);
  }
  
  this.emitter = emitter;
}

EventedStream.prototype.createWriteStream = function(head, isClient) {
  head = head || {};
  var emitter = this.emitter;
  var disconnected = false;
  
  var stream = through(function(chunk, enc, cb) {
    if (disconnected) return;
    if (head.binary) {
      chunk = chunk.toString('base64');
    }
    emitter.emit('data', chunk);
    cb();
  });
  
  stream.on('finish', function() {
    if (disconnected) return;
    emitter.emit('finish');
  });
  
  stream.on('error', function(err) {
    if (disconnected) return;
    emitter.emit('error', err);
  });
  
  stream.on('done', function(data) {
    if (isClient) return;
    emitter.emit('done', data);
  });
  
  stream.on('end', function() {
    emitter.emit('end');
  });
  
  emitter.on('end', function() {
    stream.emit('end');
  });
  
  emitter.on('done', function(data) {
    stream.emit('done', data);
  });
  
  emitter.on('error', function(err) {
    stream.emit('error', err);
  });
  
  emitter.on('disconnect', function() {
    disconnected = true;
    stream.destroy('disconnected');
  });
  
  emitter.emit('head', head);
  
  return stream;
}

EventedStream.prototype.createReadStream = function(head, isClient) {
  head = head || {};
  var emitter = this.emitter;
  var disconnected = false;
  
  var stream = through();
  
  emitter.on('data', function(chunk) {
    if (head.binary) {
      chunk = Buffer(chunk, 'base64');
    }
    stream.push(chunk);
  });
  
  emitter.on('end', function() {
    stream.end();
  });
  
  emitter.on('finish', function() {
    stream.emit('finish');
  });

  emitter.on('done', function(data) {
    stream.emit('done', data);
  });
  
  emitter.on('error', function(err) {
    stream.emit('error', err);
  });
  
  emitter.on('disconnect', function() {
    disconnected = true;
    stream.destroy('disconnected');
  });
  
  stream.on('end', function() {
    if (disconnected) return;
    emitter.emit('end');
  });
    
  stream.on('done', function(data) {
    if (isClient) return;
    if (disconnected) return;
    emitter.emit('done', data);
  });
  
  emitter.emit('head', head);
  
  return stream;
}

exports = module.exports = EventedStream;