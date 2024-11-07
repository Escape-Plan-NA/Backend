const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const corsConfig = require('./config/corsConfig');
const apiRoutes = require('./routes/apiRoutes');
const socketHandlers = require('./socket/socketHandlers');

const app = express();
app.use(corsConfig);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', apiRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
