const { Pinecone } = require('@pinecone-database/pinecone');
const crypto = require('crypto');

let pineconeIndex = null;

/**
 * Initialize Pinecone client and get the index
 */
const getIndex = async () => {
  if (pineconeIndex) return pineconeIndex;

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || 'dummy_key',
  });

  pineconeIndex = pc.index(process.env.PINECONE_INDEX || 'dionysus');
  return pineconeIndex;
};

/**
 * Generate a deterministic ID from content
 */
const generateId = (content) => {
  return crypto.createHash('md5').update(content).digest('hex');
};

/**
 * Upsert vectors into a Pinecone namespace
 * @param {string} namespace - Namespace to store vectors in
 * @param {Array<{id?: string, values: number[], metadata: object, content?: string}>} vectors
 */
const upsertEmbeddings = async (namespace, vectors) => {
  const index = await getIndex();
  const ns = index.namespace(namespace);

  const records = vectors.map((v) => ({
    id: v.id || generateId(v.content || JSON.stringify(v.metadata)),
    values: v.values,
    metadata: v.metadata,
  }));

  // Pinecone supports max 100 vectors per upsert
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await ns.upsert({ records: batch });
  }

  return { upsertedCount: records.length };
};

/**
 * Query vectors from a Pinecone namespace
 * @param {string} namespace - Namespace to query
 * @param {number[]} queryVector - The query embedding vector
 * @param {number} topK - Number of results to return
 */
const queryEmbeddings = async (namespace, queryVector, topK = 10) => {
  const index = await getIndex();
  const ns = index.namespace(namespace);

  const results = await ns.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  return results.matches || [];
};

/**
 * Serialize a URL or github URL into a valid namespace string
 */
const serializeNamespace = (url) => {
  return url.replace(/[^a-zA-Z0-9_-]/g, '_');
};

module.exports = {
  upsertEmbeddings,
  queryEmbeddings,
  serializeNamespace,
};
