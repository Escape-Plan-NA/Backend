const express = require('express');
const cors = require('cors');
const http = require('http');
const bodyParser = require('body-parser');
const { initSocket } = require('./config/socketConfig');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);  // Initialize socket

// Attach `io` to the app so it can be accessed in the routes and controllers
app.set('io', io);

// Middleware
app.use(cors());  // Enable CORS
app.use(bodyParser.json());  // Parse incoming JSON requests

// Debugging middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
});

// Importing other routes for games and images
const gameRoutes = require('./routes/games');
const imageRoutes = require('./routes/images');
const userRoutes = require('./routes/users');  // Import user routes

// Use routes for games and images
app.use('/games', gameRoutes);
app.use('/images', imageRoutes);
app.use('/users', userRoutes);  // Mount the user routes on '/api'

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
