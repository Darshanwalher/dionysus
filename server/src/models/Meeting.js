const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Meeting name is required'],
    },
    url: {
      type: String,
      required: [true, 'Meeting audio URL is required'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for issues
meetingSchema.virtual('issues', {
  ref: 'Issue',
  localField: '_id',
  foreignField: 'meeting',
});

module.exports = mongoose.model('Meeting', meetingSchema);
