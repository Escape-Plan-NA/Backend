const cors = require('cors');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); // Enable CORS for Express

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});


let gameData = {
  players: [
    { userId: null, username: '', image_id: '', role: 'farmer', position: { row: 1, col: 1 }, score: 0, connected: false, ready: false },
    { userId: null, username: '', image_id: '', role: 'thief', position: { row: 1, col: 1 }, score: 0, connected: false, ready: false }
  ],
  grid: {
    blocks: [],
    farmerPosition: { row: 1, col: 1 },
    thiefPosition: { row: 1, col: 1 }
  },
  currentTurn: 'thief',
  winner: null,
  timeLeft: 60,
  turnTimeLeft: 10,
  gameStarted: false
};

let turnTimer = null;
let sessionTimer = null;

// Helper function to generate the grid
function generateRandomGrid() {
  let blocks = Array(25).fill('free');
  for (let i = 0; i < 5; i++) blocks[i] = 'obstacle';
  blocks[5] = 'tunnel';
  blocks = blocks.sort(() => Math.random() - 0.5);
  blocks = blocks.map(block => (block === 'free' ? `free${Math.floor(Math.random() * 3) + 1}` : block));

  const grid = [];
  for (let i = 0; i < 5; i++) {
    grid.push(blocks.slice(i * 5, i * 5 + 5));
  }
  return grid;
}

// Helper function to get random free blocks for placing players
function getRandomFreeBlocks(grid) {
  const freeBlocks = [];
  grid.forEach((row, rowIndex) => {
    row.forEach((block, colIndex) => {
      if (block.startsWith('free')) {
        freeBlocks.push({ row: rowIndex, col: colIndex });
      }
    });
  });
  return freeBlocks.sort(() => Math.random() - 0.5).slice(0, 2);
}

function stopGame() {
  gameData = {
    players: [
      { userId: null, role: 'farmer', position: { row: 1, col: 1 }, score: 0, connected: false, ready: false },
      { userId: null, role: 'thief', position: { row: 1, col: 1 }, score: 0, connected: false, ready: false }
    ],
    grid: {
      blocks: [],
      farmerPosition: { row: 1, col: 1 },
      thiefPosition: { row: 1, col: 1 }
    },
    currentTurn: 'thief',
    winner: null,
    timeLeft: 60,
    turnTimeLeft: 10,
    gameStarted: false
  };

  // Clear timers
  if (sessionTimer) clearInterval(sessionTimer);
  if (turnTimer) clearInterval(turnTimer);
  sessionTimer = null;
  turnTimer = null;

  console.log("Game stopped, clearing all gameData");
  io.emit('gameReset', gameData); // Notify clients of the reset
}

// Reset game state to initial positions
function resetGameState(winnerRole = 'thief', resetScores = false, resetTime = false) {
  gameData.grid.blocks = generateRandomGrid();
  const [farmerPos, thiefPos] = getRandomFreeBlocks(gameData.grid.blocks);
  gameData.grid.farmerPosition = farmerPos;
  gameData.grid.thiefPosition = thiefPos;
  gameData.players[0].position = farmerPos;
  gameData.players[1].position = thiefPos;

  if (resetScores) {
    gameData.players[0].score = 0;
    gameData.players[1].score = 0;
    console.log(`Game scores reset. Starting turn: ${gameData.currentTurn}`);
  }

  if (resetTime) {
    gameData.timeLeft = 60;
    console.log(`Game time reset. Starting turn: ${gameData.currentTurn}`);
  }

  gameData.currentTurn = winnerRole || 'thief';
  gameData.winner = null;
  gameData.turnTimeLeft = 10;

  io.emit('timerUpdate', { timeLeft: gameData.timeLeft, turnTimeLeft: gameData.turnTimeLeft });
  io.emit('gameState', gameData);

  if (sessionTimer) clearInterval(sessionTimer);
  if (turnTimer) clearInterval(turnTimer);

  if (gameData.gameStarted) startTimers();
  //console.log(`Game reset to initial state. Starting turn: ${gameData.currentTurn}`);
}

// Start timers for session and turns
function startTimers() {
  sessionTimer = setInterval(() => {
    gameData.timeLeft -= 1;
    if (gameData.timeLeft <= 0) {
      endSession();
      gameData.timeLeft = 60;
    }
    io.emit('timerUpdate', { timeLeft: gameData.timeLeft, turnTimeLeft: gameData.turnTimeLeft });
  }, 1000);

  turnTimer = setInterval(() => {
    gameData.turnTimeLeft -= 1;
    if (gameData.turnTimeLeft <= 0) {
      switchTurn();
      gameData.turnTimeLeft = 10;
    }
    io.emit('timerUpdate', { timeLeft: gameData.timeLeft, turnTimeLeft: gameData.turnTimeLeft });
  }, 1000);
}

