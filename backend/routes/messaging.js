const express = require('express');
const router = express.Router();

const {
  getOrCreateConversation,
  sendMessage,
  getMessages,
  getUserConversations,
  markMessageRead
} = require('../controllers/messagingController');

// Create or fetch conversation between 2 users
router.post('/conversation', getOrCreateConversation);

// Send message
router.post('/send', sendMessage);

// Get messages of a conversation
router.get('/:conversation_id/messages', getMessages);

// List all conversations of user
router.get('/user/:user_id', getUserConversations);

// Mark message as read
router.patch('/message/:message_id/read', markMessageRead);

module.exports = router;
