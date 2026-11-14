const { geminiChat, getEmbeddings } = require('./openai.service');
const { queryEmbeddings, serializeNamespace } = require('./vector.service');
const Project = require('../models/Project');

/**
 * Checks if a chat message mentions the AI co-pilot @dionysus
 */
const isCopilotMentioned = (content) => {
  if (!content || typeof content !== 'string') return false;
  return /@dionysus\b/i.test(content);
};

/**
 * Strips the @dionysus trigger word and returns the clean inquiry
 */
const cleanCopilotPrompt = (content) => {
  return content.replace(/@dionysus\b/gi, '').trim();
};

/**
 * Handles @dionysus co-pilot query with repository context and vector RAG
 */
const answerWithCopilot = async ({ projectId, userPrompt, taggedFiles = [], recentMessages = [] }) => {
  const project = await Project.findById(projectId)
    .select('name githubUrl schemaIntelligence healthScore')
    .lean();

  if (!project) {
    throw new Error('Project not found');
  }

  let codeContext = '';
  const citedFiles = new Set([...taggedFiles]);

  // 1. Vector RAG Search if GitHub repo is linked
  if (project.githubUrl) {
    try {
      const namespace = serializeNamespace(project.githubUrl);
      const queryVector = await getEmbeddings(userPrompt);
      const matches = await queryEmbeddings(namespace, queryVector, 5);

      if (matches && matches.length > 0) {
        const ragSnippets = matches
          .map((m) => {
            const file = m.metadata?.source || m.metadata?.fileName || 'unknown';
            citedFiles.add(file);
            return `// File: ${file}\n${(m.metadata?.summary || m.metadata?.content || '').slice(0, 1000)}`;
          })
          .join('\n\n');

        codeContext += `Relevant Repository Code Snippets:\n${ragSnippets}\n\n`;
      }
    } catch (ragErr) {
      console.warn(`[Copilot RAG] Vector search skipped: ${ragErr.message}`);
    }
  }

  // 2. Schema summary if available
  if (project.schemaIntelligence?.entities?.length > 0) {
    const entityList = project.schemaIntelligence.entities.map((e) => ({
      name: e.name,
      fields: e.fields?.map((f) => f.name),
    }));
    codeContext += `Database Schema Entities:\n${JSON.stringify(entityList, null, 2)}\n\n`;
  }

  // 3. Conversation history context (last 4 messages for conversational continuity)
  const historySnippet = recentMessages
    .slice(-4)
    .map((m) => `${m.sender?.name || 'User'}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are @dionysus, an elite AI software architect, security auditor, and developer co-pilot embedded directly into the team chat room for repository "${project.name}".

Core Guidelines:
1. Be concise, direct, and technically precise. Developers are chatting live in real time.
2. Provide clean, syntax-highlighted code blocks with the language tag (e.g. \`\`\`javascript or \`\`\`python).
3. If referring to files, cite the exact path using backticks (e.g. \`server/src/models/User.js\`).
4. If asked to fix a bug or explain an architecture, provide actionable steps.
5. Do not use generic filler ("Sure! Here is the answer"). Jump straight into the solution.`;

  const userQuery = `Current Conversation Context:
${historySnippet || 'No previous messages in context.'}

Repository Ground Truth:
${codeContext || 'No external code snippets retrieved.'}

User Question for @dionysus:
"${userPrompt}"`;

  const aiResponse = await geminiChat(systemPrompt, userQuery);

  // Extract any file paths mentioned in the AI response to add to taggedFiles
  const matchedPaths = aiResponse.match(/`([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)`/g);
  if (matchedPaths) {
    matchedPaths.forEach((p) => {
      const cleanPath = p.replace(/`/g, '');
      if (cleanPath.includes('/') && !cleanPath.includes('http')) {
        citedFiles.add(cleanPath);
      }
    });
  }

  return {
    content: aiResponse.trim(),
    taggedFiles: Array.from(citedFiles).slice(0, 8),
  };
};

module.exports = {
  isCopilotMentioned,
  cleanCopilotPrompt,
  answerWithCopilot,
};
