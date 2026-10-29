const express = require('express');
const {
  createProject,
  getMyProjects,
  getProject,
  updateProject,
  deleteProject,
  inviteUser,
  saveNote,
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', createProject);
router.get('/', getMyProjects);
router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);
router.post('/:id/invite', inviteUser);
router.put('/:id/note', saveNote);

module.exports = router;
