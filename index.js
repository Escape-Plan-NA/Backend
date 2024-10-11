const express = require('express');
const app = express();

// Import the routes
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const scoreRoutes = require('./routes/scores');

// Use the routes
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/scores', scoreRoutes);

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


