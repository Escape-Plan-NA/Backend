const express = require('express');
const {
    getGameState,
    startGame,
    switchTurn,
    movePlayer,
    updateUserId,
    updateScore,
    surrenderGame,
    getGameData,
    resetGameAndScores
} = require('../controllers/gameController');  // Ensure the functions are correctly imported

const router = express.Router();

router.get('/game-state', getGameState);
router.post('/start', startGame);  // Ensure startGame is defined and imported correctly
router.put('/switch-turn', switchTurn);
router.put('/update-user', updateUserId); // Update
router.put('/move', movePlayer);
router.put('/update-score', updateScore);
router.put('/surrender', surrenderGame); //surrender button
router.get('/data', getGameData);
router.post('/reset-game', resetGameAndScores);
 
module.exports = router;
