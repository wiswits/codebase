const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    panelist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scores: { type: Map, of: Number }, // rubric parameter -> score (1-10)
    average: Number,
    remarks: String,
    scoredAt: Date,
  },
  { _id: false }
);

// FR18-FR21: interview booking; FR20 panel scoring aggregation
const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSlot', required: true },
    rubric: [{ type: String }], // configurable rubric parameters
    panelScores: [scoreSchema],
    aggregateScore: Number, // avg of panelist averages (or weighted, see aggregationMethod)
    aggregationMethod: { type: String, enum: ['average', 'weighted'], default: 'average' },
    recommendation: { type: String, enum: ['Selected', 'Waitlisted', 'Rejected', 'Pending'], default: 'Pending' },
    status: { type: String, enum: ['Scheduled', 'Completed', 'No-show', 'Rescheduled'], default: 'Scheduled' },
    noShowCount: { type: Number, default: 0 }, // FR21
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
