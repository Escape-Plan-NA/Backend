const axios = require('axios');

const IMAGE_URLS = {
  characters: {
    character1: {
      thief: 'https://drive.google.com/uc?export=view&id=1hQ9axnXQQo1CqSar2oedGwx2angwZDhS',
      farmer: 'https://drive.google.com/uc?export=view&id=1n6J8t-9tEMnPgNCsRiL79zgCOslu-G-P'
    },
    character2: {
      thief: 'URL_FOR_CHARACTER2_THIEF', // Add appropriate link here
      farmer: 'URL_FOR_CHARACTER2_FARMER' // Add appropriate link here
    }
    // Add more characters as needed
  },
  mapTiles: {
    spring: {
      free1: 'https://drive.google.com/uc?export=view&id=1oBIKQX7QKKSusPa6tmi1eeg4TD5z8wPA',
      free2: 'https://drive.google.com/uc?export=view&id=19KvF4BINaJBJg_IiExs3bEl64i8GOXdc',
      free3: 'https://drive.google.com/uc?export=view&id=1u3jnwo5vaCMtjXzCLDxlqRStg_C7mZ0e',
      obstacle: 'https://drive.google.com/uc?export=view&id=1c0q2cMk4IA7g2tVW8PcQXOQqdi6KckW1',
      tunnel: 'https://drive.google.com/uc?export=view&id=1vuCkIJ3WlV_MvbTNPflJ7dFCwlerSXEd',
      background: 'https://drive.google.com/uc?export=view&id=1vl-Ne5yqW9Y_kErwgaS2WNcWr4Y_o3oz',
      tree: 'https://drive.google.com/uc?export=view&id=1yjB8Ra9jOWrS9gBt2MNPl5jylmPkoOtW'
    },
    summer: {
      free1: 'https://drive.google.com/uc?export=view&id=1xV3KESH4XERYJ8HDmkENOzifOA5mxDG1',
      free2: 'https://drive.google.com/uc?export=view&id=1TZXN8a8m38RIh9pgN630VXRx2HvrU8rr',
      free3: 'https://drive.google.com/uc?export=view&id=1vuCkIJ3WlV_MvbTNPflJ7dFCwlerSXEd',
      obstacle: 'https://drive.google.com/uc?export=view&id=1TZXN8a8m38RIh9pgN630VXRx2HvrU8rr',
      tunnel: 'https://drive.google.com/uc?export=view&id=1vuCkIJ3WlV_MvbTNPflJ7dFCwlerSXEd'
    }
  },
  cutscene: 'https://drive.google.com/uc?export=view&id=1eQj036N8z-maFdMNJbQvLqoeIgj80T5s'
};

async function getImage(req, res) {
  const { type, category, role, season } = req.query;

  switch (type) {
    case 'character':
      if (category && role && IMAGE_URLS.characters[category] && IMAGE_URLS.characters[category][role]) {
        return res.redirect(IMAGE_URLS.characters[category][role]);
      }
      break;
    case 'tile':
      if (season && category === 'free1') {
        return res.redirect(IMAGE_URLS.mapTiles[season].free1);
      } else if (season && category === 'free2') {
        return res.redirect(IMAGE_URLS.mapTiles[season].free2);
      } else if (season && category === 'free3') {
        return res.redirect(IMAGE_URLS.mapTiles[season].free3);
      } else if (season && category === 'obstacle') {
        return res.redirect(IMAGE_URLS.mapTiles[season].obstacle);
      } else if (season && category === 'tunnel') {
        return res.redirect(IMAGE_URLS.mapTiles[season].tunnel);
      } else if (season && category === 'background') {
        return res.redirect(IMAGE_URLS.mapTiles[season].background);
      } else if (season && category === 'tree') {
        return res.redirect(IMAGE_URLS.mapTiles[season].tree);
      }
      break;
    case 'cutscene':
      return res.redirect(IMAGE_URLS.cutscene);
    default:
      return res.status(400).send('Invalid request type or category');
  }
}

module.exports = { getImage };

