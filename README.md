# talker

Simplified client/server communication, using websockets

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

// remote procedure calling
var rpc = remote.rpc();

rpc.call('sum', 2, 2, function(err, result) {
  console.log(err, result); // null, 4
});

rpc.call('hello', function(err, result) {
  console.log(err, result); // null, 'Hello, John'
});

// using streams

var file = document.getElementById('input').files[0];

var stream = remote.stream('upload', { 
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

var stream = remote.stream('download', {
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
shoe(talk(auth, function(t, client) {

  // remote event emitter api
  var events = t.emitter();

  events.on('echo', function(msg) {
    events.emit('echo', msg);
  });

  // remote procedure calling api
  var rpc = t.rpc({
    sum: function(a, b, cb) {
      cb(null, a + b);
    },
    hello: function(cb) {
      cb(null, 'Hello, ' + client.name);
    }
  });
  
  t.stream('upload', function(head, stream, client) {
    stream.pipe(fs.createWriteStream(__dirname + '/' + head.filename));
  });
  
  t.stream('download', function(head, stream, client) {
    stream.push(null); // close readable (prevent memory leaks)
    fs.createReadStream(__dirname + '/' + head.filename ).pipe(stream);
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
