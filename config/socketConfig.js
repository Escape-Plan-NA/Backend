const { Server } = require('socket.io');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A player connected', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Player disconnected', socket.id);
    });
  });

  return io;
}

module.exports = { initSocket };
