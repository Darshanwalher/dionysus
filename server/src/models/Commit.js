const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema(
  {
    commitMessage: {
      type: String,
      required: true,
    },
    commitHash: {
      type: String,
      required: true,
    },
    commitAuthorName: {
      type: String,
      default: '',
    },
    commitAuthorAvatar: {
      type: String,
      default: '',
    },
    commitDate: {
      type: Date,
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate commits per project
commitSchema.index({ commitHash: 1, project: 1 }, { unique: true });

module.exports = mongoose.model('Commit', commitSchema);
