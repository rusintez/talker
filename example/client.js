var talk      = require('../');
var shoe      = require('shoe');
var through   = require('through2').obj;
var toBuffer  = require('blob-to-buffer');
var rebuffer  = require('rebuffer');
var remote    = talk(shoe('/talk'), '12345');

var emitter = remote.emitter();
var rpc     = remote.rpc();

emitter.on('pong', function() {
  console.log('pong');
});

emitter.emit('ping');

emitter.on('echo', function(msg) {
  console.log('echo', msg);
});

emitter.emit('echo', 'Hello');

rpc.call('hello', function(err, result) {
  console.log('rpc hello', err, result);
});

rpc.call('sum', 2, 2,function(err, result) {
  console.log('rpc sum', err, result);
});

rpc.call('missing', function(err, result) {
  console.log('method missing', err, result);
});

var input = document.querySelector('#input');

input.addEventListener('change', function() {
  var file = this.files[0];
  toBuffer(file, function(err, buffer) {
    var out = through();
    out.write(buffer);
    out.end(function() {
      console.log('File ended');
    });
    
    var stream = remote.streams.createWriteStream('upload', { binary: true, filename: file.name });
    
    stream.on('finish', function() {
      console.log('transfer ended');
    });
    
    stream.on('end', function() {
      console.log('Upload ended');
    });
    
    out.pipe(rebuffer(1024 * 128)).pipe(stream);
  });
});

var button = document.querySelector('#button');

button.addEventListener('click', function() {
  remote.streams.createReadStream('download', { binary: true, filename: 'server.js' }).pipe(through(function(chunk) {
    console.log(chunk.toString());
  }));
});