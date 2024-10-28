const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const bodyParser = require('body-parser');
const { initSocket } = require('./config/socketConfig');  // Import socket config

const app = express();
const server = http.createServer(app);
const io = initSocket(server);  // Initialize Socket.IO

// Attach `io` to the app so it can be accessed in routes and controllers
app.set('io', io);

// Middleware
app.use(cors());  // Enable CORS to allow requests from different origins
app.use(bodyParser.json());  // Parse incoming JSON requests

// Debugging middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Importing other routes for games and images
const gameRoutes = require('./routes/games');
const imageRoutes = require('./routes/images');
const userRoutes = require('./routes/users');  // Import user routes

// Use routes for games, images, and users
app.use('/games', gameRoutes);
app.use('/images', imageRoutes);
app.use('/users', userRoutes);  // Mount the user routes on '/users'

// Multi-device support
let players = {};  // Store connected players

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('A player connected', socket.id);
  
  // Add new player to the list
  players[socket.id] = {
    id: socket.id,
    moves: [],  // You can track the player's moves here
  };

  // Notify all clients about the new connection
  io.emit('player_connected', { id: socket.id, players });

  // Handle player moves
  socket.on('move', (data) => {
    console.log(`Move from player ${socket.id}:`, data);
    players[socket.id].moves.push(data);  // Store the move
    io.emit('update_state', { playerId: socket.id, move: data });  // Broadcast move
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];  // Remove player
    io.emit('player_disconnected', { id: socket.id, players });
  });

  // Log socket errors
  socket.on('error', (err) => {
    console.error(`Socket error: ${err}`);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

