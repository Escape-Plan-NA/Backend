function generateRandomGrid() {
  let blocks = Array(25).fill('free');
  for (let i = 0; i < 5; i++) {
    blocks[i] = 'obstacle';
  }
  blocks[5] = 'tunnel';

  // Shuffle the blocks
  blocks = blocks.sort(() => Math.random() - 0.5);

  // Assign 'free1', 'free2', 'free3' to each 'free' block
  blocks = blocks.map(block => {
    if (block === 'free') {
      const type = Math.floor(Math.random() * 3) + 1;
      return `free${type}`;
    }
    return block;
  });

  // Convert the blocks array into a 5x5 grid
  return blocks.reduce((grid, block, idx) => {
    if (idx % 5 === 0) grid.push([]);
    grid[grid.length - 1].push(block);
    return grid;
  }, []);
}

function getRandomFreeBlocks(grid) {
  const freeBlocks = [];
  grid.forEach((row, rowIndex) => {
    row.forEach((block, colIndex) => {
      if (block.startsWith('free')) {
        freeBlocks.push({ row: rowIndex, col: colIndex, type: block });
      }
    });
  });
  return freeBlocks.sort(() => Math.random() - 0.5).slice(0, 2);
}

module.exports = { generateRandomGrid, getRandomFreeBlocks };
