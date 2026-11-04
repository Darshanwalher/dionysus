const express = require('express');
const {
  processMeeting,
  uploadMeeting,
  getMeetings,
  getMeeting,
  deleteMeeting,
  askIssue,
} = require('../controllers/meeting.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadAudio } = require('../middleware/upload.middleware');

const router = express.Router();

router.use(protect);

router.post('/projects/:id/meetings', processMeeting);
router.post('/projects/:id/meetings/upload', uploadAudio, uploadMeeting);
router.get('/projects/:id/meetings', getMeetings);
router.get('/meetings/:id', getMeeting);
router.delete('/meetings/:id', deleteMeeting);
router.post('/meetings/:id/issues/:issueId/ask', askIssue);

module.exports = router;
