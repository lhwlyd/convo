const io = require("socket.io")();

module.exports = {
  setup: function(port) {
    if (port === 8001) {
      io.on("connection", client => {
        client.on("subscribeToTimer", interval => {
          console.log(
            "client is subscribing to timer with interval ",
            interval
          );
          setInterval(() => {
            client.emit("timer", new Date());
          }, interval);
        });
      });
      io.listen(port);
      console.log("listening on port ", port);
    }
  },
  bye: function(name) {
    console.log("Goodbye, " + name);
  }
};
