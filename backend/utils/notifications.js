// backend/utils/notifications.js
const pool = require('../db/index');

/**
 * Creates a notification record in the database.
 * Called automatically by the cron job when an application is pending >48hrs.
 */
async function createNotification(userId, applicationId, message) {
  try {
    // Ensure notifications table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        application_id INT REFERENCES application(application_id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert new notification
    const result = await pool.query(
      `INSERT INTO notifications (user_id, application_id, message)
       VALUES ($1, $2, $3) RETURNING *;`,
      [userId, applicationId, message]
    );

    console.log(`🔔 Notification created for researcher ${userId}`);
    return result.rows[0];
  } catch (err) {
    console.error("❌ Failed to create notification:", err.message);
    throw err;
  }
}

module.exports = { createNotification };
