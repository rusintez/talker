var talk = require('..');
var talker = require('../lib/client');
var ws   = require('websocket-stream');
var http = require('http');
var fs   = require('fs');

var server = http.createServer();

ws.createServer({
  server: server,
  path: '/test'
}, talk(function(token, done) {
  done(null, {});
}, function(t) {
  
  t.streams('upload', function(head, stream) {
    var out = fs.createWriteStream(__dirname + '/' + head.filename);
    
    stream.pipe(out).on('finish', function() {
      console.log('Upload Finished');
      stream.emit('done', { a: 1 });
    });
    
    stream.on('end', function() {
      console.log('Upload ended');
    });
    
    stream.on('done', function() {
      console.log('Upload done');
    });
    
  });
  
  t.streams('download', function(head, stream) {
    var out = fs.createReadStream(__dirname + '/' + head.filename);
    out.pipe(stream).on('finish', function() {
      console.log('Download Finished');
      stream.emit('done', { a: 1 });
    }).on('end', function() {
      console.log('Download Ended');
    }).on('done', function(data) {
      console.log('Download Done', data);
    });
  });
  
}));

server.listen(5000, function() {
  
  var client = talker(function() {
    return ws('ws://localhost:5000/test');
  }, 'token');
  
  var stream = client.streams.createWriteStream('upload', {
    binary: true,
    filename: 'test.js'
  });

  fs.createReadStream(__dirname + '/index.js').pipe(stream).on('end', function() {
    console.log('Server upload ended');
  }).on('finish', function() {
    console.log('Server upload finished');
  }).on('done', function(data) {
    console.log('Server upload done', data);
  });
  
  var stream = client.streams.createReadStream('download', {
    binary: true,
    filename: 'index.js'
  });

  var out = fs.createWriteStream(__dirname + '/upload.js')
  stream.pipe(out);

  stream.on('end', function() {
      console.log('Server download ended');
  }).on('finish', function() {
      console.log('Server download finished');
  }).on('done', function(data) {
      console.log('Server download done', data);
  });

});

