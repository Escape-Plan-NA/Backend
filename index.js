const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const socketHandlers = require('./socket/socketHandlers');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

socketHandlers(io);

const adminNamespace = io.of('/admin');
adminNamespace.on('connection', (socket) => {
    console.log('Server interface connected:', socket.id);

    // Listen for total connected clients and send to the server interface
    socket.emit('totalConnectedClients', totalConnectedClients);

    // Update the interface when the client count changes
    io.on('totalConnectedClients', (count) => {
        adminNamespace.emit('totalConnectedClients', count);
    });

    // Listen for game reset requests from the interface
    socket.on('resetGame', () => {
        io.emit('resetGame'); // Emit to all clients to reset the game
        console.log('Reset game requested by server interface.');
    });

    socket.on('disconnect', () => {
        console.log('Server interface disconnected:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://127.0.0.1:${PORT}`));
