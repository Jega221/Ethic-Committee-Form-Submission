const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function advanceApps() {
    try {
        await pool.query('BEGIN');

        // 1. Move Application 15 to rectorate
        const res15 = await pool.query(
            "UPDATE process SET current_step = 'rectorate', next_step = 'done', updated_at = NOW() WHERE application_id = 15 RETURNING *"
        );
        console.log("Moved App 15 to rectorate:", JSON.stringify(res15.rows, null, 2));

        // 2. Also move App 10 and 2 if they are 'Approved' but stuck
        const res10 = await pool.query(
            "UPDATE process SET current_step = 'rectorate', next_step = 'done', updated_at = NOW() WHERE application_id = 10 RETURNING *"
        );
        console.log("Moved App 10 to rectorate:", JSON.stringify(res10.rows, null, 2));

        const res2 = await pool.query(
            "UPDATE process SET current_step = 'rectorate', next_step = 'done', updated_at = NOW() WHERE application_id = 2 RETURNING *"
        );
        console.log("Moved App 2 to rectorate:", JSON.stringify(res2.rows, null, 2));

        await pool.query('COMMIT');
        console.log("Advancement completed.");
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Advancement failed:", err);
    } finally {
        await pool.end();
    }
}

advanceApps();
