const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'GEMINI_API_KEY',
  'GITHUB_PERSONAL_ACCESS_TOKEN',
  'ASSEMBLYAI_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_INDEX',
];

const optionalEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️ Missing required environment variables in server/.env:\n  ${missing.join('\n  ')}`);
    console.warn('⚠️ Please copy server/.env.example to server/.env and provide your API keys to enable full functionality.\n');
  }

  const missingOptional = optionalEnvVars.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`⚠️ Missing optional environment variables:\n  ${missingOptional.join('\n  ')}`);
  }
};

module.exports = validateEnv;
