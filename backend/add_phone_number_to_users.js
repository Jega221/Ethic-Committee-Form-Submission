require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log("Adding phone_number column to users table...");
        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
    `);
        console.log("Success: phone_number column added (if it didn't exist).");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
