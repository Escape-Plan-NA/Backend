const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./config/socketConfig');  // Assuming you're using a socket configuration file

const app = express();
const server = http.createServer(app);
const io = initSocket(server);  // Initialize socket

// Attach `io` to the app so it can be accessed in the routes and controllers
app.set('io', io);

app.use(express.json());
app.use(cors());

// Mount routes
const gameRoutes = require('./routes/games');
const imageRoutes = require('./routes/images');
//const scoreRoutes = require('./routes/scores');

app.use('/games', gameRoutes);
app.use('/images', imageRoutes);
//app.use('/scores', scoreRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
