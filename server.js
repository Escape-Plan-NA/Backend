const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

// Serve the index.html file from the root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Adjust this line to serve your HTML file
});

// Serve static files (like CSS, JS) from the public directory
app.use(express.static('public'));

http.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('A player connected', socket.id);

    socket.on('error', (err) => {
        console.error('Socket error:', err); // Log socket errors
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected', socket.id);
    });

    socket.on('move', (data) => {
        console.log('Move received:', data);
        io.emit('update_state', data); // Broadcast the move to all players
    });
});
