const pool = require('./db/index');
require('dotenv').config();

async function debug() {
    try {
        // Get last notification
        const notifRes = await pool.query(`
      SELECT n.*, u.email as user_email 
      FROM notifications n 
      JOIN users u ON n.user_id = u.id 
      ORDER BY n.created_at DESC LIMIT 1
    `);

        if (notifRes.rows.length === 0) {
            console.log("No notifications found.");
            return;
        }

        const notif = notifRes.rows[0];
        console.log("Last Notification:", notif);

        if (notif.application_id) {
            // Get application details
            const appRes = await pool.query(`
        SELECT a.application_id, a.title, a.researcher_id, u.email as researcher_email, u.name as researcher_name
        FROM application a 
        JOIN users u ON a.researcher_id = u.id
        WHERE a.application_id = $1
      `, [notif.application_id]);

            console.log("Application Details:", appRes.rows[0]);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

debug();
