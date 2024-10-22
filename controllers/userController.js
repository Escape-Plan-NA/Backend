// userController.js

// Global variable to store the player's name
let playerName = '';

// Controller to set player name
const setUser = (req, res) => {
  playerName = req.body.name;  // Store playerName globally
  if (!playerName) {
    return res.status(400).json({ message: 'Player name is required' });
  }
  console.log('Received name:', playerName);
  res.status(200).json({ message: 'Name received successfully!', playerName });
};

// Controller to get player name
const getUser = (req, res) => {
  if (playerName) {
    res.status(200).json({ name: playerName });  // Send the current playerName
  } else {
    res.status(404).json({ message: 'Player name not found' });  // Handle case where playerName isn't set
  }
};

module.exports = {
  setUser,
  getUser
};
