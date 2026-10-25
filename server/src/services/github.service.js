const simpleGit = require('simple-git');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Commit = require('../models/Commit');
const { getEmbeddings, getSummary, summariseCommit } = require('./openai.service');
const { upsertEmbeddings, serializeNamespace } = require('./vector.service');

let octokitClient = null;
const getOctokit = () => {
  if (!octokitClient) {
    octokitClient = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || undefined,
    });
  }
  return octokitClient;
};

const IGNORE_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.env',
];

/**
 * Check if a file should be processed
 */
const shouldProcessFile = (filePath) => {
  return !IGNORE_FILES.some((ignore) => filePath.includes(ignore));
};

/**
 * Recursively read all files from a directory
 */
const readAllFiles = (dir, baseDir = dir) => {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (!shouldProcessFile(relativePath)) continue;

    if (entry.isDirectory()) {
      files.push(...readAllFiles(fullPath, baseDir));
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({ source: relativePath, content });
      } catch {
        // Skip binary files
      }
    }
  }

  return files;
};

/**
 * Clone a GitHub repository and read all files
 */
const cloneAndReadRepo = async (githubUrl) => {
  // Use system temp dir to avoid OneDrive file locking issues on Windows
  const os = require('os');
  const tmpDir = path.join(os.tmpdir(), 'dionysus', `repo_${Date.now()}`);

  // Clean up if exists
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
  }

  const git = simpleGit();
  await git.clone(githubUrl, tmpDir);

  const files = readAllFiles(tmpDir);

  // Clean up cloned repo (retry on Windows file locks)
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
  } catch (err) {
    console.warn(`⚠️ Could not fully clean up temp dir: ${err.message}`);
  }

  return files;
};

/**
 * Generate a Mermaid graph from a list of file paths
 */
const generateFileTreeGraph = (filePaths) => {
  let graph = 'graph TD;\n';

  for (const filePath of filePaths) {
    if (filePath.includes('/')) {
      const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
      const currentItem = filePath.substring(filePath.lastIndexOf('/') + 1);
      const parentLabel = parentDir.replace(/\//g, '_');
      const currentLabel = `${parentLabel}_${currentItem}`;
      graph += `    ${parentLabel}["${parentDir}"]-->${currentLabel}["${currentItem}"]\n`;
    }
  }

  return graph;
};

/**
 * Generate documentation by cloning repo, summarizing files, and storing embeddings
 */
const generateDocumentation = async (githubUrl) => {
  // 1. Clone and read repo
  const files = await cloneAndReadRepo(githubUrl);
  const filePaths = files.map((f) => f.source);
  const mermaidGraph = generateFileTreeGraph(filePaths);

  // Helper for batch processing with concurrency control
  const pMap = async (items, fn, concurrency = 5) => {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map((item, idx) => fn(item, i + idx))
      );
      results.push(...chunkResults);
    }
    return results;
  };

  // 2. Summarize files (limit to top 40 key files if repo is huge to stay within free tier limits)
  const targetFiles = files.slice(0, 40);
  const summaries = await pMap(
    targetFiles,
    async (file) => {
      try {
        return await getSummary(file.source, file.content);
      } catch (err) {
        console.warn(`⚠️ Could not summarize ${file.source}: ${err.message}`);
        return `Code file located at ${file.source}`;
      }
    },
    5
  );

  // 3. Get embeddings for each summary
  const embeddings = await pMap(
    summaries,
    async (summary) => {
      try {
        return await getEmbeddings(summary);
      } catch (err) {
        console.warn(`⚠️ Could not get embeddings: ${err.message}`);
        return new Array(768).fill(0);
      }
    },
    5
  );

  // 4. Store in Pinecone
  const namespace = serializeNamespace(githubUrl);
  const vectors = targetFiles.map((file, i) => ({
    content: file.content,
    values: embeddings[i],
    metadata: {
      source: file.source,
      code: file.content.slice(0, 10000),
      summary: summaries[i],
    },
  }));

  try {
    await upsertEmbeddings(namespace, vectors);
  } catch (err) {
    console.warn(`⚠️ Pinecone upsert warning: ${err.message}`);
  }

  // 5. Generate documentation HTML
  const questions = [
    'What is the project about?',
    'How can I get started with this project?',
    "What does the project's repository contain?",
    'Are there any coding standards or guidelines I should follow?',
    'What dependencies, packages, APIs, or libraries does the project use?',
    'How can I build and compile the project?',
    'What should I know about testing in this project?',
    'How can I contribute to the project?',
    'How are issues tracked in this project?',
    "What's the version control strategy for this project?",
    "Tell me about the project's CI/CD pipeline.",
    'Where should I add documentation and comments in the codebase?',
  ];

  const { queryEmbeddings: queryVectors } = require('./vector.service');
  const { askCodebase } = require('./openai.service');

  const answers = await pMap(
    questions,
    async (question) => {
      try {
        const queryVector = await getEmbeddings(question);
        let context = '';
        try {
          const matches = await queryVectors(namespace, queryVector, 10);
          for (const match of matches) {
            context += `source:${match.metadata.source}\ncode content:${match.metadata.code}\nsummary of file:${match.metadata.summary}\n\n`;
          }
        } catch (vecErr) {
          console.warn(`⚠️ Vector search skipped: ${vecErr.message}`);
        }
        return await askCodebase(question, context);
      } catch (err) {
        console.warn(`⚠️ Could not answer question: ${err.message}`);
        return `<p>Details could not be automatically generated for this section.</p>`;
      }
    },
    3
  );

  const projectName = githubUrl.split('/').pop();
  const sections = [
    'Introduction',
    'Getting Started',
    'Repository',
    'Coding Standards',
    'Dependencies',
    'Building and Compiling',
    'Testing',
    'Contributing',
    'Issues',
    'Version Control',
    'CI/CD',
    'Documentation',
  ];

  let documentation = `<h1>${projectName}</h1>\n<ul>\n`;
  sections.forEach((section) => {
    const id = section.toLowerCase().replace(/ /g, '-');
    documentation += `  <li><a href="#${id}">${section}</a></li>\n`;
  });
  documentation += `</ul>\n\n`;
  sections.forEach((section, i) => {
    const id = section.toLowerCase().replace(/ /g, '-');
    documentation += `<h2 id="${id}">${section}</h2>\n<pre>${answers[i]}</pre>\n\n`;
  });

  return { documentation, mermaidGraph };
};

