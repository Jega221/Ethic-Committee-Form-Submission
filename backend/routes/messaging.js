const express = require('express');
const router = express.Router();

const {
  getOrCreateConversation,
  sendMessage,
  getMessages,
  getUserConversations,
  markMessageRead
} = require('../controllers/messagingController');
const { verifyToken } = require('../middlewares/superAdminMiddelware');

// Create or fetch conversation between 2 users
router.post('/conversation', verifyToken, getOrCreateConversation);

// Send message
router.post('/send', verifyToken, sendMessage);

// Get messages of a conversation
router.get('/:conversation_id/messages', verifyToken, getMessages);

// List all conversations of user
router.get('/user/:user_id', verifyToken, (req, res, next) => {
  // Ownership check
  if (req.user.id !== parseInt(req.params.user_id, 10)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}, getUserConversations);

// Mark message as read
router.patch('/message/:message_id/read', verifyToken, markMessageRead);

module.exports = router;
