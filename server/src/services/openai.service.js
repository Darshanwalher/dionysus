const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAIClient = null;
const getGenAI = () => {
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY || 'dummy_key'
    );
  }
  return genAIClient;
};

/**
 * Get embeddings for a text string using Google Gemini
 */
const getEmbeddings = async (text) => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text.replace(/\n/g, ''));
  return result.embedding.values; // returns 768-dimension vector
};

/**
 * Helper: run a Gemini chat completion and return the text response
 */
const geminiChat = async (systemPrompt, userPrompt) => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.8-flash',
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text();
};

/**
 * Get a summary of a code file for documentation
 */
const getSummary = async (source, code) => {
  const truncatedCode = code.length > 10000 ? code.slice(0, 10000) : code;

  return geminiChat(
    'You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects',
    `You are onboarding a junior software engineer and explaining to them the purpose of the ${source} file.
Here is the code:
---
${truncatedCode}
---
Give a summary no more than 100 words of the code above.`
  );
};

/**
 * Ask a question about the codebase using context from vector search
 */
const askCodebase = async (query, context) => {
  return geminiChat(
    `AI assistant is a brand new, powerful, human-like artificial intelligence.
The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
AI is a well-behaved and well-mannered individual.
AI will answer all questions in the HTML format, including code snippets, proper HTML formatting.
AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
If the question is asking about code or a specific file, AI will provide the detailed answer, giving step by step instructions, including code snippets.
START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK
AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
AI assistant will not invent anything that is not drawn directly from the context.`,
    query
  );
};

/**
 * Summarize a git commit diff
 */
const summariseCommit = async (diff) => {
  return geminiChat(
    `You are an expert programmer, and you are trying to summarize a git diff.
Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
\`\`\`
diff --git a/lib/index.js b/lib/index.js
index aadf691..bfef603 100644
--- a/lib/index.js
+++ b/lib/index.js
\`\`\`
This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
Then there is a specifier of the lines that were modified.
A line starting with \`+\` means it was added.
A line that starting with \`-\` means that line was deleted.
A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
It is not part of the diff.
[...]
EXAMPLE SUMMARY COMMENTS:
\`\`\`
* Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
* Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
* Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
* Added an OpenAI API for completions [packages/utils/apis/openai.ts]
* Lowered numeric tolerance for test files
\`\`\`
Most commits will have less comments than this examples list.
The last comment does not include the file names,
because there were more than two relevant files in the hypothetical commit.
Do not include parts of the example in your summary.
It is given only as an example of appropriate comments.`,
    `Please summarise the following diff file: \n\n${diff}`
  );
};

/**
 * Ask a question about meeting content using context
 */
const askMeetingContent = async (query, quote, context) => {
  return geminiChat(
    `AI assistant is a brand new, powerful, human-like artificial intelligence.
The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
AI is a well-behaved and well-mannered individual.
AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK
AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
AI assistant will not invent anything that is not drawn directly from the context.`,
    `I am asking a question in regards to this quote in the meeting: ${quote}\nHere is the question: ${query}`
  );
};

module.exports = {
  getEmbeddings,
  getSummary,
  askCodebase,
  summariseCommit,
  askMeetingContent,
};
