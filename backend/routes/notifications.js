// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead } = require('../controllers/notificationController');

// GET all notifications for a user
router.get('/:user_id', getUserNotifications);

// PATCH mark one as read
router.patch('/:id/read', markAsRead);

module.exports = router;
