const express = require('express');
const {
  getWikiPages,
  getWikiPageBySlug,
  refreshDeepWiki,
  refreshWikiChapter,
} = require('../controllers/wiki.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/projects/:id/wiki', getWikiPages);
router.get('/projects/:id/wiki/:slug', getWikiPageBySlug);
router.post('/projects/:id/wiki/refresh', refreshDeepWiki);
router.post('/projects/:id/wiki/:slug/refresh', refreshWikiChapter);

module.exports = router;

