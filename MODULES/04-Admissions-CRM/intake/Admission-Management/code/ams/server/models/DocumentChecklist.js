const mongoose = require('mongoose');

// Configurable required-document checklist per class/board (FR10)
const documentChecklistSchema = new mongoose.Schema(
  {
    classApplied: { type: String, required: true },
    board: { type: String, default: 'Any' },
    requiredDocs: [{ type: String, required: true }],
  },
  { timestamps: true }
);

documentChecklistSchema.index({ classApplied: 1, board: 1 }, { unique: true });

module.exports = mongoose.model('DocumentChecklist', documentChecklistSchema);
