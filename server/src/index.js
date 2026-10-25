require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const validateEnv = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const githubRoutes = require('./routes/github.routes');
const aiRoutes = require('./routes/ai.routes');
const meetingRoutes = require('./routes/meeting.routes');

// Validate environment variables
validateEnv();

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/github', githubRoutes);
app.use('/api', aiRoutes);
app.use('/api', meetingRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();
