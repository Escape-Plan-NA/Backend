const express = require('express');
const cors = require('cors');
const http = require('http');
const bodyParser = require('body-parser');
const { initSocket } = require('./config/socketConfig');  // Assuming you're using a socket configuration file

const app = express();
const server = http.createServer(app);
const io = initSocket(server);  // Initialize socket

// Attach `io` to the app so it can be accessed in the routes and controllers
app.set('io', io);

// Middleware
app.use(cors());  // Enable CORS
app.use(bodyParser.json());  // Parse incoming JSON requests
let playerName="";
// API route to set name
app.post('/api/setName', (req, res) => {
  playerName = req.body.name; // Assign the received name to playerName
  console.log('Received name:', playerName);
  res.status(200).json({ message: 'Name received successfully!' });
});
// Route to get the player name
app.get('/api/getName', (req, res) => {
  if (playerName) {
      res.status(200).json({ name: playerName }); // Send the current playerName
  } else {
      res.status(404).json({ message: 'Player name not found' }); // Handle case where playerName isn't set
  }
});

// Mount routes for games and images
const gameRoutes = require('./routes/games');
const imageRoutes = require('./routes/images');
// const scoreRoutes = require('./routes/scores'); // Uncomment if needed

app.use('/games', gameRoutes);
app.use('/images', imageRoutes);
// app.use('/scores', scoreRoutes); // Uncomment if needed

// Server setup
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
