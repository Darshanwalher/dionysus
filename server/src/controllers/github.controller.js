const Project = require('../models/Project');
const User = require('../models/User');
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

    const user = await User.findById(req.user._id).select('+githubAccessToken');
    const token = user?.githubAccessToken || null;

    // Generate documentation and poll commits concurrently
    const [docResult] = await Promise.all([
      generateDocumentation(githubUrl, token),
      pollRepo(githubUrl, project._id, token),
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

    const user = await User.findById(req.user._id).select('+githubAccessToken');
    const token = user?.githubAccessToken || null;

    await pollRepo(project.githubUrl, project._id, token);

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

module.exports = { linkRepo, pollCommits, getUserRepos };

// @desc    Get authenticated user's GitHub repos (public + private)
// @route   GET /api/github/user-repos
async function getUserRepos(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+githubAccessToken');

    if (!user || !user.githubAccessToken) {
      return res.status(400).json({ success: false, message: 'GitHub account not connected' });
    }

    const response = await fetch(
      'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator',
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ success: false, message: err.message || 'GitHub API error' });
    }

    const repos = await response.json();

    res.json({
      success: true,
      data: repos.map((r) => ({
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        html_url: r.html_url,
        description: r.description,
        default_branch: r.default_branch,
        stargazers_count: r.stargazers_count,
        language: r.language,
        updated_at: r.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
}
