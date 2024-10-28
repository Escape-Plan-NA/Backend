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
    //store socket id
    console.log('A player connected', socket.id);
    socketsConnected.add(socket.id);
    //emit total clients connected
    io.emit('clients-total', socketsConnected.size);

    socket.on('disconnect', () => {
      //delete socket id
      console.log('Player disconnected', socket.id);
      socketsConnected.delete(socket.id);
      //emit total clients connected
      io.emit('clients-total', socketsConnected.size);
    });
    
    socket.on('message', (data) => {
      io.emit('message', data);
      socket.broadcast.emit('chat-message', data);
    });
  });

  return io;
}

module.exports = { initSocket };
