const express = require('express');
const { connectToDatabase } = require('../db');  // Adjust path as needed

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const [users] = await connection.execute('SELECT * FROM scores');
    connection.end();
    res.json(users);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).send('Database query failed');
  }
});

module.exports = router;
