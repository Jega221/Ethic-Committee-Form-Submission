
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log("Adding faculty_id column to users table...");
        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES faculties(id);
    `);
        console.log("Success: faculty_id column added (if it didn't exist).");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
