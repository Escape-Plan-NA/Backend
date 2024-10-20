function generateRandomGrid() {
    let blocks = Array(25).fill('free');
    for (let i = 0; i < 5; i++) {
      blocks[i] = 'obstacle';
    }
    blocks[5] = 'tunnel';
    return blocks.sort(() => Math.random() - 0.5).reduce((grid, block, idx) => {
      if (idx % 5 === 0) grid.push([]);
      grid[grid.length - 1].push(block);
      return grid;
    }, []);
  }
  
  function getRandomFreeBlocks(grid) {
    const freeBlocks = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((block, colIndex) => {
        if (block === 'free') {
          freeBlocks.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    return freeBlocks.sort(() => Math.random() - 0.5).slice(0, 2);
  }
  
  module.exports = { generateRandomGrid, getRandomFreeBlocks };
  