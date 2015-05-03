var through = require('through2').obj;

function EventedStream(emitter) {
  if (!(this instanceof EventedStream)) {
    return new EventedStream(emitter);
  }
  
  this.emitter = emitter;
}

EventedStream.prototype.createWriteStream = function(head) {
  head = head || {};
  var emitter = this.emitter;
  
  var close;
  var stream = through({ allowHalfOpen: false }, function(chunk, enc, cb) {
    if (head.binary) {
      chunk = chunk.toString('base64');
    }
    emitter.emit('data', chunk);
    cb();
  }, function(cb) {
    close = cb;
  });
  
  var finished = false;
  stream.on('finish', function() {
    finished = true;
    emitter.emit('finish');
  });
  
  stream.on('error', function(err) {
    emitter.emit('error', err);
  });
  
  emitter.on('finish', function() {
    if (finished) return;
    stream.emit('finish');
  });
  
  emitter.on('end', function() {
    close();
    stream.emit('end');
  });
  
  emitter.on('error', function(err) {
    stream.emit('error', err);
  });
  
  emitter.emit('head', head);
  return stream;
}

EventedStream.prototype.createReadStream = function(head) {
  head = head || {};
  var emitter = this.emitter;
  
  var stream = through({ allowHalfOpen: false });
  
  emitter.on('data', function(chunk) {
    if (head.binary) {
      chunk = Buffer(chunk, 'base64');
    }
    stream.push(chunk);
  });
  
  emitter.on('end', function() {
    console.log('EMITTER ENDED');
    stream.end();
  });
  
  emitter.on('finish', function() {
    stream.emit('finish');
  });
  
  stream.on('end', function() {
    emitter.emit('end');
  });
  
  emitter.on('error', function(err) {
    stream.emit('error', err);
  });
  
  emitter.emit('head', head);
  return stream;
}

exports = module.exports = EventedStream;