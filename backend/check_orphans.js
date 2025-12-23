const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkOrphans() {
    try {
        const res = await pool.query(`
      SELECT a.application_id, a.title, a.status, p.current_step, p.id as process_id
      FROM application a
      LEFT JOIN process p ON a.application_id = p.application_id
      ORDER BY a.application_id DESC
    `);
        console.log("All Applications with Process Info:");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkOrphans();