// Switch turns between farmer and thief
function switchTurn() {
  gameData.currentTurn = gameData.currentTurn === 'farmer' ? 'thief' : 'farmer';
  io.emit('gameState', gameData);
  gameData.turnTimeLeft = 10;
  console.log(`Turn switched to: ${gameData.currentTurn}`);
}

// Reset game and scores
function resetGameAndScores() {
  resetGameState(null, true, true);
}

function endSession() {
  stopGame(); // Clears game data and timers
  io.emit('sessionEnded'); // Notify clients that the session has ended
  console.log("Session has ended. Game stopped.");
}

// Emit updated player status to all clients
function updateAllClientsWithPlayerStatus() {
  io.emit('currentPlayerStatus', { players: gameData.players });
}

function assignRandomRole(socket) {
  const availablePlayers = gameData.players.filter(player => !player.connected);
  if (availablePlayers.length === 0) return null;

  // Select a random player from the available players
  const randomIndex = Math.floor(Math.random() * availablePlayers.length);
  const selectedPlayer = availablePlayers[randomIndex];

  selectedPlayer.userId = socket.id;
  selectedPlayer.connected = true;

  return selectedPlayer.role;
}


function checkIfGameCanStart() {
  const allReady = gameData.players.every(player => player.connected && player.ready);

  console.log("Checking if game can start. Player statuses:");
  gameData.players.forEach(player => {
    console.log(`Role: ${player.role}, Connected: ${player.connected}, Ready: ${player.ready}`);
  });

  if (allReady) {
    gameData.gameStarted = true;
    io.emit('gameStarted');
    console.log("Both players are ready. Game is starting.");
    updateAllClientsWithPlayerStatus();
  } else {
    console.log("Not all players are ready. Waiting...");
  }
}

function logMove(playerRole, direction) {
  const logMessage = `${playerRole} moved ${direction}`;
  console.log("[Move Log]", logMessage);
  io.emit("moveLog", logMessage); // Emit the log message to all connected clients
}

app.get('/api/get-role/:socketID', (req, res) => {
  const { socketID } = req.params;

  // Find the player in gameData.players with a matching userId
  const player = gameData.players.find(player => player.userId === socketID);

  if (player && player.role) {
    // If a player with the matching userId is found, return the role
    res.json({ role: player.role });
  } else {
    // If no player is found, return a 404 error
    res.status(404).json({ error: "Role not found for this socketID." });
  }
});

app.get('/api/gameData', (req, res) => {
  // Extract the relevant data you want to send to the client
  const playerData = gameData.players.map(player => ({
    userId: player.userId,
    username: player.username,
    role: player.role,
    image_id: player.image_id // Only send the image ID, not the full URL
  }));
  
  res.json({ players: playerData });
});

