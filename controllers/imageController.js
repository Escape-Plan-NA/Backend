const axios = require('axios');
const THIEF_IMAGE_URL = 'https://drive.google.com/uc?export=view&id=1hQ9axnXQQo1CqSar2oedGwx2angwZDhS';

async function getThiefImage(req, res) {
  try {
    const response = await axios.get(THIEF_IMAGE_URL, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Error fetching image');
  }
}

module.exports = { getThiefImage };
