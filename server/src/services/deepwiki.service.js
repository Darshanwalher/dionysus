const path = require('path');
const { geminiChat } = require('./openai.service');
const WikiPage = require('../models/WikiPage');

/**
 * Chapters configuration defining the DeepWiki structure
 */
const WIKI_CHAPTERS = [
  {
    slug: 'overview-architecture',
    title: '1. Overview & High-Level Architecture',
    category: 'Architecture',
    order: 1,
    focus: 'Verified system architecture, actual entry points, technology stack, directory structure, and high-level workflow.',
  },
  {
    slug: 'api-routes-reference',
    title: '2. API Endpoints & Interfaces Reference',
    category: 'API & Interfaces',
    order: 2,
    focus: 'Verified HTTP/REST routes, CLI arguments, or function interfaces. If no web server is present, explicitly document that no HTTP endpoints exist.',
  },
  {
    slug: 'database-entity-dictionary',
    title: '3. Data Layer & Entity Dictionary',
    category: 'Persistence',
    order: 3,
    focus: 'Verified database models, schemas, or dataset files (CSV, JSON, DataFrames). If no database exists, document the actual local data structures and state no database is present.',
  },
  {
    slug: 'environment-deployment-setup',
    title: '4. Environment & Deployment Setup',
    category: 'Operations',
    order: 4,
    focus: 'Verified runtime requirements, manifest dependencies, environment variables, setup commands, and execution instructions.',
  },
  {
    slug: 'security-middleware-lifecycles',
    title: '5. Security, Validation & Error Lifecycles',
    category: 'Security',
    order: 5,
    focus: 'Verified security practices, input validation, error handling, or exception handling. Document only what exists in code.',
  },
];

/**
 * Builds a deterministic repository fingerprint from actual code files
 * to bound the AI's generation context and prevent hallucinations.
 */
