const express = require('express');
const { linkRepo, pollCommits, getUserRepos } = require('../controllers/github.controller');
const {
  generateArchitecture,
  generateDependencies,
  getAnalysis,
  refreshAnalysis,
} = require('../controllers/visualization.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// User-level GitHub endpoints (must be before /:id routes)
router.get('/user-repos', getUserRepos);

router.post('/:id/link-repo', linkRepo);
router.post('/:id/poll-commits', pollCommits);

// Architecture and Dependency Visualization Routes
router.post('/:id/architecture', generateArchitecture);
router.post('/:id/dependencies', generateDependencies);
router.get('/:id/analysis', getAnalysis);
router.post('/:id/analysis/refresh', refreshAnalysis);

module.exports = router;
