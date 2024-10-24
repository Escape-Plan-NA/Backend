// Helper function to generate a random user ID
const generateUserId = () => {
  // Generate two random uppercase letters (A-Z)
  const letters = String.fromCharCode(Math.floor(Math.random() * 26) + 65) +
                  String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  // Generate six random digits (0-9)
  const numbers = Math.floor(100000 + Math.random() * 900000); // Ensure it's 6 digits
  return `${letters}${numbers}`;
};

// Global variable to store the player's information
let user = { name: 'Guest', profilePicture: 'src/assets/placeholderProfile.jpg', userId: '' };

// Controller to set player name and profile picture
const setUser = (req, res) => {
  const { name, profilePicture } = req.body; // Destructure the user object

  // Generate a unique user ID
  const userId = generateUserId();

  // Store player name, profile picture, and userId
  user = {
    name: name || "Guest",  // Default to 'Guest' if no name is provided
    profilePicture: profilePicture || 'src/assets/placeholderProfile.jpg',
    userId: userId
  };

  console.log('Received user data:', user);
  res.status(200).json({ message: 'User data received successfully!', user });
};

// Controller to get player name, profile picture, and user ID
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
    user = { name: 'Guest', profilePicture: 'src/assets/placeholderProfile.jpg', userId: '' };
    console.log('All users removed');
    return res.status(200).send('All user data reset');
  }
};

module.exports = {
  setUser,
  getUser,
  removeUser
};
