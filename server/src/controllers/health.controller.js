const Project = require('../models/Project');
const {
  parseGithubUrl,
  getRepoMetadata,
  fetchRepoTree,
  fetchBatchFileContents,
  cloneAndReadRepo,
  shouldProcessFile,
} = require('../services/github.service');
const { calculateHealthScore } = require('../services/health-calculator.service');

/**
 * Fetch files for health scan
 */
const getRepoFilesForHealth = async (githubUrl) => {
  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) throw new Error('Invalid GitHub repository URL');

  const { owner, repo } = parsed;
  let files = [];

  try {
    const repoMetadata = await getRepoMetadata(owner, repo);
    const tree = await fetchRepoTree(owner, repo, repoMetadata.defaultBranch);

    const relevantPaths = tree
      .map((item) => item.path)
      .filter((p) => shouldProcessFile(p));

    // Sample top 80 most important files
    const priorityPaths = relevantPaths.filter((p) =>
      /(readme|package|config|env|src\/|server\/|client\/)/i.test(p)
    ).slice(0, 80);

    files = await fetchBatchFileContents(owner, repo, priorityPaths, repoMetadata.defaultBranch, 5);
  } catch (err) {
    console.warn(`⚠️ GitHub API fetch for health failed: ${err.message}, fallback to clone`);
    files = await cloneAndReadRepo(githubUrl);
  }

  return files;
};

// @desc    Get repository health score & breakdown
// @route   GET /api/projects/:id/health
const getProjectHealth = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .select('name githubUrl dependencyGraph architectureGraph healthScore')
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.healthScore) {
      return res.status(200).json({
        success: true,
        data: project.healthScore,
      });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub repository linked to this project',
      });
    }

    const files = await getRepoFilesForHealth(project.githubUrl);
    const healthData = calculateHealthScore({
      files,
      dependencyGraph: project.dependencyGraph,
      architectureGraph: project.architectureGraph,
    });

    await Project.findByIdAndUpdate(req.params.id, {
      healthScore: healthData,
    });

    return res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Force refresh repository health score
// @route   POST /api/projects/:id/health/refresh
const refreshProjectHealth = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .select('name githubUrl dependencyGraph architectureGraph')
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub repository linked to this project',
      });
    }

    const files = await getRepoFilesForHealth(project.githubUrl);
    const healthData = calculateHealthScore({
      files,
      dependencyGraph: project.dependencyGraph,
      architectureGraph: project.architectureGraph,
    });

    await Project.findByIdAndUpdate(req.params.id, {
      healthScore: healthData,
    });

    return res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectHealth,
  refreshProjectHealth,
};

