//
// The big mesh allows big to communicate with other big instances
//
var big  = require('big'),
    mesh = big.define('mesh');

mesh.method('start', start);
mesh.method('connect', connect, {
  "description": "Connect to the big mesh "
});
mesh.method('listen', listen, {
  "description": "Listens for incoming big instances"
});

function start () {
}

//
// Connects to a Big mesh to broadcast and listen for events
//
function connect () {

  var client = require('engine.io-client');

  mesh.client = new client.Socket({ host: 'localhost', port: 8000 });

  mesh.client.on('open', function () {

    //
    // Any mesh client events should be rebroadcasted locally,
    // but they should not be re-emitted
    //
    mesh.client.on('message', function(data){
      var msg = JSON.parse(data);
      big.emit(msg.event, msg.payload, false)
    })
    
    //
    // Any local events, should be re-broadcasted back to mesh,
    // unless reemit === false
    //
    big.onAny(function(data, reemit) {
      if(reemit !== false) {
        var msg = {
          event: this.event,
          payload: data
        };
        mesh.client.send(JSON.stringify(msg));
      }
    });

  });


};

function listen (options) {

  var engine = require('engine.io');

  mesh.server = engine.listen(8000)

  mesh.server.on('connection', function (socket) {

    socket.on('message', function(data){
      var msg = JSON.parse(data);
      big.emit(msg.event, msg.payload, false)
    });

    //
    // Any local events, should be re-broadcasted back to mesh,
    // unless reemit === false
    //
    big.onAny(function(data, reemit) {
      var msg = {
        event: this.event,
        payload: data
      };
      if(reemit !== false) {
        socket.send(JSON.stringify(msg));
      }
    });

  });

};

exports.dependencies = {
  "engine.io": "*",
  "engine.io-client": "*"
};

exports.mesh = mesh;