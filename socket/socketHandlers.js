const { 
    stopGame,
    resetGameState,
    updateGameStatus,
    startTimers,
    switchTurn,
    resetGameAndScores,
    endSession,
    assignRandomRole,
    checkIfGameCanStart,
    logMove
  } = require('../game/gameLogic');

  const { gameData, generateRandomGrid, getRandomFreeBlocks } = require('../game/gameData');

let totalConnectedClients = 0;
let connectedPlayerCount = 0;
let isGameStarted = false;

function socketHandlers(io) {
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
            
            checkIfGameCanStart(io);
          }
        });

        socket.on("clearLobby", () => {
            connectedPlayerCount = 0;
            console.log("update connectedPlayerCount after game ends: ", connectedPlayerCount);
            isGameStarted = false;
            io.emit('connectedPlayerCount', connectedPlayerCount);
        });
      
        socket.on("start-game", () => {
          if (!isGameStarted) {
            isGameStarted = true; // Prevent further calls to start the game
            resetGameAndScores(io); // Initialize the game and reset scores
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
              logMove(io, role, "invalid move");
              return;
          }
        
          if (
            newPosition.row < 0 ||
            newPosition.row >= gameData.grid.blocks.length ||
            newPosition.col < 0 ||
            newPosition.col >= gameData.grid.blocks[0].length
          ) {
            logMove(io, role, "invalid move");
            socket.emit('error', { message: "Invalid move: position out of bounds." });
            return;
          }
        
          const blockType = gameData.grid.blocks[newPosition.row][newPosition.col];
        
          if (!blockType.startsWith('free') && !(blockType === 'tunnel' && role === 'thief')) {
            socket.emit('error', { message: `Invalid move: cannot move to a ${blockType} block.` });
            return;
          }
        
          logMove(io, role, direction);
        
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
                resetGameState(io,'farmer', false, false);
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
                resetGameState(io,'farmer', false, false);
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
                resetGameState(io, 'thief', false, false);
              }, 1500);
          
              return;
            }
          }
        
          switchTurn(io);
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
          // Call stopGame() to end the game and perform any necessary cleanup
          setTimeout(() => {
            stopGame(io); // Reset the game state fully after the delay
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
      
                  stopGame(io);
              }
      
              totalConnectedClients = Math.max(totalConnectedClients - 1, 0);
              io.emit('totalConnectedClients', totalConnectedClients);
              console.log(`Total connected clients after disconnect: ${totalConnectedClients}`);
          } else {
              console.log(`Server page disconnected: ${socket.id}. Not affecting client count.`);
          }
      });
        
      });
}

module.exports = socketHandlers;
