const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  githubAuth,
  githubCallback,
  disconnectGithub,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Profile management
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

// GitHub OAuth
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);
router.delete('/github', protect, disconnectGithub);

module.exports = router;
