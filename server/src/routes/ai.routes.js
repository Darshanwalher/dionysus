const express = require('express');
const { askQuestion, getQuestions, deleteQuestion } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/projects/:id/ask', askQuestion);
router.get('/projects/:id/questions', getQuestions);
router.delete('/questions/:id', deleteQuestion);

module.exports = router;
