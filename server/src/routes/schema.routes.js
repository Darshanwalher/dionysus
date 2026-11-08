const express = require('express');
const {
  getSchemaIntelligence,
  refreshSchemaIntelligence,
} = require('../controllers/schema.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/projects/:id/schema', getSchemaIntelligence);
router.post('/projects/:id/schema/refresh', refreshSchemaIntelligence);

module.exports = router;

