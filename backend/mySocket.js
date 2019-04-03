const io = require("socket.io")();

module.exports = {
  setup: function(port) {
    if (port === 8000) {
      let clients = {};
      io.on("connection", client => {
        //Add a new client indexed by his id
        clients[client.id] = {
          position: [0, 0, 0],
          rotation: [0, 0, 0]
        };
        console.log(
          "User " +
            client.id +
            " connected, there are " +
            io.engine.clientsCount +
            " clients connected"
        );
        client.on("move", pos => {
          clients[client.id].position = pos;
          io.sockets.emit("userPositions", clients);
        });

        //Handle the disconnection
        client.on("disconnect", () => {
          //Delete this client from the object
          delete clients[client.id];

          io.sockets.emit(
            "userDisconnected",
            io.engine.clientsCount,
            client.id,
            Object.keys(clients)
          );

          console.log(
            "User " +
              client.id +
              " disconnected, there are " +
              io.engine.clientsCount +
              " clients connected"
          );
        });
        //Make sure to send the client it's ID
        client.emit("introduction", client.id, io.engine.clientsCount, clients);
        //Update everyone that the number of users has changed
        io.sockets.emit(
          "newUserConnected",
          io.engine.clientsCount,
          client.id,
          Object.keys(clients)
        );
      });
      io.listen(port);
      console.log("listening on port ", port);
    }
  },
  bye: function(name) {
    console.log("Goodbye, " + name);
  }
};
