const mongoose = require('mongoose');
const { QUOTA_CATEGORIES } = require('../config/constants');

// FR25-FR28: seat pools, statutory %, waitlist, real-time fill dashboard
const quotaSchema = new mongoose.Schema(
  {
    classApplied: { type: String, required: true },
    fy: { type: String, required: true },
    category: { type: String, enum: QUOTA_CATEGORIES, required: true },
    totalSeats: { type: Number, required: true, default: 0 },
    statutoryPercent: { type: Number, default: 0 }, // e.g. RTE 25%
    filled: { type: Number, default: 0 },
    eligibilityRule: { type: String }, // human-readable description, e.g. income ceiling (FR26)
    waitlist: [
      {
        application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
        rank: Number,
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

quotaSchema.index({ classApplied: 1, fy: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Quota', quotaSchema);