let totalConnectedClients = 0;
let connectedPlayerCount = 0; 
// WebSocket Connection Handling
io.on('connection', (socket) => {
  totalConnectedClients++;
  io.emit('totalConnectedClients', totalConnectedClients); // Emit the updated count to all clients
  console.log(`A player connected: ${socket.id}. Total connected clients: ${totalConnectedClients}`);

  setTimeout(() => {
    socket.emit('totalConnectedClients', totalConnectedClients);
  }, 50); // Delay to ensure the client is ready to receive the event

  socket.on('joinLobby', () => {
    // Check if the user already has a role assigned
    const existingPlayer = gameData.players.find(player => player.userId === socket.id);

    if (existingPlayer) {
      console.log(`Player with ID ${socket.id} already has a role: ${existingPlayer.role}`);
      socket.emit('playerConnected', { role: existingPlayer.role });
      return; // Exit to prevent assigning a new role
    }

    const role = assignRandomRole(socket);
    if (role) {
      console.log(`Assigned role ${role} to player with ID: ${socket.id}`);
      socket.emit('playerConnected', { role });

      // Increment the player count and emit to all clients
      connectedPlayerCount++;
      io.emit('connectedPlayerCount', connectedPlayerCount);
    } else {
      console.log("Lobby is full, disconnecting:", socket.id);
      socket.emit('error', { message: "Lobby is full." });
      socket.disconnect();
    }

    console.log("Client joined lobby and received player status.");
  });

  // Listen for chat messages from clients
  socket.on('chatMessage', (msg) => {
    console.log('Received message:', msg);
    // Broadcast the message to all connected clients
    io.emit('chatMessage', msg);
  });


  socket.on('playerReady', ({ userId, username, profilePictureId }) => {
    const player = gameData.players.find(p => p.userId === userId);
    if (player) {
      player.ready = true;
      player.username = username;       // Update the player's username
      player.image_id = profilePictureId; // Update the player's profile picture (image_id field)
      
      console.log(`${player.role} is ready with username: ${username} and profile picture: ${profilePictureId}`, gameData.players);
      
      checkIfGameCanStart(); // Check if the game can start now
    }
  });
  

  socket.on('move', ({ role, direction }) => {
    const player = gameData.players.find(p => p.role === role && p.userId === socket.id);
  
    if (!player || gameData.currentTurn !== role) {
      socket.emit('error', { message: `Invalid move: It's not ${role}'s turn or player is not recognized.` });
      return;
    }
  
    // Calculate new position based on direction
    let newPosition = { ...player.position };
    switch (direction) {
      case "up":
        newPosition.row -= 1;
        break;
      case "down":
        newPosition.row += 1;
        break;
      case "left":
        newPosition.col -= 1;
        break;
      case "right":
        newPosition.col += 1;
        break;
      default:
        logMove(role, "invalid move");
        return;
    }
  
    // Validate the move is within grid boundaries
    if (
      newPosition.row < 0 ||
      newPosition.row >= gameData.grid.blocks.length ||
      newPosition.col < 0 ||
      newPosition.col >= gameData.grid.blocks[0].length
    ) {
      logMove(role, "invalid move");
      socket.emit('error', { message: "Invalid move: position out of bounds." });
      return;
    }
  
    const blockType = gameData.grid.blocks[newPosition.row][newPosition.col];
  
    // Check if move is to a valid block type
    if (!blockType.startsWith('free') && !(blockType === 'tunnel' && role === 'thief')) {
      //logMove(role, "invalid move");
      socket.emit('error', { message: `Invalid move: cannot move to a ${blockType} block.` });
      return;
    }
  
    logMove(role, direction);
  
    // Update the player position and check for win conditions
    player.position = newPosition;
  
    if (role === 'farmer') {
      gameData.grid.farmerPosition = newPosition;
  
      if (newPosition.row === gameData.grid.thiefPosition.row && newPosition.col === gameData.grid.thiefPosition.col) {
        gameData.players[0].score++;
        resetGameState('farmer', false, false);
        io.emit('winner', { winner: 'farmer', scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });
        return;
      }
    } else if (role === 'thief') {
      gameData.grid.thiefPosition = newPosition;
  
      if (newPosition.row === gameData.grid.farmerPosition.row && newPosition.col === gameData.grid.farmerPosition.col) {
        gameData.players[0].score++;
        resetGameState('farmer', false, false);
        io.emit('winner', { winner: 'farmer', scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });
        return;
      }
  
      if (blockType === 'tunnel') {
        gameData.players[1].score++;
        resetGameState('thief', false, false);
        io.emit('winner', { winner: 'thief', scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });
        return;
      }
    }
  
    switchTurn();
  });

  socket.emit('game_update', gameData);

  socket.on('surrender', ({ role }, callback) => {
    // Find the surrendering player by role
    const winningPlayer = Object.values(gameData.players).find(player => player.role !== role);
    const surrenderingPlayer = Object.values(gameData.players).find(player => player.role === role);
    
    // Log to identify potential issues
    console.log("Winning Player:", winningPlayer);

    // Check if players are defined before proceeding
    if (!winningPlayer || !surrenderingPlayer) {
        console.error("Error: Player not found for surrender event");
        return callback({ error: "Player not found" });
    }

    // Update scores
    winningPlayer.score += 1;

    // Send updated scores and game-over message back to the clients
    const message = `${winningPlayer.role} wins due to ${surrenderingPlayer.role} surrendering!`;
    io.emit('surrender', { message, scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });

    // Acknowledge the surrender with updated scores
    callback({
        scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score },
        winner: winningPlayer.role
    });
  });
  socket.on('resetFromSurrender', resetGameState);

  socket.on('resetGame', resetGameAndScores);

  socket.on('disconnect', () => {
    const disconnectedPlayer = gameData.players.find(p => p.userId === socket.id);

    // Handle player disconnection in gameData if applicable
    if (disconnectedPlayer) {
      disconnectedPlayer.connected = false;
      disconnectedPlayer.userId = null;
      disconnectedPlayer.ready = false;
      console.log(`Player with role ${disconnectedPlayer.role} disconnected: ${socket.id}`);

      // Decrement lobby-specific connectedPlayerCount and emit to all clients
      connectedPlayerCount = Math.max(connectedPlayerCount - 1, 0);
      io.emit('connectedPlayerCount', connectedPlayerCount);

      if (connectedPlayerCount === 0) {
        stopGame();
      }
    }

    // Decrement totalConnectedClients and emit the updated count to all clients
    totalConnectedClients = Math.max(totalConnectedClients - 1, 0);
    io.emit('totalConnectedClients', totalConnectedClients);
    console.log(`Total connected clients after disconnect: ${totalConnectedClients}`);
  });
  
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://127.0.0.1:${PORT}`, gameData));
