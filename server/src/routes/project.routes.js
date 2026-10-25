const express = require('express');
const {
  createProject,
  getMyProjects,
  getProject,
  inviteUser,
  saveNote,
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', createProject);
router.get('/', getMyProjects);
router.get('/:id', getProject);
router.post('/:id/invite', inviteUser);
router.put('/:id/note', saveNote);

module.exports = router;
