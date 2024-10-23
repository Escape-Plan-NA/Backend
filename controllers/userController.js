// Global variable to store the player's information
let user = { name: 'Guest', profilePicture: 'src/assets/placeholderProfile.jpg' };

// Controller to set player name and profile picture
const setUser = (req, res) => {
  const { name, profilePicture } = req.body; // Destructure the user object

  // Ensure player name is mandatory
  if (!name) {
    return res.status(400).json({ message: 'Player name is required' });
  }

  // Store player name
  user.name = name;

  // If profile picture is not provided, use the default one
  user.profilePicture = profilePicture || 'src/assets/placeholderProfile.jpg';

  console.log('Received user data:', user);
  res.status(200).json({ message: 'User data received successfully!', user });
};

// Controller to get player name and profile picture
const getUser = (req, res) => {
  if (user && user.name) {
    res.status(200).json({ user }); // Send the current user object
  } else {
    res.status(404).json({ message: 'User data not found' }); // Handle case where user data isn't set
  }
};

// Route to remove user data
const removeUser = (req, res) => {
  const { name } = req.body; // User's name sent from the client (optional)

  if (!name) {
    // If no name is provided, reset the user object to default values
    user = { name: 'Guest', profilePicture: 'src/assets/placeholderProfile.jpg' };
    console.log('All users removed');
    return res.status(200).send('All user data reset');
  }
};

module.exports = {
  setUser,
  getUser,
  removeUser
};
