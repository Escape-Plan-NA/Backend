// Global variable to store the player's information
let user = { name: '', profilePicture: '' };

// Controller to set player name and profile picture
const setUser = (req, res) => {
  const { name, profilePicture } = req.body; // Destructure the user object
  if (!name || !profilePicture) {
    return res.status(400).json({ message: 'Player name and profile picture are required' });
  }
  user.name = name; // Store player name
  user.profilePicture = profilePicture; // Store profile picture
  console.log('Received user data:', user);
  res.status(200).json({ message: 'User data received successfully!', user });
};

// Controller to get player name and profile picture
const getUser = (req, res) => {
  if (user.name) {
    res.status(200).json({ user }); // Send the current user object
  } else {
    res.status(404).json({ message: 'User data not found' }); // Handle case where user data isn't set
  }
};

module.exports = {
  setUser,
  getUser
};
