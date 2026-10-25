const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a new project
// @route   POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a project name',
      });
    }

    const project = await Project.create({
      name,
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      members: req.user._id,
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single project with commits and meetings
// @route   GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('commits')
      .populate({ path: 'meetings', populate: { path: 'issues' } })
      .populate('questions')
      .populate('members', 'name email avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check user is a member
    if (!project.members.some((m) => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite a user to project by email
// @route   POST /api/projects/:id/invite
const inviteUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can invite members',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with that email',
      });
    }

    if (project.members.includes(user._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    project.members.push(user._id);
    await project.save();

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/update project documentation
// @route   PUT /api/projects/:id/note
const saveNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { documentation: text },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getMyProjects,
  getProject,
  inviteUser,
  saveNote,
};
