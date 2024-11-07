const cors = require('cors');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

let isGameStarted = false;
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
  updateGameStatus();

  console.log("Game stopped, clearing all gameData");

  io.emit('gameReset', gameData);
  io.emit('leftGame');
  console.log("left game called");

  connectedPlayerCount = 0;
  io.emit('connectedPlayerCount', connectedPlayerCount);

  isGameStarted = false;
}

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
}

function updateGameStatus() {
  io.emit('gameStatus', { gameStarted: gameData.gameStarted });
}

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

function switchTurn() {
  gameData.currentTurn = gameData.currentTurn === 'farmer' ? 'thief' : 'farmer';
  io.emit('gameState', gameData);
  gameData.turnTimeLeft = 10;
  console.log(`Turn switched to: ${gameData.currentTurn}`);
}

function resetGameAndScores() {
  resetGameState(null, true, true);
}

function endSession() {
  // Stop all timers immediately
  if (sessionTimer) clearInterval(sessionTimer);
  if (turnTimer) clearInterval(turnTimer);
  sessionTimer = null;
  turnTimer = null;

  console.log(`Game session ended. Final Scores - Farmer: ${gameData.players[0].score}, Thief: ${gameData.players[1].score}`);

  io.emit('sessionEnded', { scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });
  console.log("Session has ended. Game stopped.");

  // Wait 10 seconds before resetting the game data and notifying clients
  setTimeout(() => {
    stopGame(); // Reset the game state fully after the delay
  }, 10000); // 10 seconds delay
}


function updateAllClientsWithPlayerStatus() {
  io.emit('currentPlayerStatus', { players: gameData.players });
}

function assignRandomRole(socket) {
  const availablePlayers = gameData.players.filter(player => !player.connected);
  if (availablePlayers.length === 0) return null;

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
    updateGameStatus();
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
  io.emit("moveLog", logMessage);
}

app.get('/api/get-role/:socketID', (req, res) => {
  const { socketID } = req.params;

  const player = gameData.players.find(player => player.userId === socketID);

  if (player && player.role) {
    res.json({ role: player.role });
  } else {
    res.status(404).json({ error: "Role not found for this socketID." });
  }
});

app.get('/api/gameData', (req, res) => {
  const playerData = gameData.players.map(player => ({
    userId: player.userId,
    username: player.username,
    role: player.role,
    image_id: player.image_id
  }));
  
  res.json({ players: playerData });
});

app.get('/api/final-scores', (req, res) => {
  res.json({
      scores: {
          farmer: gameData.players[0].score,
          thief: gameData.players[1].score,
      }
  });
});

let totalConnectedClients = 0;
let connectedPlayerCount = 0;

