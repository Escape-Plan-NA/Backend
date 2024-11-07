const express = require('express');
const router = express.Router();
const { gameData } = require('../game/gameData');

router.get('/api/get-role/:socketID', (req, res) => {
    const { socketID } = req.params;

    const player = gameData.players.find(player => player.userId === socketID);
  
    if (player && player.role) {
      res.json({ role: player.role });
    } else {
      res.status(404).json({ error: "Role not found for this socketID." });
    }
});

router.get('/api/gameData', (req, res) => {
    const playerData = gameData.players.map(player => ({
        userId: player.userId,
        username: player.username,
        role: player.role,
        image_id: player.image_id
      }));
      
    res.json({ players: playerData });
});

router.get('/api/final-scores', (req, res) => {
    res.json({
        scores: {
            farmer: gameData.players[0].score,
            thief: gameData.players[1].score,
        }
    });
});

module.exports = router;
