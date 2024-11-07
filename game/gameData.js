let gameData = {
    players: [
      { userId: null, username: '', image_id: '', role: 'farmer', position: { row: 1, col: 1 }, score: 0, connected: false, ready: false },
      { userId: null, username: '', image_id: '', role: 'thief', position: { row: 1, col: 1 }, score: 0, connected: false, ready: false }
    ],
    grid: {
      blocks: [],
      farmerPosition: { row: 1, col: 1 },
      thiefPosition: { row: 1, col: 1 }
    },
    currentTurn: 'thief',
    winner: null,
    timeLeft: 60,
    turnTimeLeft: 10,
    gameStarted: false
  };
  
  function generateRandomGrid() {
    let blocks = Array(25).fill('free');
    for (let i = 0; i < 5; i++) blocks[i] = 'obstacle';
    blocks[5] = 'tunnel';
    blocks = blocks.sort(() => Math.random() - 0.5);
    blocks = blocks.map(block => (block === 'free' ? `free${Math.floor(Math.random() * 3) + 1}` : block));
  
    const grid = [];
    for (let i = 0; i < 5; i++) {
      grid.push(blocks.slice(i * 5, i * 5 + 5));
    }
    return grid;
  }
  
  function getRandomFreeBlocks(grid) {
    const freeBlocks = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((block, colIndex) => {
        if (block.startsWith('free')) {
          freeBlocks.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    return freeBlocks.sort(() => Math.random() - 0.5).slice(0, 2);
  }
  
  module.exports = { gameData, generateRandomGrid, getRandomFreeBlocks };
  