/*backend/db/index.js
require("dotenv").config();

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;*/
//backend/db/index.js

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Add error handler to prevent crashing on idle client errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Do not exit process, just log it
});

module.exports = pool;

