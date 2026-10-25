const Project = require('../models/Project');
const Meeting = require('../models/Meeting');
const Issue = require('../models/Issue');
const { transcribeMeeting, askMeeting } = require('../services/assembly.service');

// @desc    Upload and process a meeting audio
// @route   POST /api/projects/:id/meetings
const processMeeting = async (req, res, next) => {
  try {
    const { audio_url } = req.body;

    if (!audio_url) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an audio URL',
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Transcribe meeting using AssemblyAI
    const summaries = await transcribeMeeting(audio_url);

    if (!summaries.length) {
      return res.status(400).json({
        success: false,
        message: 'No meeting content found in the audio',
      });
    }

    // Create meeting record
    const meeting = await Meeting.create({
      name: summaries[0].gist,
      url: audio_url,
      project: project._id,
    });

    // Create issue records for each chapter
    await Issue.insertMany(
      summaries.map((summary) => ({
        start: summary.start,
        end: summary.end,
        gist: summary.gist,
        headline: summary.headline,
        summary: summary.summary,
        meeting: meeting._id,
      }))
    );

    const populatedMeeting = await Meeting.findById(meeting._id).populate('issues');

    res.status(201).json({
      success: true,
      data: populatedMeeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all meetings for a project
// @route   GET /api/projects/:id/meetings
const getMeetings = async (req, res, next) => {
  try {
    const meetings = await Meeting.find({ project: req.params.id })
      .populate('issues')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single meeting with issues
// @route   GET /api/meetings/:id
const getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('issues');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    res.json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a meeting and its issues
// @route   DELETE /api/meetings/:id
const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // Delete associated issues
    await Issue.deleteMany({ meeting: meeting._id });
    await Meeting.findByIdAndDelete(meeting._id);

    res.json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ask a question about a meeting issue
// @route   POST /api/meetings/:id/issues/:issueId/ask
const askIssue = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a question',
      });
    }

    const issue = await Issue.findById(req.params.issueId).populate('meeting');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    const answer = await askMeeting(issue.meeting.url, query, issue.summary);

    res.json({
      success: true,
      data: { answer },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processMeeting,
  getMeetings,
  getMeeting,
  deleteMeeting,
  askIssue,
};
