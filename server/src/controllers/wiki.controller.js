const Project = require('../models/Project');
const WikiPage = require('../models/WikiPage');
const {
  parseGithubUrl,
  getRepoMetadata,
  fetchRepoTree,
  fetchBatchFileContents,
  cloneAndReadRepo,
  shouldProcessFile,
} = require('../services/github.service');
const { generateDeepWiki, synthesizeChapterContent, WIKI_CHAPTERS } = require('../services/deepwiki.service');

/**
 * Fetch top relevant codebase files for DeepWiki generation
 */
const getWikiFiles = async (githubUrl) => {
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

    // Multi-tier multi-language prioritization
    // Tier 1: Manifests, root configs, readmes
    const tier1 = relevantPaths.filter((p) =>
      /(readme|package\.json|requirements\.txt|pyproject\.toml|setup\.py|pipfile|cargo\.toml|go\.mod|pom\.xml|build\.gradle|gemfile|dockerfile|docker-compose|\.env\.example)/i.test(p)
    );

    // Tier 2: Entry points & server setups
    const tier2 = relevantPaths.filter((p) =>
      /^(src\/|app\/|server\/|api\/)?(main|app|index|server|run|manage|train|predict|pipeline|cli)\.(py|js|ts|jsx|tsx|go|rs|java|rb|php)$/i.test(p)
    );

    // Tier 3: Routers, controllers, models, schemas, datasets, middleware, configs
    const tier3 = relevantPaths.filter((p) =>
      /(router?|route|controller|model|schema|entity|middleware|service|dataset|preprocess|feature|algorithm|recommender|config|settings)/i.test(p)
    );

    // Tier 4: Other source code files in repository root or src/
    const tier4 = relevantPaths.filter((p) =>
      /\.(py|js|ts|jsx|tsx|go|rs|java|ipynb|sql)$/i.test(p)
    );

    // Deduplicate maintaining order
    const prioritySet = new Set([...tier1, ...tier2, ...tier3, ...tier4]);
    const priorityPaths = Array.from(prioritySet).slice(0, 50);

    files = await fetchBatchFileContents(owner, repo, priorityPaths, repoMetadata.defaultBranch, 5);
  } catch (err) {
    console.warn(`⚠️ GitHub API fetch for DeepWiki failed: ${err.message}, fallback to clone`);
    files = await cloneAndReadRepo(githubUrl);
  }

  return files;
};

// @desc    Get all DeepWiki pages for a project
// @route   GET /api/projects/:id/wiki
const getWikiPages = async (req, res, next) => {
  try {
    const { id } = req.params;
    let pages = await WikiPage.find({ project: id }).sort({ order: 1 }).lean();

    // If no pages exist yet, generate them automatically if repo is linked
    if (pages.length === 0) {
      const project = await Project.findById(id).select('name githubUrl schemaIntelligence').lean();
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (!project.githubUrl) {
        return res.status(200).json({ success: true, data: [] });
      }

      const files = await getWikiFiles(project.githubUrl);
      pages = await generateDeepWiki({
        projectId: id,
        projectName: project.name,
        files,
        schemaData: project.schemaIntelligence,
      });
    }

    return res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single DeepWiki page by slug
// @route   GET /api/projects/:id/wiki/:slug
const getWikiPageBySlug = async (req, res, next) => {
  try {
    const { id, slug } = req.params;
    const page = await WikiPage.findOne({ project: id, slug }).lean();

    if (!page) {
      return res.status(404).json({ success: false, message: 'Wiki chapter not found' });
    }

    return res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Force re-generate all DeepWiki chapters
// @route   POST /api/projects/:id/wiki/refresh
const refreshDeepWiki = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).select('name githubUrl schemaIntelligence').lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub repository linked to this project',
      });
    }

    const files = await getWikiFiles(project.githubUrl);
    const pages = await generateDeepWiki({
      projectId: id,
      projectName: project.name,
      files,
      schemaData: project.schemaIntelligence,
    });

    return res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-synthesize a single specific DeepWiki chapter
// @route   POST /api/projects/:id/wiki/:slug/refresh
const refreshWikiChapter = async (req, res, next) => {
  try {
    const { id, slug } = req.params;
    const chapterDef = WIKI_CHAPTERS.find((c) => c.slug === slug);

    if (!chapterDef) {
      return res.status(404).json({ success: false, message: 'Invalid chapter slug' });
    }

    const project = await Project.findById(id).select('name githubUrl schemaIntelligence').lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const files = await getWikiFiles(project.githubUrl);
    const { markdownContent, referencedFiles } = await synthesizeChapterContent({
      chapter: chapterDef,
      projectName: project.name,
      files,
      schemaData: project.schemaIntelligence,
    });

    const updated = await WikiPage.findOneAndUpdate(
      { project: id, slug },
      {
        markdownContent,
        referencedFiles,
        lastGeneratedAt: new Date(),
      },
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWikiPages,
  getWikiPageBySlug,
  refreshDeepWiki,
  refreshWikiChapter,
};

