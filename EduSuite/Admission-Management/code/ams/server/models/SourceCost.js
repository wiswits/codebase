const mongoose = require('mongoose');

// FR32: manual cost input per source/campaign to compute cost-per-admission
const sourceCostSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    campaign: { type: String, default: 'Default' },
    fy: { type: String, required: true },
    cost: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

sourceCostSchema.index({ source: 1, campaign: 1, fy: 1 }, { unique: true });

module.exports = mongoose.model('SourceCost', sourceCostSchema);
