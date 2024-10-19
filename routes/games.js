const express = require('express');
const {
    getGameState,
    startGame,
    switchTurn,
    movePlayer,
    updateScore,
    resetGameAndScores
} = require('../controllers/gameController');  // Ensure the functions are correctly imported

const router = express.Router();

router.get('/game-state', getGameState);
router.post('/start', startGame);  // Ensure startGame is defined and imported correctly
router.put('/switch-turn', switchTurn);
router.put('/move', movePlayer);
router.put('/update-score', updateScore);
router.post('/reset-game', resetGameAndScores);

module.exports = router;
