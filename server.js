const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Escape Plan Server is Running');
});

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

io.on('connection', (socket) => {
    console.log('A player connected', socket.id);
  
    socket.on('disconnect', () => {
        console.log('Player disconnected', socket.id);
    });
  
    socket.on('move', (data) => {
        console.log('Move received:', data);
        io.emit('update_state', data); // Broadcast the move to all players
    });
});
