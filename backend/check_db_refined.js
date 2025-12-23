const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkWorkflow() {
    try {
        const procRes = await pool.query("SELECT p.*, a.title, a.status FROM process p JOIN application a ON p.application_id = a.application_id WHERE p.current_step IN ('rectorate', 'done', 'committee')");
        console.log("Relevant Processes:", JSON.stringify(procRes.rows, null, 2));

        const allApps = await pool.query("SELECT application_id, title, status FROM application");
        console.log("All Applications Status:", JSON.stringify(allApps.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkWorkflow();
