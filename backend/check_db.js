const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkWorkflow() {
    try {
        const wfRes = await pool.query("SELECT * FROM workflow WHERE status = 'current'");
        console.log("Current Workflow:", JSON.stringify(wfRes.rows, null, 2));

        const procRes = await pool.query("SELECT p.*, a.title FROM process p JOIN application a ON p.application_id = a.application_id");
        console.log("All Processes:", JSON.stringify(procRes.rows, null, 2));

        const enumRes = await pool.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'workflow_step'");
        console.log("Allowed Workflow Step Enum Values:", JSON.stringify(enumRes.rows.map(r => r.enumlabel), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkWorkflow();
