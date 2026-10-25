const { AssemblyAI } = require('assemblyai');
const { getEmbeddings, askMeetingContent } = require('./openai.service');
const { upsertEmbeddings, queryEmbeddings, serializeNamespace } = require('./vector.service');

let assemblyClient = null;
const getAssembly = () => {
  if (!assemblyClient) {
    assemblyClient = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY || 'dummy_key',
    });
  }
  return assemblyClient;
};

/**
 * Convert milliseconds to MM:SS format
 */
const msToTime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Split text into chunks with overlap
 */
const splitTextIntoChunks = (text, chunkSize = 800, overlap = 130) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start >= text.length) break;
  }
  return chunks;
};

/**
 * Transcribe a meeting audio file and return chapter summaries
 */
const transcribeMeeting = async (audioUrl) => {
  const client = getAssembly();
  const transcript = await client.transcripts.transcribe({
    audio_url: audioUrl,
    auto_chapters: true,
  });

  const summaries = (transcript.chapters || []).map((chapter) => ({
    start: msToTime(chapter.start),
    end: msToTime(chapter.end),
    gist: chapter.gist,
    headline: chapter.headline,
    summary: chapter.summary,
  }));

  // Store transcript chunks as embeddings for Q&A
  const fullText = transcript.text || '';
  const chunks = splitTextIntoChunks(fullText);

  const embeddings = await Promise.all(
    chunks.map((chunk) => getEmbeddings(chunk))
  );

  const namespace = serializeNamespace(audioUrl);
  const vectors = chunks.map((chunk, i) => ({
    content: chunk,
    values: embeddings[i],
    metadata: {
      page_content: chunk,
    },
  }));

  await upsertEmbeddings(namespace, vectors);

  return summaries;
};

/**
 * Ask a question about a meeting based on its audio URL
 */
const askMeeting = async (audioUrl, query, quote) => {
  const namespace = serializeNamespace(audioUrl);
  const queryVector = await getEmbeddings(query);
  const matches = await queryEmbeddings(namespace, queryVector, 10);

  let context = '';
  for (const match of matches) {
    context += `meeting snippet: ${match.metadata.page_content}\n`;
  }

  const answer = await askMeetingContent(query, quote, context);
  return answer;
};

module.exports = {
  transcribeMeeting,
  askMeeting,
};
