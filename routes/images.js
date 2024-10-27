const express = require('express');
const { getImage } = require('../controllers/imageController'); // Import controller
const router = express.Router();

// Define route for image fetching, dynamic based on query parameters
router.get('/image', getImage);

module.exports = router;


// API List
// Get the thief image for character1: /images/image?type=character&category=character1&role=thief
// Get the farmer image for character1: /images/image?type=character&category=character1&role=farmer
// Get all spring free tiles: /images/image?type=tile&category=free&season=spring
// Get a spring obstacle tile: /images/image?type=tile&category=obstacle&season=spring
// Get a spring tunnel tile: /images/image?type=tile&category=tunnel&season=spring
// Get the cutscene: /images/image?type=cutscene

