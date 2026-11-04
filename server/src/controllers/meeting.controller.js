const { Readable } = require('stream');
const Project = require('../models/Project');
const Meeting = require('../models/Meeting');
const Issue = require('../models/Issue');
const { transcribeMeeting, askMeeting } = require('../services/assembly.service');
const cloudinary = require('../config/cloudinary');

// Helper: stream upload buffer to Cloudinary using chunked upload for large files
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_chunked_stream(
      {
        chunk_size: 20 * 1024 * 1024,
        ...options,
      },
      (error, result) => {
        if (error) {
          const err = new Error(error.message || 'Cloudinary upload failed');
          err.http_code = error.http_code;
          return reject(err);
        }
        resolve(result);
      }
    );
    stream.on('error', (err) => reject(err));
    Readable.from(buffer).pipe(stream);
  });
};

// @desc    Upload an audio file from system and process meeting
// @route   POST /api/projects/:id/meetings/upload
const uploadMeeting = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an audio file to upload',
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'video',
      folder: `dionysus/meetings/${req.params.id}`,
      public_id: `meeting_${Date.now()}`,
    });

    const audioUrl = cloudinaryResult.secure_url;
    const summaries = await transcribeMeeting(audioUrl);

    if (!summaries || !summaries.length) {
      return res.status(400).json({
        success: false,
        message: 'No meeting content found in the audio',
      });
    }

    const customName = req.body.name?.trim();
    const originalBaseName = req.file.originalname?.replace(/\.[^/.]+$/, '');
    const meetingName = customName || summaries[0]?.gist || originalBaseName || 'Uploaded Meeting';

    const meeting = await Meeting.create({
      name: meetingName,
      url: audioUrl,
      project: project._id,
    });

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
  uploadMeeting,
  getMeetings,
  getMeeting,
  deleteMeeting,
  askIssue,
};
