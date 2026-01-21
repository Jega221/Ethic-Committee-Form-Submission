const pool = require('./db/index');
require('dotenv').config();

async function check() {
    try {
        const res = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1');
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
