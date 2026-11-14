const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    sender: {
      type: {
        type: String,
        enum: ['user', 'ai', 'system'],
        default: 'user',
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      name: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
        default: '',
      },
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    taggedFiles: [
      {
        type: String,
        trim: true,
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage',
      default: null,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Compound index for fast cursor pagination
chatMessageSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