/**
 * Fetch latest commit hashes from GitHub
 */
const getCommitHashes = async (githubUrl) => {
  const octokit = getOctokit();
  const parts = githubUrl.split('/');
  const owner = parts[3];
  const repo = parts[4];

  const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner,
    repo,
    per_page: 15,
  });

  const sorted = data.sort(
    (a, b) =>
      new Date(b.commit.author.date).getTime() -
      new Date(a.commit.author.date).getTime()
  );

  return sorted.map((commit) => ({
    commitHash: commit.sha,
    commitMessage: commit.commit.message || '',
    commitAuthorName: commit.commit?.author?.name || '',
    commitAuthorAvatar: commit.author?.avatar_url || '',
    commitDate: commit.commit?.author?.date || '',
  }));
};

/**
 * Poll a repo for new commits, summarize them, and store in DB
 */
const pollRepo = async (githubUrl, projectId) => {
  const commitHashes = await getCommitHashes(githubUrl);

  const existingCommits = await Commit.find({ project: projectId });
  const existingHashes = new Set(existingCommits.map((c) => c.commitHash));

  const newCommits = commitHashes.filter((c) => !existingHashes.has(c.commitHash));

  if (newCommits.length === 0) return [];

  // Summarize each new commit diff
  const summaries = await Promise.allSettled(
    newCommits.map(async (commit) => {
      try {
        const headers = {
          Accept: 'application/vnd.github.v3.diff',
        };
        if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
          headers.Authorization = `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
        }
        const response = await axios.get(
          `${githubUrl}/commit/${commit.commitHash}.diff`,
          { headers }
        );
        const diff = String(response.data).slice(0, 10000);
        return summariseCommit(diff);
      } catch {
        return 'Unable to summarize this commit.';
      }
    })
  );

  // Save to DB
  const commitDocs = newCommits.map((commit, idx) => ({
    project: projectId,
    commitHash: commit.commitHash,
    commitMessage: commit.commitMessage,
    commitAuthorName: commit.commitAuthorName,
    commitAuthorAvatar: commit.commitAuthorAvatar,
    commitDate: commit.commitDate,
    summary:
      summaries[idx].status === 'fulfilled'
        ? summaries[idx].value
        : 'Unable to summarize this commit.',
  }));

  const saved = await Commit.insertMany(commitDocs, { ordered: false }).catch(
    () => commitDocs
  );
  return saved;
};

module.exports = {
  cloneAndReadRepo,
  generateFileTreeGraph,
  generateDocumentation,
  getCommitHashes,
  pollRepo,
};
