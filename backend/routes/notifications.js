// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead } = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/superAdminMiddelware');

// GET all notifications for a user
router.get('/:user_id', verifyToken, (req, res, next) => {
    // Ownership check
    if (req.user.id !== parseInt(req.params.user_id, 10)) {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}, getUserNotifications);

// PATCH mark one as read
router.patch('/:id/read', verifyToken, markAsRead);

module.exports = router;
