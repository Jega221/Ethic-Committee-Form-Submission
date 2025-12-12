require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        const appRes = await pool.query('SELECT * FROM application WHERE application_id = 123'); // correct table and column name
        console.log('Application 123:', appRes.rows.length > 0 ? 'Found' : 'Not Found');

        const wfRes = await pool.query("SELECT * FROM workflow WHERE status = 'current'");
        console.log('Current Workflow:', wfRes.rows.length > 0 ? 'Found' : 'Not Found');
        if (wfRes.rows.length > 0) console.log('Workflow ID:', wfRes.rows[0].id);

        if (appRes.rows.length > 0) {
            const procRes = await pool.query('SELECT * FROM process WHERE application_id = 123');
            console.log('Process for 123:', procRes.rows.length > 0 ? 'Found' : 'Not Found');
        } else {
            const anyApp = await pool.query('SELECT application_id FROM application LIMIT 1');
            if (anyApp.rows.length > 0) {
                console.log('Suggestion: Use Application ID:', anyApp.rows[0].application_id);
            } else {
                console.log('No applications in DB. You need to create one first.');
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