io.on('connection', (socket) => {
  const isServerPage = socket.handshake.query.type === 'server';

  if (!isServerPage) {
      totalConnectedClients++;
      io.emit('totalConnectedClients', totalConnectedClients);
      console.log(`Game client connected: ${socket.id}. Total game clients: ${totalConnectedClients}`);
  } else {
      console.log(`Server page connected: ${socket.id}.`);
  }

  socket.on("clientConnected", () => {
    io.emit("totalConnectedClients", totalConnectedClients);
  });

  setTimeout(() => {
    socket.emit('totalConnectedClients', totalConnectedClients);
  }, 50);

  socket.on('joinLobby', () => {
    const existingPlayer = gameData.players.find(player => player.userId === socket.id);

    if (existingPlayer) {
      console.log(`Player with ID ${socket.id} already has a role: ${existingPlayer.role}`);
      socket.emit('playerConnected', { role: existingPlayer.role });
      return;
    }

    const role = assignRandomRole(socket);
    if (role) {
      console.log(`Assigned role ${role} to player with ID: ${socket.id}`);
      socket.emit('playerConnected', { role });

      connectedPlayerCount++;
      io.emit('connectedPlayerCount', connectedPlayerCount);
      console.log("A player joined the lobby:", connectedPlayerCount);
    } else {
      console.log("Lobby is full, notifying player:", socket.id);
      socket.emit('lobbyFull', { message: "The lobby is full. You will be redirected to the main menu shortly." });
    }

    console.log("Client joined lobby and received player status.");
  });

  socket.on('chatMessage', (msg) => {
    console.log('Received message:', msg);
    io.emit('chatMessage', msg);
  });

  socket.on('playerReady', ({ userId, username, profilePictureId }) => {
    const player = gameData.players.find(p => p.userId === userId);
    if (player) {
      player.ready = true;
      player.username = username;
      player.image_id = profilePictureId;
      
      console.log(`${player.role} is ready with username: ${username} and profile picture: ${profilePictureId}`, gameData.players);
      
      checkIfGameCanStart();
    }
  });

  socket.on("start-game", () => {
    if (!isGameStarted) {
      isGameStarted = true; // Prevent further calls to start the game
      resetGameAndScores(); // Initialize the game and reset scores
      console.log("Game started.");
    } else {
      console.log("Game already started, ignoring additional start-game calls.");
    }
    io.emit("gameState", gameData);
  });

  socket.on("requestGameState", () => {
    // Send the current game state to the requesting client
    socket.emit("gameState", gameData);
  });
  

  socket.on('move', ({ role, direction }) => {
    const player = gameData.players.find(p => p.role === role && p.userId === socket.id);
  
    if (!player || gameData.currentTurn !== role) {
      socket.emit('error', { message: `Invalid move: It's not ${role}'s turn or player is not recognized.` });
      return;
    }
  
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
  
    if (!blockType.startsWith('free') && !(blockType === 'tunnel' && role === 'thief')) {
      socket.emit('error', { message: `Invalid move: cannot move to a ${blockType} block.` });
      return;
    }
  
    logMove(role, direction);
  
    player.position = newPosition;
  
    if (role === 'farmer') {
      gameData.grid.farmerPosition = newPosition;
    
      if (newPosition.row === gameData.grid.thiefPosition.row && newPosition.col === gameData.grid.thiefPosition.col) {
        gameData.players[0].score++;
        console.log(`Farmer scored! New score: Farmer - ${gameData.players[0].score}, Thief - ${gameData.players[1].score}`);
        io.emit('gameState', gameData);
        io.emit('winner', { winner: 'farmer', scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });
    
        // Add delay before resetting and declaring farmer as winner
        setTimeout(() => {
          resetGameState('farmer', false, false);
        }, 1500);
    
        return;
      }
    } else if (role === 'thief') {
      gameData.grid.thiefPosition = newPosition;
    
      if (newPosition.row === gameData.grid.farmerPosition.row && newPosition.col === gameData.grid.farmerPosition.col) {
        gameData.players[0].score++;
        console.log(`Farmer scored! New score: Farmer - ${gameData.players[0].score}, Thief - ${gameData.players[1].score}`);
        io.emit('gameState', gameData);
        io.emit('winner', { winner: 'farmer', scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });
    
        setTimeout(() => {
          resetGameState('farmer', false, false);
        }, 1500);
    
        return;
      }
    
      if (blockType === 'tunnel') {
        gameData.players[1].score++;
        console.log(`Thief scored by reaching a tunnel! New score: Farmer - ${gameData.players[0].score}, Thief - ${gameData.players[1].score}`);
        io.emit('gameState', gameData);
        io.emit('winner', { winner: 'thief', scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });
        // Add delay before resetting and declaring thief as winner
        setTimeout(() => {
          resetGameState('thief', false, false);
        }, 1500);
    
        return;
      }
    }
  
    switchTurn();
  });

  socket.emit('game_update', gameData);

  socket.on('surrender', ({ role }, callback) => {
    // Find the winning and surrendering players by role
    const winningPlayer = gameData.players.find(player => player.role !== role);
    const surrenderingPlayer = gameData.players.find(player => player.role === role);
    
    // Check if players are defined before proceeding
    if (!winningPlayer || !surrenderingPlayer) {
        console.error("Error: Player not found for surrender event");
        return callback({ error: "Player not found" });
    }

    // Update scores
    winningPlayer.score += 1;

    // Send game-over message back to the clients
    const message = `${winningPlayer.role} wins due to ${surrenderingPlayer.role} surrendering!`;
    io.emit('surrender', { message, scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score } });

    // Acknowledge the surrender with updated scores
    callback({
        scores: { farmer: gameData.players[0].score, thief: gameData.players[1].score },
        winner: winningPlayer.role
    });

    if (sessionTimer) clearInterval(sessionTimer);
    if (turnTimer) clearInterval(turnTimer);
    sessionTimer = null;
    turnTimer = null;
    // Call stopGame() to end the game and perform any necessary cleanup
    setTimeout(() => {
      stopGame(); // Reset the game state fully after the delay
    }, 10000);
    
    
    
  });
  socket.on('resetFromSurrender', resetGameState);

  socket.on('resetGame', resetGameAndScores);

  socket.on('leaveLobby', () => {
    const leavingPlayer = gameData.players.find(p => p.userId === socket.id);

    if (leavingPlayer) {
      leavingPlayer.connected = false;
      leavingPlayer.userId = null;
      leavingPlayer.ready = false;
      console.log(`Player with role ${leavingPlayer.role} left the lobby: ${socket.id}`);

      if (connectedPlayerCount > 0) connectedPlayerCount--;
      io.emit('connectedPlayerCount', connectedPlayerCount);
      console.log(`Current number of players in lobby: ${connectedPlayerCount}`);
    }
  });
  socket.on('disconnect', () => {
    // Check if the connection is from the server page using the query parameter
    const isServerPage = socket.handshake.query.type === 'server';

    if (!isServerPage) {
        const disconnectedPlayer = gameData.players.find(p => p.userId === socket.id);

        if (disconnectedPlayer) {
            disconnectedPlayer.connected = false;
            disconnectedPlayer.userId = null;
            disconnectedPlayer.ready = false;
            console.log(`Player with role ${disconnectedPlayer.role} disconnected: ${socket.id}`);

            if (connectedPlayerCount > 0) connectedPlayerCount--;
            io.emit('connectedPlayerCount', connectedPlayerCount);
            console.log(`Current number of players in lobby after disconnection: ${connectedPlayerCount}`);

            stopGame();
        }

        totalConnectedClients = Math.max(totalConnectedClients - 1, 0);
        io.emit('totalConnectedClients', totalConnectedClients);
        console.log(`Total connected clients after disconnect: ${totalConnectedClients}`);
    } else {
        console.log(`Server page disconnected: ${socket.id}. Not affecting client count.`);
    }
});
  
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://127.0.0.1:${PORT}`, gameData));

const path = require('path');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create a namespace for the server interface
const adminNamespace = io.of('/admin');

adminNamespace.on('connection', (socket) => {
    console.log('Server interface connected:', socket.id);

    // Listen for total connected clients and send to the server interface
    socket.emit('totalConnectedClients', totalConnectedClients);

    // Update the interface when the client count changes
    io.on('totalConnectedClients', (count) => {
        adminNamespace.emit('totalConnectedClients', count);
    });

    // Listen for game reset requests from the interface
    socket.on('resetGame', () => {
        io.emit('resetGame'); // Emit to all clients to reset the game
        console.log('Reset game requested by server interface.');
    });

    socket.on('disconnect', () => {
        console.log('Server interface disconnected:', socket.id);
    });
});

