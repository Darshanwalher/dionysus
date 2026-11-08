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
 * Retrieve ONLY schema and model files from repository (fast targeted fetch)
 */
const getRepositorySchemaFiles = async (githubUrl) => {
  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL');
  }

  const { owner, repo } = parsed;
  let files = [];

  try {
    const repoMetadata = await getRepoMetadata(owner, repo);
    const tree = await fetchRepoTree(owner, repo, repoMetadata.defaultBranch);

    // Filter strictly for model, schema, entity, db, prisma candidate files
    const relevantPaths = tree
      .map((item) => item.path)
      .filter((p) => shouldProcessFile(p));

    const modelPaths = relevantPaths.filter((p) =>
      /(model|schema|entities|entity|prisma|db)/i.test(p) &&
      !/(test|spec|\.d\.ts|\.map)/i.test(p)
    );

    // Target ONLY matched model paths (capped at 25 files max)
    const targetPaths = modelPaths.slice(0, 25);

    if (targetPaths.length > 0) {
      files = await fetchBatchFileContents(owner, repo, targetPaths, repoMetadata.defaultBranch, 5);
    }

    if (files.length === 0) {
      // Fallback: fetch package.json + entry files to check for schemas
      const fallbackPaths = relevantPaths.filter((p) =>
        /(package\.json|index\.[jt]sx?|server\.[jt]sx?|app\.[jt]sx?)/i.test(p)
      ).slice(0, 5);
      if (fallbackPaths.length > 0) {
        files = await fetchBatchFileContents(owner, repo, fallbackPaths, repoMetadata.defaultBranch, 5);
      }
    }
  } catch (err) {
    console.warn(`⚠️ GitHub API schema scan fallback: ${err.message}`);
    // If API fails or is rate limited, read only top candidate files if cloned
    try {
      const allFiles = await cloneAndReadRepo(githubUrl);
      files = allFiles.filter((f) =>
        /(model|schema|entities|entity|prisma|db)/i.test(f.source)
      ).slice(0, 25);
    } catch (cloneErr) {
      console.warn(`⚠️ Git clone fallback failed: ${cloneErr.message}`);
    }
  }

  return files;
};

// @desc    Get schema intelligence for a project
// @route   GET /api/projects/:id/schema
const getSchemaIntelligence = async (req, res, next) => {
  try {
    // 1. Fast check if already cached
    const project = await Project.findById(req.params.id)
      .select('githubUrl schemaIntelligence')
      .lean();

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

    // 2. Fetch only model files (fast targeted fetch)
    const files = await getRepositorySchemaFiles(project.githubUrl);
    const schemaData = await analyzeSchema(files);

    // 3. Cache result in background
    await Project.findByIdAndUpdate(req.params.id, {
      schemaIntelligence: schemaData,
    });

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
    const project = await Project.findById(req.params.id).select('githubUrl').lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub repository linked to this project',
      });
    }

    const files = await getRepositorySchemaFiles(project.githubUrl);
    const schemaData = await analyzeSchema(files);

    await Project.findByIdAndUpdate(req.params.id, {
      schemaIntelligence: schemaData,
    });

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
