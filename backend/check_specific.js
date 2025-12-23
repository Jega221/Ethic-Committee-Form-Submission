const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkWorkflow() {
    try {
        const procRes = await pool.query("SELECT p.*, a.title, a.status FROM process p JOIN application a ON p.application_id = a.application_id WHERE p.application_id IN (10, 2, 15)");
        console.log("Specific Application Processes:", JSON.stringify(procRes.rows, null, 2));

        const totalCount = await pool.query("SELECT current_step, COUNT(*) FROM process GROUP BY current_step");
        console.log("Counts per step:", JSON.stringify(totalCount.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkWorkflow();