const buildRepoFingerprint = (files = []) => {
  const extCounts = {};
  files.forEach((f) => {
    const ext = path.extname(f.source).toLowerCase() || 'no-ext';
    extCounts[ext] = (extCounts[ext] || 0) + 1;
  });

  let manifestType = 'None found';
  let declaredDependencies = [];

  // 1. package.json (Node.js)
  const pkgJson = files.find((f) => f.source.toLowerCase().endsWith('package.json'));
  if (pkgJson) {
    manifestType = 'package.json (Node.js / JavaScript / TypeScript)';
    try {
      const parsed = JSON.parse(pkgJson.content);
      const deps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
      declaredDependencies.push(...Object.keys(deps));
    } catch {
      // ignore json parse error
    }
  }

  // 2. requirements.txt / pyproject.toml (Python)
  const reqTxt = files.find((f) => f.source.toLowerCase().endsWith('requirements.txt'));
  if (reqTxt) {
    manifestType = manifestType === 'None found' ? 'requirements.txt (Python)' : `${manifestType}, requirements.txt (Python)`;
    const lines = reqTxt.content
      .split('\n')
      .map((l) => l.trim().split(/[=<>~#!]/)[0].trim())
      .filter((l) => l && !l.startsWith('-'));
    declaredDependencies.push(...lines);
  }

  const pyproject = files.find((f) => f.source.toLowerCase().endsWith('pyproject.toml'));
  if (pyproject) {
    manifestType = manifestType === 'None found' ? 'pyproject.toml (Python)' : `${manifestType}, pyproject.toml (Python)`;
  }

  const setupPy = files.find((f) => f.source.toLowerCase().endsWith('setup.py'));
  if (setupPy) {
    manifestType = manifestType === 'None found' ? 'setup.py (Python)' : `${manifestType}, setup.py (Python)`;
  }

  // 3. Entry points
  const entryPointPatterns = /(main|app|index|server|run|manage|train|predict|pipeline|cli)\.(py|js|ts|go|rs|java|rb)/i;
  const entryPoints = files.filter((f) => entryPointPatterns.test(f.source)).map((f) => f.source);

  // 4. Persistence detection
  const ormKeywords = [
    'mongoose', 'prisma', 'typeorm', 'sequelize', 'sqlalchemy', 'django.db',
    'psycopg', 'pymongo', 'sqlite3', 'mysql2', 'pg', 'redis'
  ];
  const hasOrmDep = declaredDependencies.some((dep) =>
    ormKeywords.some((kw) => dep.toLowerCase().includes(kw))
  );
  const hasDbFiles = files.some((f) =>
    /(model|schema|migration|entities?)\//i.test(f.source) ||
    /\.(prisma|sql)$/i.test(f.source)
  );
  const hasLocalDataFiles = files.some((f) =>
    /\.(csv|json|parquet|sqlite|h5|pkl|pickle|tsv)$/i.test(f.source) ||
    /(dataset|data|raw|processed)\//i.test(f.source)
  );

  let persistenceStatus = 'No database or ORM detected';
  if (hasOrmDep || hasDbFiles) {
    persistenceStatus = 'Database / ORM components detected in repository';
  } else if (hasLocalDataFiles) {
    persistenceStatus = 'Local files / datasets / in-memory structures only (No relational or document database)';
  }

  // 5. Interface / Web API detection
  const apiFrameworks = [
    'express', 'fastapi', 'flask', 'django', 'koa', 'nestjs', 'gin', 'actix',
    'spring', 'tornado', 'bottle', 'falcon'
  ];
  const hasApiDep = declaredDependencies.some((dep) =>
    apiFrameworks.some((kw) => dep.toLowerCase().includes(kw))
  );
  const hasRouteFiles = files.some((f) =>
    /(router?|routes?|controllers?|endpoints?|handlers?)\//i.test(f.source)
  );

  let interfaceStatus = 'Standalone scripts / notebooks / CLI (No HTTP REST API framework detected)';
  if (hasApiDep || hasRouteFiles) {
    interfaceStatus = 'Web API / HTTP server detected';
  }

  return {
    manifestType,
    declaredDependencies: Array.from(new Set(declaredDependencies)).slice(0, 35),
    entryPoints: entryPoints.slice(0, 10),
    persistenceStatus,
    interfaceStatus,
    hasDatabase: Boolean(hasOrmDep || hasDbFiles),
    hasHttpApi: Boolean(hasApiDep || hasRouteFiles),
    hasLocalData: Boolean(hasLocalDataFiles),
    fileCount: files.length,
    fileExtensions: extCounts,
  };
};

/**
 * Synthesizes a specific chapter using Gemini AI strictly bounded by repository evidence
 */
const synthesizeChapterContent = async ({ chapter, projectName, files = [], schemaData = null }) => {
  const fingerprint = buildRepoFingerprint(files);

  // Chapter-specific keyword targeting
  let keywords = [];
  let explicitInstruction = '';

  if (chapter.slug === 'overview-architecture') {
    keywords = ['readme', 'package.json', 'requirements.txt', 'pyproject.toml', 'main', 'app', 'index', 'server', 'train', 'pipeline', 'config'];
  } else if (chapter.slug === 'api-routes-reference') {
    if (!fingerprint.hasHttpApi) {
      keywords = ['main', 'app', 'run', 'cli', 'train', 'predict', 'readme'];
      explicitInstruction = 'NOTICE: The repository fingerprint confirms NO HTTP/REST API server or web framework is present. Do NOT invent REST endpoints, status codes, or HTTP routes. Explicitly state "No REST/HTTP endpoints present in repository" under "Not present in repository", and document any entry-point scripts or CLI/function invocations that actually exist.';
    } else {
      keywords = ['route', 'router', 'controller', 'api', 'endpoint', 'server', 'app'];
    }
  } else if (chapter.slug === 'database-entity-dictionary') {
    if (!fingerprint.hasDatabase) {
      keywords = ['dataset', 'data', 'csv', 'json', 'preprocess', 'load', 'feature', 'train', 'model', 'dataframe'];
      explicitInstruction = 'NOTICE: The repository fingerprint confirms NO relational or document database (MongoDB, PostgreSQL, MySQL, Prisma, etc.) is present. Do NOT invent database tables, SQL columns, or foreign keys. Explicitly state "No database or ORM present in repository". Document the actual data files (e.g. CSV, JSON, in-memory Pandas DataFrames, or pickle files) that the code actually loads and processes.';
    } else {
      keywords = ['model', 'schema', 'entity', 'prisma', 'migration', 'db', 'table'];
    }
  } else if (chapter.slug === 'environment-deployment-setup') {
    keywords = ['docker', 'env', 'package.json', 'requirements.txt', 'pyproject.toml', 'setup.py', 'readme', 'config', 'makefile'];
  } else if (chapter.slug === 'security-middleware-lifecycles') {
    keywords = ['middleware', 'auth', 'jwt', 'security', 'cors', 'passport', 'protect', 'validate', 'validation', 'error', 'exception'];
    explicitInstruction = 'NOTICE: Document only security, validation, and error-handling code that actually exists in the provided files. If no JWT, OAuth, or rate limiting is implemented, do NOT claim it exists. List absent mechanisms under "Not present in repository".';
  }

  // Filter matching files
  const matchingFiles = files.filter((f) => {
    const src = f.source.toLowerCase();
    return keywords.some((kw) => src.includes(kw));
  });

  // If no files match, use entry points and manifests rather than random arbitrary files
  const selectedFiles = matchingFiles.length > 0
    ? matchingFiles.slice(0, 10)
    : files.filter((f) => /(readme|package\.json|requirements\.txt|pyproject\.toml|main\.|app\.)/i.test(f.source)).slice(0, 6);

  const referencedFilePaths = selectedFiles.map((f) => f.source);

  // If literally no relevant files exist
  if (selectedFiles.length === 0) {
    return {
      markdownContent: `# ${chapter.title}\n\n**Scope**: ${chapter.focus}\n\n## Summary\nInsufficient evidence in the provided files to document this chapter.\n\n## Not present in repository\n- No matching source files or configuration found for this topic.\n\n## Assumptions and confidence\n- Confidence: High (Absence verified by repository file scan)`,
      referencedFiles: [],
    };
  }

  // Build context snippets with file source headers
  const contextSnippets = selectedFiles
    .map((f) => `// File: ${f.source}\n${(f.content || '').slice(0, 1400)}`)
    .join('\n\n')
    .slice(0, 9500);

  // Only include schemaData if it has verified entities and database is detected
  const verifiedSchemaSummary = (fingerprint.hasDatabase && schemaData?.entities?.length > 0)
    ? `Verified Database Entities from Code: ${JSON.stringify(schemaData.entities.map((e) => ({ name: e.name, fields: e.fields?.map((f) => f.name) })))}`
    : 'No verified database entity models detected.';

  const systemPrompt = `You are a strict, evidence-based technical documentation generator.
Your ONLY source of truth is the repository files provided in the prompt.
You must document strictly what EXISTS in the code, NOT what a typical project might have.

CRITICAL EVIDENCE RULES:
1. Every claim (technology, library, table, field, endpoint, class, function, config, feature) must be traceable to a specific file in the provided context.
2. After each subsection, include an "Evidence: \`path/to/file\`" line listing the exact supporting file(s).
3. If you cannot find evidence for something, do NOT write it. State exactly: "Not present in repository."
4. Never infer a technology from the project domain. A recommender system does not imply a database, vector embeddings, RLS, encryption, or an API. Document these only if you see them in the provided code.
5. Never copy conventions from other projects, templates, or general knowledge.
6. Match the project's real scale and maturity. Never use buzzwords like "production-grade", "enterprise", "ACID-compliant", or "highly scalable" unless explicitly implemented in code.
7. Diagrams (Mermaid) must contain ONLY components, modules, or entities verified in the code. Do not add boxes for unverified systems.
8. If provided files are insufficient to document a chapter, state: "Insufficient evidence in the provided files to document this chapter." Do not guess.`;

  const userPrompt = `# Documentation Target: ${projectName}
Chapter Title: ${chapter.title}
Category: ${chapter.category}
Topic Focus: ${chapter.focus}

## Repository Fingerprint (Ground Truth Boundary):
- Primary Manifest: ${fingerprint.manifestType}
- Declared Dependencies: ${fingerprint.declaredDependencies.join(', ') || 'None declared'}
- Identified Entry Points: ${fingerprint.entryPoints.join(', ') || 'None identified'}
- Persistence Status: ${fingerprint.persistenceStatus}
- Interface Status: ${fingerprint.interfaceStatus}
- Total Scanned Files: ${fingerprint.fileCount}

${explicitInstruction ? `## Special Constraint:\n${explicitInstruction}\n` : ''}

## Provided Repository Code Files:
---
${contextSnippets}
---

${verifiedSchemaSummary !== 'No verified database entity models detected.' ? `${verifiedSchemaSummary}\n` : ''}

Generate a concise, beautifully structured GitHub-Flavored Markdown chapter strictly adhering to this output format:
1. Title and a short "Scope" line
2. Summary (2-4 sentences, only verified facts)
3. Body sections with Markdown tables or clean Mermaid diagram (if relevant)
   - Every body section MUST end with an "Evidence: \`filepath\`" citation.
4. "Not present in repository" list (explicitly list missing items e.g. databases, auth, endpoints that typical apps might have but this project does not)
5. "Assumptions and confidence" (rate sections High / Medium / Low confidence and explain any inference)

IMPORTANT MERMAID RULES:
- Use at most 1 Mermaid diagram.
- PREFERRED DIAGRAM TYPE: flowchart TD or flowchart LR.
- For architectures, data pipelines, and database entity relationships, ALWAYS use flowchart TD or flowchart LR with clean, quoted node labels:
  Example:
  \`\`\`mermaid
  flowchart TD
      User["User Model\\n(email, role, contact)"] -->|has cart| Cart["Cart Model\\n(items, price)"]
      Cart -->|references| Product["Product Model\\n(title, seller, price)"]
  \`\`\`
- Do NOT use classDiagram (it is fragile and prone to syntax errors with underscores and property types).
- Use ONLY: flowchart LR, flowchart TD, sequenceDiagram, or stateDiagram-v2.
- First line inside \`\`\`mermaid must be the diagram type.
- Keep node labels simple, clean, and in double quotes: NodeId["Clean Label"].
- Never include unverified components in diagrams.

Do NOT wrap the response in \`\`\`markdown code blocks - return raw markdown directly.`;

  try {
    const markdown = await geminiChat(systemPrompt, userPrompt);

    return {
      markdownContent: markdown.replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '').trim(),
      referencedFiles: referencedFilePaths,
    };
  } catch (err) {
    console.warn(`⚠️ DeepWiki chapter synthesis fallback for ${chapter.slug}: ${err.message}`);
    return {
      markdownContent: `# ${chapter.title}\n\n**Scope**: ${chapter.focus}\n\n## Summary\nDocumentation for **${projectName}** synthesized from repository files.\n\n## Referenced Files\n${referencedFilePaths.map((f) => `- \`${f}\``).join('\n')}\n\n*Click "Re-synthesize" to trigger a fresh AI scan.*`,
      referencedFiles: referencedFilePaths,
    };
  }
};

/**
 * Generates all chapters for a project and saves them into MongoDB
 */
const generateDeepWiki = async ({ projectId, projectName, files = [], schemaData = null }) => {
  const generatedPages = [];

  for (const chapter of WIKI_CHAPTERS) {
    const { markdownContent, referencedFiles } = await synthesizeChapterContent({
      chapter,
      projectName,
      files,
      schemaData,
    });

    const page = await WikiPage.findOneAndUpdate(
      { project: projectId, slug: chapter.slug },
      {
        project: projectId,
        slug: chapter.slug,
        title: chapter.title,
        category: chapter.category,
        order: chapter.order,
        markdownContent,
        referencedFiles,
        isGenerated: true,
        lastGeneratedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    generatedPages.push(page);
  }

  return generatedPages;
};

module.exports = {
  WIKI_CHAPTERS,
  buildRepoFingerprint,
  generateDeepWiki,
  synthesizeChapterContent,
};
