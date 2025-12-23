const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function fixWorkflow() {
    try {
        await pool.query('BEGIN');

        // 1. Update the current workflow to include 'rectorate'
        const wfRes = await pool.query(
            "UPDATE workflow SET fourth_step = 'rectorate' WHERE status = 'current' RETURNING *"
        );
        console.log("Updated Workflow:", JSON.stringify(wfRes.rows, null, 2));

        // 2. Find applications that might have accidentally gone to 'done' from 'committee'
        // Actually, any application that is 'done' but was recently 'committee' should be moved to 'rectorate'
        // For now, let's just check if there are any 'done' ones.
        const doneRes = await pool.query("SELECT * FROM process WHERE current_step = 'done'");
        console.log("Applications at 'done' step:", JSON.stringify(doneRes.rows, null, 2));

        // If there are any, we might want to move them.
        // However, we should be careful. 
        // If application id 15 (id 8 in process) is at committee, its next_step should now be 'rectorate'
        const updateNextRes = await pool.query(
            "UPDATE process SET next_step = 'rectorate' WHERE current_step = 'committee' AND workflow_id = (SELECT id FROM workflow WHERE status = 'current') RETURNING *"
        );
        console.log("Updated next_step for committee apps:", JSON.stringify(updateNextRes.rows, null, 2));

        await pool.query('COMMIT');
        console.log("Fix applied successfully.");
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Fix failed:", err);
    } finally {
        await pool.end();
    }
}

fixWorkflow();
