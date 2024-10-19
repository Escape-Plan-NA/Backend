const { generateRandomGrid, getRandomFreeBlocks } = require('../utils/gridUtils');

// Initial game state
let gameData = {
    players: [
        { id: 1001, role: 'farmer', position: { row: 1, col: 1 }, score: 0 },
        { id: 1002, role: 'thief', position: { row: 1, col: 1 }, score: 0 }
    ],
    grid: {
        blocks: [],
        farmerPosition: { row: 1, col: 1 },
        thiefPosition: { row: 1, col: 1 }
    },
    currentTurn: 'thief',  // Start with the thief's turn
    winner: null
};

// Utility function to reset the game and scores
function resetGameAndScores() {
    gameData.grid.blocks = generateRandomGrid();  // Generate a new grid
    const [farmerPos, thiefPos] = getRandomFreeBlocks(gameData.grid.blocks);

    // Reset player positions
    gameData.grid.farmerPosition = farmerPos;
    gameData.grid.thiefPosition = thiefPos;
    gameData.players[0].position = farmerPos;
    gameData.players[1].position = thiefPos;

    // Reset player scores
    gameData.players[0].score = 0;  // Farmer score
    gameData.players[1].score = 0;  // Thief score

    // Reset turn and winner
    gameData.currentTurn = 'thief';  // Start with the thief
    gameData.winner = null;

    console.log('Game and scores have been reset');
}

// Utility function to reset the game (without resetting the scores)
function resetGame(winnerRole) {
    gameData.grid.blocks = generateRandomGrid();  // Generate a new grid
    const [farmerPos, thiefPos] = getRandomFreeBlocks(gameData.grid.blocks);

    // Reset player positions
    gameData.grid.farmerPosition = farmerPos;
    gameData.grid.thiefPosition = thiefPos;
    gameData.players[0].position = farmerPos;
    gameData.players[1].position = thiefPos;

    // Set the winner to start the next game
    if (winnerRole === 'farmer' || winnerRole === 'thief') {
        gameData.currentTurn = winnerRole;  // Set the winner as the starting player
        console.log(`Game reset, ${winnerRole} will start the next game.`);
    } else {
        gameData.currentTurn = 'thief';  // Default to thief for the first game
        console.log(`Game reset, thief will start the first game.`);
    }

    gameData.winner = null;
}

// Function to handle player movement and check for a winner
function handlePlayerMove(role, newPosition) {
    const { row, col } = newPosition;

    // Validate move within grid bounds
    if (row < 0 || row >= gameData.grid.blocks.length || col < 0 || col >= gameData.grid.blocks[0].length) {
        console.log('Invalid move: out of bounds');
        return false;
    }

    const blockType = gameData.grid.blocks[row][col];
    if (blockType !== 'free' && !(blockType === 'tunnel' && role === 'thief')) {
        console.log(`Invalid move: cannot move to a ${blockType} block`);
        return false;
    }

    if (role === 'farmer') {
        gameData.grid.farmerPosition = newPosition;
        gameData.players[0].position = newPosition;

        // Check if the farmer catches the thief
        if (newPosition.row === gameData.grid.thiefPosition.row && newPosition.col === gameData.grid.thiefPosition.col) {
            console.log('Farmer catches the thief! Farmer wins!');
            resetGame('farmer');  // Farmer wins, reset the game
            return true;
        }
    } else if (role === 'thief') {
        gameData.grid.thiefPosition = newPosition;
        gameData.players[1].position = newPosition;

        // Check if the thief reaches the tunnel
        if (blockType === 'tunnel') {
            console.log('Thief reaches the tunnel! Thief wins!');
            resetGame('thief');  // Thief wins, reset the game
            return true;
        }
    }

    // Switch turns if no one wins
    gameData.currentTurn = gameData.currentTurn === 'farmer' ? 'thief' : 'farmer';
    return true;
}

// Controller methods

// Get the current game state
function getGameState(req, res) {
    res.json(gameData);
}

// Function to start the game
function startGame(req, res) {
    if (!gameData.currentTurn) {
        resetGame();  // Initialize the game state if it hasn't started
        console.log('Game started.');
    } else {
        console.log(`Game already started with ${gameData.currentTurn} taking the turn.`);
    }

    const io = req.app.get('io');  // Retrieve io from the app

    // Check if `io` is undefined
    if (!io) {
        return res.status(500).json({ message: 'Socket.io is not initialized.' });
    }

    io.emit('update_state', gameData);  // Broadcast the updated game state

    res.json({
        message: 'Game started',
        gameData
    });
}


// Switch turn between farmer and thief
function switchTurn(req, res) {
    gameData.currentTurn = gameData.currentTurn === 'farmer' ? 'thief' : 'farmer';
    console.log('Turn switched to:', gameData.currentTurn);

    const io = req.app.get('io');
    io.emit('update_state', gameData);  // Broadcast updated state

    res.json({
        message: 'Turn switched',
        currentTurn: gameData.currentTurn,
        players: gameData.players
    });
}

// Move a player and update game state
function movePlayer(req, res) {
    const { role, newPosition } = req.body;

    // Ensure it's the player's turn
    if (gameData.currentTurn !== role) {
        return res.status(400).json({ message: `Invalid move: It's not ${role}'s turn.` });
    }

    // Process the move
    const validMove = handlePlayerMove(role, newPosition);
    if (!validMove) {
        return res.status(400).json({ message: 'Invalid move' });
    }

    res.json({
        message: 'Move processed',
        grid: gameData.grid,
        currentTurn: gameData.currentTurn,
        players: gameData.players
    });
}

// Update the score based on the winner
function updateScore(req, res) {
    const { winner } = req.body;

    console.log(`Received API call to update score for: ${winner}`);

    // Update score for the winning player
    if (winner === 'farmer') {
        gameData.players[0].score += 1;  // Increment farmer's score
    } else if (winner === 'thief') {
        gameData.players[1].score += 1;  // Increment thief's score
    } else {
        return res.status(400).json({ message: 'Invalid winner specified.' });
    }

    console.log('Scores after update:', `Farmer: ${gameData.players[0].score}, Thief: ${gameData.players[1].score}`);

    // Reset the game, with the winner starting the next game
    resetGame(winner);

    const io = req.app.get('io');
    io.emit('update_state', gameData);  // Broadcast updated state

    res.json({
        message: 'Score updated',
        farmerScore: gameData.players[0].score,
        thiefScore: gameData.players[1].score
    });
}

// Controller for resetting the game and scores
function resetGameAndScoresController(req, res) {
    resetGameAndScores();  // Reset the game and scores

    const io = req.app.get('io');  // Access Socket.IO from the Express app

    if (!io) {
        return res.status(500).json({ message: 'Socket.io is not initialized.' });
    }

    io.emit('update_state', gameData);  // Broadcast the updated game state via Socket.IO

    res.json({
        message: 'Game and scores reset',
        gameData
    });
}


// Export the controller methods
module.exports = {
    getGameState,
    startGame,
    switchTurn,
    movePlayer,
    updateScore,
    resetGameAndScores: resetGameAndScoresController
};
