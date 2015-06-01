# talker

Simplified client/server communication, using websockets

### Usage

Check `example`

#### Connect

client
```javascript
var talk = require('talker');
var shoe = require('shoe');

// will be called everytime connection is broken
function getStream() {
  return shoe('/api');
}

// connect
var remote = talk(getStream);

// alternatively connect using auth-token
var secure = talk(getStream, 'my-secret-auth-token');
```

server
```javascript
var http = require('http');
var talk = require('talker');
var shoe = require('shoe');

var server = http.createServer();

// authenticate
function auth(token, cb) {
  if (token === 'my-secret-auth-token') {
    cb(null, { id: 123, name: 'John', role: 'admin' });
  }
}

// on client connected
function onConection(remote, client) {
  // client.id === 123
  // application logic here...
}

// accept connections
shoe(talk(onConnection)).install(server, '/api');

// alternatively accept connections and authenticate clients
shoe(talk(auth, onConnection)).install(server, '/secure');

server.listen(5000);
```

#### EventEmitter API

client
```javascript

// create emitter
var emitter = remote.emitter();

// listen on events from server
emitter.on('echo', function(msg) {
  console.log(msg); // 'Hello'
});

// emit events to server
emitter.emit('echo', 'Hello');

// create namespaced emitter
var chat = remote.emitter('chat');

chat.on('message', function(message) {
  //...
});
```

server
```javascript

function onConnection(remote, client) {
  var emitter = remote.emitter();

  emitter.on('echo', function(msg) {
    emitter.emit('echo', msg);
  });

  var chat = remote.emitter('chat');

  chat.emit('message', 'Hi there!');
}
```

#### RPC API

client
```javascript

// create default rpc
var rpc = remote.rpc();

rpc.call('sum', 2, 2, function(err, result) {
  console.log(err, result); // null, 4
});

// create namespaced rpc
var users = remote.rpc('users');

users.call('create', { name: 'Peter' }, function(err, user) {
  // ...
});
```

server
```javascript

function onConnection(remote, client) {

  // default
  var rpc = remote.rpc({
    sum: function(a, b, cb) {
      cb(null, a + b);
    }
  });

  // namespaced
  var users = remote.rpc('users', {
    create: function(object, cb) {
      // do stuff ...
      cb(null, user);
    }
  })
}
```

#### Stream API

client
```javascript

var head = {
  filename: 'hello.txt',
  binary: true
}

// create upload stream with additional meta
var stream = remote.stream('upload', head);

// write buffers, since binary is set to true
stream.write(new Buffer('Hello world!'));
stream.end();

stream.on('data', function(result) {
  console.log('Upload complete with', result);
});
```

server
```javascript

function onConnection(remote, client) {
  remote.stream('upload', function(stream, head) {
    var out = fs.createWriteStream(__dirname + '/' + head.filename);

    out.on('finish', function() {
      stream.end(new Buffer('Success'));
    });

    stream.pipe(out);
  });
}
```

### TODO

- tests
- coverage

### Author

Vladimir Popov <rusintez@gmail.com>

### License

MIT
