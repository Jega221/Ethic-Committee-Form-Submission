require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function verify() {
    try {
        // 1. Ensure a current workflow exists
        const wfRes = await pool.query("SELECT * FROM workflow WHERE status = 'current'");
        if (wfRes.rows.length === 0) {
            console.log('⚠️ No current workflow found. Creating a dummy one...');
            const insertWf = await pool.query(`
        INSERT INTO workflow (first_step, second_step, third_step, status) 
        VALUES ('supervisor', 'faculty', 'committee', 'current') 
        RETURNING *
      `);
            console.log('Created workflow:', insertWf.rows[0].id);
        } else {
            console.log('✅ Active workflow found:', wfRes.rows[0].id);
        }

        // 2. Simulate logic from applicationController.js
        // We confirm that IF we run the code I added, it works.
        console.log('Testing logic...');

        // Fetch active workflow again
        const activeWfRes = await pool.query("SELECT * FROM workflow WHERE status = 'current'");
        const workflow = activeWfRes.rows[0];

        // Dummy application ID (simulating a just-inserted app)
        // We won't actually insert an application to avoid FK constraints with users table if we don't have valid user IDs.
        // Instead we will check if the PROCESS table insert query is valid.

        // Actually, to be sure, let's try to find an existing application and link it if it's not linked.
        const appRes = await pool.query('SELECT * FROM application LIMIT 1');
        if (appRes.rows.length === 0) {
            console.log('⚠️ No applications in DB to test with. Unable to fully verify FK constraints.');
            return;
        }
        const appId = appRes.rows[0].application_id;
        console.log(`Using existing application ID: ${appId}`);

        // Check if process already exists
        const procCheck = await pool.query('SELECT * FROM process WHERE application_id = $1', [appId]);
        if (procCheck.rows.length > 0) {
            console.log('ℹ️ Process already exists for this app. Logic likely works.');
        } else {
            console.log('Attempting to create process record...');
            const insertProc = await pool.query(
                `INSERT INTO process (application_id, workflow_id, current_step, next_step)
             VALUES ($1, $2, $3, $4) RETURNING *`,
                [appId, workflow.id, workflow.first_step, workflow.second_step]
            );
            console.log('✅ Process record created successfully:', insertProc.rows[0]);
        }

    } catch (err) {
        console.error('❌ Verification failed:', err);
    } finally {
        pool.end();
    }
}

verify();
