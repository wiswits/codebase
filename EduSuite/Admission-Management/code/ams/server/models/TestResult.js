const mongoose = require('mongoose');

// FR15-FR17: bulk-uploaded marks, auto-computed rank/percentile per class & quota category
const testResultSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'EntranceTest', required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    rollNo: String,
    marksObtained: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    percentile: Number,
    rankOverall: Number,
    rankInCategory: Number,
    belowCutoff: { type: Boolean, default: false }, // FR17
    cutoffOverride: { type: Boolean, default: false }, // manual override of below-cutoff flag
    overrideReason: String,
  },
  { timestamps: true }
);

testResultSchema.index({ test: 1, application: 1 }, { unique: true });

module.exports = mongoose.model('TestResult', testResultSchema);
