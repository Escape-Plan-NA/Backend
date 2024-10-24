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
      free: [
        'https://drive.google.com/uc?export=view&id=1wwgFYHrjkUICOaAPlBFmtQkeBQGuBhax',
        'https://drive.google.com/uc?export=view&id=19U-i-OdPcZxjYMbex4tX9VFpM3O1TP9l'
      ],
      obstacle: 'https://drive.google.com/uc?export=view&id=1NCMFJsssJkhn4gZAw05n6YpoqSWTKWvQ',
      tunnel: 'https://drive.google.com/uc?export=view&id=1vuCkIJ3WlV_MvbTNPflJ7dFCwlerSXEd'
    },
    summer: {
      free: [
        'https://drive.google.com/uc?export=view&id=1KfS-iZiYiJrPeXk96KnPHEo9LFFgP76a',
        'https://drive.google.com/uc?export=view&id=1xV3KESH4XERYJ8HDmkENOzifOA5mxDG1'
      ],
      obstacle: 'https://drive.google.com/uc?export=view&id=1TZXN8a8m38RIh9pgN630VXRx2HvrU8rr',
      tunnel: 'https://drive.google.com/uc?export=view&id=1vuCkIJ3WlV_MvbTNPflJ7dFCwlerSXEd'
    }
  },
  cutscene: 'https://drive.google.com/uc?export=view&id=1eQj036N8z-maFdMNJbQvLqoeIgj80T5s'
};

// Helper function to get multiple random free tiles
const getRandomFreeTiles = (season, count) => {
  const freeTiles = IMAGE_URLS.mapTiles[season].free;
  let result = [];
  for (let i = 0; i < count; i++) {
    const randomTile = freeTiles[Math.floor(Math.random() * freeTiles.length)];
    result.push(randomTile);
  }
  return result;
};

async function getImage(req, res) {
  const { type, category, role, season, count } = req.query;

  switch (type) {
    case 'character':
      if (category && role && IMAGE_URLS.characters[category] && IMAGE_URLS.characters[category][role]) {
        return res.redirect(IMAGE_URLS.characters[category][role]);
      }
      break;
    case 'tile':
      if (season && category === 'free' && count) {
        const freeTiles = getRandomFreeTiles(season, parseInt(count, 10));
        return res.json(freeTiles);
      } else if (season && category === 'obstacle') {
        return res.redirect(IMAGE_URLS.mapTiles[season].obstacle);
      } else if (season && category === 'tunnel') {
        return res.redirect(IMAGE_URLS.mapTiles[season].tunnel);
      }
      break;
    case 'cutscene':
      return res.redirect(IMAGE_URLS.cutscene);
    default:
      return res.status(400).send('Invalid request type or category');
  }
}

module.exports = { getImage };