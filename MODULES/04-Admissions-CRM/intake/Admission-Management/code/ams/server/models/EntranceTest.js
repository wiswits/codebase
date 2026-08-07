const mongoose = require('mongoose');

// FR14: Create test (class, subjects, max marks, date, venue)
const entranceTestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    classApplied: { type: String, required: true },
    subjects: [{ type: String }],
    maxMarks: { type: Number, required: true, default: 100 },
    date: { type: Date, required: true },
    venue: { type: String },
    cutoff: { type: Number, default: 0 }, // FR17
    fy: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EntranceTest', entranceTestSchema);
