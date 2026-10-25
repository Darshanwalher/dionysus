const express = require('express');
const { linkRepo, pollCommits } = require('../controllers/github.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/:id/link-repo', linkRepo);
router.post('/:id/poll-commits', pollCommits);

module.exports = router;
