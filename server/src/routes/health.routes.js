const express = require('express');
const {
  getProjectHealth,
  refreshProjectHealth,
} = require('../controllers/health.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/projects/:id/health', getProjectHealth);
router.post('/projects/:id/health/refresh', refreshProjectHealth);

module.exports = router;

