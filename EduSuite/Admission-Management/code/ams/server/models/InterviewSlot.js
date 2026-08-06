const mongoose = require('mongoose');

// FR18-FR21: generated slots (auto or manual), applicant self-select or admin-assign
const interviewSlotSchema = new mongoose.Schema(
  {
    classApplied: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // "10:00"
    endTime: { type: String, required: true },
    panel: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // panelists assigned
    panelLabel: String, // e.g. "Panel A"
    capacity: { type: Number, default: 1 },
    booked: { type: Number, default: 0 },
    fy: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewSlot', interviewSlotSchema);
