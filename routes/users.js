// userRoutes.js
const express = require('express');
const router = express.Router();
const { setUser, getUser } = require('../controllers/userController');


// Define the POST route for setting the player's name
router.post('/setUser', setUser);

// Define the GET route for getting the player's name
router.get('/getUser', getUser);

module.exports = router;
