const Project = require('../models/Project');
const {
  parseGithubUrl,
  getRepoMetadata,
  fetchRepoTree,
  fetchBatchFileContents,
  cloneAndReadRepo,
  shouldProcessFile,
} = require('../services/github.service');
const { analyzeSchema } = require('../services/schema-analyzer.service');

/**
 * Retrieve repository files
 */
const getRepositoryFiles = async (githubUrl) => {
  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL');
  }

  const { owner, repo } = parsed;
  let files = [];

  try {
    const repoMetadata = await getRepoMetadata(owner, repo);
    const tree = await fetchRepoTree(owner, repo, repoMetadata.defaultBranch);

    const relevantPaths = tree
      .map((item) => item.path)
      .filter((p) => shouldProcessFile(p));

    // Target schema, model, db, or prisma files plus top files
    const modelPaths = relevantPaths.filter((p) =>
      /(model|schema|entity|prisma|db)/i.test(p)
    );

    const targetPaths = Array.from(new Set([...modelPaths, ...relevantPaths.slice(0, 150)]));

    files = await fetchBatchFileContents(owner, repo, targetPaths, repoMetadata.defaultBranch, 5);
    if (files.length === 0) {
      throw new Error('No readable files via API');
    }
  } catch (err) {
    console.warn(`⚠️ GitHub API schema scan fallback to clone: ${err.message}`);
    files = await cloneAndReadRepo(githubUrl);
  }

  return files;
};

// @desc    Get schema intelligence for a project
// @route   GET /api/projects/:id/schema
const getSchemaIntelligence = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.schemaIntelligence) {
      return res.status(200).json({
        success: true,
        data: project.schemaIntelligence,
      });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub repository linked to this project',
      });
    }

    // Auto-generate if not cached
    const files = await getRepositoryFiles(project.githubUrl);
    const schemaData = await analyzeSchema(files);

    project.schemaIntelligence = schemaData;
    await project.save();

    return res.status(200).json({
      success: true,
      data: schemaData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Force refresh schema intelligence for a project
// @route   POST /api/projects/:id/schema/refresh
const refreshSchemaIntelligence = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub repository linked to this project',
      });
    }

    const files = await getRepositoryFiles(project.githubUrl);
    const schemaData = await analyzeSchema(files);

    project.schemaIntelligence = schemaData;
    await project.save();

    return res.status(200).json({
      success: true,
      data: schemaData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchemaIntelligence,
  refreshSchemaIntelligence,
};

