const pool = require('./db/index');
require('dotenv').config();

async function check() {
    try {
        const res = await pool.query('SELECT * FROM notifications WHERE user_id = 37');
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
