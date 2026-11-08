const mongoose = require('mongoose');

const wikiPageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    markdownContent: {
      type: String,
      required: true,
    },
    referencedFiles: [
      {
        type: String,
      },
    ],
    isGenerated: {
      type: Boolean,
      default: true,
    },
    lastGeneratedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

wikiPageSchema.index({ project: 1, slug: 1 }, { unique: true });
wikiPageSchema.index({ project: 1, order: 1 });

module.exports = mongoose.model('WikiPage', wikiPageSchema);

