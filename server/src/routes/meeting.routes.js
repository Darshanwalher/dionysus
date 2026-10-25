const express = require('express');
const {
  processMeeting,
  getMeetings,
  getMeeting,
  deleteMeeting,
  askIssue,
} = require('../controllers/meeting.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/projects/:id/meetings', processMeeting);
router.get('/projects/:id/meetings', getMeetings);
router.get('/meetings/:id', getMeeting);
router.delete('/meetings/:id', deleteMeeting);
router.post('/meetings/:id/issues/:issueId/ask', askIssue);

module.exports = router;
