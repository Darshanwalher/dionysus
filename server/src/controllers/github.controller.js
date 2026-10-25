const Project = require('../models/Project');
const { generateDocumentation, pollRepo } = require('../services/github.service');

// @desc    Link a GitHub repo to a project and generate documentation
// @route   POST /api/projects/:id/link-repo
const linkRepo = async (req, res, next) => {
  try {
    let { githubUrl } = req.body;

    if (!githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a GitHub URL',
      });
    }

    githubUrl = githubUrl.toLowerCase();
    if (!githubUrl.includes('github.com')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub URL',
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Generate documentation and poll commits concurrently
    const [docResult] = await Promise.all([
      generateDocumentation(githubUrl),
      pollRepo(githubUrl, project._id),
    ]);

    project.githubUrl = githubUrl;
    project.documentation = docResult.documentation;
    project.mermaidGraph = docResult.mermaidGraph;
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('commits')
      .populate('members', 'name email avatar');

    res.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Poll commits from linked GitHub repo
// @route   POST /api/projects/:id/poll-commits
const pollCommits = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub URL linked to this project',
      });
    }

    await pollRepo(project.githubUrl, project._id);

    const updatedProject = await Project.findById(project._id)
      .populate('commits')
      .populate('members', 'name email avatar');

    res.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { linkRepo, pollCommits };
