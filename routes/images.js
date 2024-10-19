const express = require('express');
const { getThiefImage } = require('../controllers/imageController');
const router = express.Router();

router.get('/image', getThiefImage);

module.exports = router;
