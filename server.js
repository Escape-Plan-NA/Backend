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



// WebSocket Connection Handling
io.on('connection', (socket) => {
  console.log(`A player connected: ${socket.id}`);


  // Assign a role to the new player
  const role = assignRandomRole(socket);
  if (role) {
    console.log(`Assigned role ${role} to player with ID: ${socket.id}`);
    socket.emit('playerConnected', { role });
    console.log(`Emitting 'playerConnected' to client with role: ${role}`);

    // Send the assigned role to the client
    updateAllClientsWithPlayerStatus();       // Update all clients with player status
  } else {
    console.log("Lobby is full, disconnecting:", socket.id);
    socket.emit('error', { message: "Lobby is full." });
    socket.disconnect();
    return;
  }

  socket.on('joinLobby', () => {
    updateAllClientsWithPlayerStatus();
    console.log("Client joined lobby and received player status.");
  });

  // Listen for chat messages from clients
  socket.on('chatMessage', (msg) => {
    console.log('Received message:', msg);
    // Broadcast the message to all connected clients
    io.emit('chatMessage', msg);
  });


  socket.on('playerReady', () => {
    const player = gameData.players.find(p => p.userId === socket.id);
    if (player) {
      player.ready = true;
      console.log(`${player.role} is ready.`);
      checkIfGameCanStart(); // Check if the game can start now
    }
  });

  // Handle player moves
  socket.on('move', ({ role, newPosition }) => {
    const player = gameData.players.find(p => p.role === role && p.userId === socket.id);

    if (!player || gameData.currentTurn !== role) {
      socket.emit('error', { message: `Invalid move: It's not ${role}'s turn or player is not recognized.` });
      return;
    }

    const { row, col } = newPosition;

    if (
      row < 0 || row >= gameData.grid.blocks.length ||
      col < 0 || col >= gameData.grid.blocks[row].length
    ) {
      console.log("Invalid move: position out of bounds.");
      socket.emit('error', { message: "Invalid move: position out of bounds." });
      return;
    }

    const blockType = gameData.grid.blocks[row][col];

    if (!blockType.startsWith('free') && !(blockType === 'tunnel' && role === 'thief')) {
      console.log(`Invalid move: cannot move to a ${blockType} block`);
      return;
    }

    // Update positions and check for win conditions
    if (role === 'farmer') {
      gameData.grid.farmerPosition = newPosition;
      gameData.players[0].position = newPosition;

      if (newPosition.row === gameData.grid.thiefPosition.row && newPosition.col === gameData.grid.thiefPosition.col) {
        gameData.players[0].score++;
        resetGameState('farmer', false, false);
        io.emit('winner', { winner: 'farmer', scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });
        return;
      }
    } else if (role === 'thief') {
      gameData.grid.thiefPosition = newPosition;
      gameData.players[1].position = newPosition;

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

  socket.on('resetGame', resetGameAndScores);

  // WebSocket disconnect handler
  socket.on('disconnect', () => {
    const disconnectedPlayer = gameData.players.find(p => p.userId === socket.id);
    if (disconnectedPlayer) {
      disconnectedPlayer.connected = false;
      disconnectedPlayer.userId = null;
      disconnectedPlayer.ready = false;
      console.log(`Player with role ${disconnectedPlayer.role} disconnected: ${socket.id}`);

      io.emit('playerDisconnected', { role: disconnectedPlayer.role });

      // Reset all game data to the initial state
      stopGame();
    }
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://127.0.0.1:${PORT}`));
