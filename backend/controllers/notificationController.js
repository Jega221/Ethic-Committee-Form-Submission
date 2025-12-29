// backend/controllers/notificationController.js
const pool = require('../db/index');

// Get all notifications for a user
async function getUserNotifications(req, res) {
  const { user_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

// Mark a notification as read
async function markAsRead(req, res) {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
      [id]
    );
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification:", err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
}

// Create a new notification
async function createNotification(user_id, application_id, message) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, application_id, message)
       VALUES ($1, $2, $3)`,
      [user_id, application_id, message]
    );
    console.log(`🔔 Notification sent to user ${user_id}: ${message}`);
  } catch (err) {
    console.error("Error creating notification:", err);
  }
}

module.exports = { getUserNotifications, markAsRead, createNotification };
