
require('dotenv').config();
const mysql = require('mysql2/promise');

// Async function to connect to the database
async function connectToDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,  // Include the custom port
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  return connection;
}

module.exports = { connectToDatabase };



