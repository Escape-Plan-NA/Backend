const { Server } = require('socket.io');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT"]
    }
  });

  let socketsConnected = new Set();

  io.on('connection', (socket) => {
    console.log('A player connected', socket.id);
    socketsConnected.add(socket.id);

    io.emit('clients-total', socketsConnected.size);

    socket.on('disconnect', () => {
      console.log('Player disconnected', socket.id);
      socketsConnected.delete(socket.id);
      io.emit('clients-total', socketsConnected.size);
    });
  });

  return io;
}

module.exports = { initSocket };
