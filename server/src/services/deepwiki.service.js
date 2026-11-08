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
    focus: 'System architecture, microservice/module boundaries, ingress flow, tech stack, data pipelines, and high-level mermaid graph.',
  },
  {
    slug: 'api-routes-reference',
    title: '2. API Endpoints & Routes Reference',
    category: 'API & Interfaces',
    order: 2,
    focus: 'REST/WebSocket endpoints, route definitions, parameters, request/response payload schemas, headers, status codes, and auth requirements.',
  },
  {
    slug: 'database-entity-dictionary',
    title: '3. Database & Entity Data Dictionary',
    category: 'Persistence',
    order: 3,
    focus: 'Mongoose schemas, Prisma entities, SQL tables, column definitions, foreign keys, cardinality (1:N, M:N), and indexing strategies.',
  },
  {
    slug: 'environment-deployment-setup',
    title: '4. Environment & Deployment Setup',
    category: 'Operations',
    order: 4,
    focus: 'Environment variables (.env), prerequisites, Docker / docker-compose, local development commands, ports, and build procedures.',
  },
  {
    slug: 'security-middleware-lifecycles',
    title: '5. Security & Middleware Lifecycles',
    category: 'Security',
    order: 5,
    focus: 'Authentication (JWT/OAuth), authorization, CORS policies, helmet headers, rate limiting, request validation, and error handling pipeline.',
  },
];

/**
 * Synthesizes a specific chapter using Gemini AI based on actual repository code context
 */
const synthesizeChapterContent = async ({ chapter, projectName, files = [], schemaData = null }) => {
  // Collect relevant code snippets matching the chapter focus
  let keywords = [];
  if (chapter.slug === 'overview-architecture') {
    keywords = ['readme', 'package.json', 'server', 'app', 'index', 'main'];
  } else if (chapter.slug === 'api-routes-reference') {
    keywords = ['route', 'router', 'controller', 'api', 'endpoint'];
  } else if (chapter.slug === 'database-entity-dictionary') {
    keywords = ['model', 'schema', 'entity', 'prisma', 'migration', 'db'];
  } else if (chapter.slug === 'environment-deployment-setup') {
    keywords = ['docker', 'env', 'package.json', 'readme', 'config', 'compose'];
  } else if (chapter.slug === 'security-middleware-lifecycles') {
    keywords = ['middleware', 'auth', 'jwt', 'security', 'cors', 'passport', 'protect'];
  }

  const matchingFiles = files.filter((f) => {
    const src = f.source.toLowerCase();
    return keywords.some((kw) => src.includes(kw));
  });

  const selectedFiles = matchingFiles.length > 0 ? matchingFiles.slice(0, 10) : files.slice(0, 8);
  const referencedFilePaths = selectedFiles.map((f) => f.source);

  const contextSnippets = selectedFiles
    .map((f) => `// File: ${f.source}\n${(f.content || '').slice(0, 1200)}`)
    .join('\n\n')
    .slice(0, 9000);

  const prompt = `You are a Principal Software Architect writing a dynamic technical DeepWiki documentation chapter for "${projectName}".
Chapter Title: "${chapter.title}"
Category: "${chapter.category}"
Primary Focus: ${chapter.focus}

Repository Code Context:
---
${contextSnippets}
---

${schemaData ? `Database Entities Summary: ${JSON.stringify(schemaData.entities?.map(e => ({ name: e.name, fields: e.fields?.map(f => f.name) })) || [])}` : ''}

Generate an exhaustive, beautifully formatted GitHub-Flavored Markdown chapter.
Rules:
1. Include an executive summary at the top with badges.
2. If discussing flows or architectures, embed 1-2 clean Mermaid diagrams using ONLY: flowchart LR, flowchart TD, sequenceDiagram, stateDiagram-v2, erDiagram, classDiagram. The diagram type keyword MUST be the very first line inside the \`\`\`mermaid fence. Do NOT repeat the word "mermaid" inside the fence. Keep node labels simple, using quoted strings for labels with spaces, e.g. A["User Service"]. No parentheses or brackets in unquoted labels.
3. If documenting APIs or endpoints, present organized Markdown tables with Method, Endpoint, Auth, Description, and Example Request/Response JSON blocks.
4. If documenting database entities, list tables, columns, constraints (PK/FK/IDX), and relationships.
5. Reference real file paths from the provided context (e.g. \`server/src/models/User.js\`).
6. Do NOT wrap the entire answer in \`\`\`markdown code block - return clean raw markdown directly.
7. Use at most 2 Mermaid diagrams per chapter to keep rendering fast.`;

  try {
    const markdown = await geminiChat(
      'You are a senior technical writer and developer docs architect. Return comprehensive, high-quality technical markdown with tables and mermaid diagrams.',
      prompt
    );

    return {
      markdownContent: markdown.replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '').trim(),
      referencedFiles: referencedFilePaths,
    };
  } catch (err) {
    console.warn(`⚠️ DeepWiki chapter synthesis fallback for ${chapter.slug}: ${err.message}`);
    // Safe deterministic fallback
    return {
      markdownContent: `# ${chapter.title}\n\n## Overview\nDocumentation for **${projectName}** covering ${chapter.focus}.\n\n### Referenced Files\n${referencedFilePaths.map((f) => `- \`${f}\``).join('\n')}\n\n*Click "Re-synthesize" to trigger a deep AI scan.*`,
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
      { upsert: true, new: true }
    );

    generatedPages.push(page);
  }

  return generatedPages;
};

module.exports = {
  WIKI_CHAPTERS,
  generateDeepWiki,
  synthesizeChapterContent,
};

