require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createTable() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS public.process (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES public.application(application_id) ON DELETE CASCADE,
        workflow_id INTEGER REFERENCES public.workflow(id) ON DELETE SET NULL,
        current_step VARCHAR(50),
        next_step VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('✅ Table "process" created successfully.');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        pool.end();
    }
}

createTable();
