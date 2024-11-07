let { gameData, generateRandomGrid, getRandomFreeBlocks } = require('./gameData');

let turnTimer = null;
let sessionTimer = null;

function stopGame(io) {
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
    updateGameStatus(io);

    if (sessionTimer) clearInterval(sessionTimer);
    if (turnTimer) clearInterval(turnTimer);
    sessionTimer = null;
    turnTimer = null;
  
    console.log("Game stopped, clearing all gameData");
  
    io.emit('gameReset', gameData);
    io.emit('leftGame');
    console.log("left game called");
  
    connectedPlayerCount = 0;
    io.emit('connectedPlayerCount', connectedPlayerCount);
}

function resetGameState(io, winnerRole = 'thief', resetScores = false, resetTime = false) {
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
  
    if (gameData.gameStarted) startTimers(io);
}

function updateGameStatus(io) {
    io.emit('gameStatus', { gameStarted: gameData.gameStarted });
}

function startTimers(io) {
    sessionTimer = setInterval(() => {
      gameData.timeLeft -= 1;
      if (gameData.timeLeft <= 0) {
        endSession(io);
        gameData.timeLeft = 60;
      }
      io.emit('timerUpdate', { timeLeft: gameData.timeLeft, turnTimeLeft: gameData.turnTimeLeft });
    }, 1000);
  
    turnTimer = setInterval(() => {
      gameData.turnTimeLeft -= 1;
      if (gameData.turnTimeLeft <= 0) {
        switchTurn(io);
        gameData.turnTimeLeft = 10;
      }
      io.emit('timerUpdate', { timeLeft: gameData.timeLeft, turnTimeLeft: gameData.turnTimeLeft });
    }, 1000);
}

function switchTurn(io) {
    gameData.currentTurn = gameData.currentTurn === 'farmer' ? 'thief' : 'farmer';
    io.emit('gameState', gameData);
    gameData.turnTimeLeft = 10;
    console.log(`Turn switched to: ${gameData.currentTurn}`);
  }

function resetGameAndScores(io) {
    resetGameState(io, null, true, true);
}

function endSession(io) {
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
      stopGame(io); // Reset the game state fully after the delay
    }, 10000); // 10 seconds delay
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

function checkIfGameCanStart(io) {
    const allReady = gameData.players.every(player => player.connected && player.ready);
  
    console.log("Checking if game can start. Player statuses:");
    gameData.players.forEach(player => {
      console.log(`Role: ${player.role}, Connected: ${player.connected}, Ready: ${player.ready}`);
    });
  
    if (allReady) {
      gameData.gameStarted = true;
      updateGameStatus(io);
      io.emit('gameStarted');
      console.log("Both players are ready. Game is starting.");
      updateAllClientsWithPlayerStatus(io);
    } else {
      console.log("Not all players are ready. Waiting...");
    }
}

function logMove(io, playerRole, direction) {
    const logMessage = `${playerRole} moved ${direction}`;
    console.log("[Move Log]", logMessage);
    io.emit("moveLog", logMessage);
}

function updateAllClientsWithPlayerStatus(io) {
    io.emit('currentPlayerStatus', { players: gameData.players });
}

module.exports = {
  stopGame,
  resetGameState,
  updateGameStatus,
  startTimers,
  switchTurn,
  resetGameAndScores,
  endSession,
  assignRandomRole,
  checkIfGameCanStart,
  logMove,
  updateAllClientsWithPlayerStatus
};
