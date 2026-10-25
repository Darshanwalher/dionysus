const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
    gist: {
      type: String,
      required: true,
    },
    headline: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Issue', issueSchema);
