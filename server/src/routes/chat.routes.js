const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const {
  getChatMessages,
  sendChatMessage,
  toggleReaction,
  getProjectFilesForChat,
} = require('../controllers/chat.controller');

// All chat routes are protected
router.use(protect);

// GET /api/projects/:id/chat/messages
// POST /api/projects/:id/chat/messages
router.route('/messages')
  .get(getChatMessages)
  .post(sendChatMessage);

// POST /api/projects/:id/chat/messages/:messageId/reactions
router.post('/messages/:messageId/reactions', toggleReaction);

// GET /api/projects/:id/chat/files
router.get('/files', getProjectFilesForChat);

module.exports = router;
