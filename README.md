# talker

messaging patterns for streams on client and server

### Usage

Check `example`

client.js
```javascript
var talk = require('talker');
var shoe = require('shoe');
var through = require('through2');

// connect and (optionally) authenticate
var remote  = talk(function() {
  return shoe('/talk');
}, 'my-auth-token');

// remote event emitter api
var emitter = remote.emitter();

emitter.on('echo', function(msg) {
  console.log(msg); // 'Hello'
});

emitter.emit('echo', 'Hello');

// remote procedure calling api
var rpc = remote.rpc();

rpc.call('sum', 2, 2, function(err, result) {
  console.log(err, result); // null, 4
});

rpc.call('hello', function(err, result) {
  console.log(err, result); // null, 'Hello, John'
});

// using streams

var file = document.getElementById('input').files[0];

var stream = remote.streams.createReadStream('upload', { 
  filename: file.name, 
  binary: true
});

toBuffer(file, function(err, buffer) {
  stream.write(buffer);
  stream.end();
});

stream.on('end', function() {
  console.log('Upload complete');
});

var stream = remote.streams.createWriteStream('download', {
  filename: file.name
});

stream.pipe(through(function(chunk, enc, cb) {
  console.log(chunk);
  cb();
}));

```

server.js
```javascript
var http = require('http');
var talk = require('talker');
var shoe = require('shoe');

var server = http.createServer();

// authenticate
var auth = function(token, cb) {
  if (token === 'my-auth-token') {
    cb(null, { name: 'John' });
  }
}

// second function is called on client connect
shoe(talk(auth, function(t) {

  // remote event emitter api
  var events = t.emitter();

  events.on('echo', function(msg) {
    this.client; // { name: 'John' }
    events.emit('echo', msg);
  });

  // remote procedure calling api
  var rpc = t.rpc({
    sum: function(a, b, cb) {
      cb(null, a + b);
    },
    hello: function(cb) {
      cb(null, 'Hello, ' + this.client.name);
    }
  });
  
  t.streams('upload', function(head, stream, client) {
    stream.pipe(fs.createWriteStream(__dirname + '/' + head.filename));
  });
  
  t.streams('download', function(head, stream, client) {
    stream.pipe(fs.createReadStream(__dirname + '/' + head.filename ));
  });
      
})).install(server, '/talk');

server.listen(50000, function() {
  console.log('Server is listening on port 50000');
});
```

### TODO

- document `namespaces`
- tests
- coverage

### License

MIT
