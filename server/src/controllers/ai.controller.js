const Project = require('../models/Project');
const Question = require('../models/Question');
const { getEmbeddings, askCodebase } = require('../services/openai.service');
const { queryEmbeddings, serializeNamespace } = require('../services/vector.service');

// @desc    Ask a question about the codebase
// @route   POST /api/projects/:id/ask
const askQuestion = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a question',
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub URL linked to this project',
      });
    }

    // Query vector DB for relevant context
    const namespace = serializeNamespace(project.githubUrl);
    const queryVector = await getEmbeddings(question);
    const matches = await queryEmbeddings(namespace, queryVector, 10);

    let context = '';
    for (const match of matches) {
      context += `source:${match.metadata.source}\ncode content:${match.metadata.code}\nsummary of file:${match.metadata.summary}\n\n`;
    }

    // Ask OpenAI with context
    const answer = await askCodebase(question, context);

    // Save Q&A to DB
    const savedQuestion = await Question.create({
      question,
      answer,
      project: project._id,
      user: req.user._id,
    });

    res.json({
      success: true,
      data: savedQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all questions for a project
// @route   GET /api/projects/:id/questions
const getQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find({ project: req.params.id })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { askQuestion, getQuestions, deleteQuestion };
