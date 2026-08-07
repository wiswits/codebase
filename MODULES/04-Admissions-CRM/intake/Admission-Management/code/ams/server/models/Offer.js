const mongoose = require('mongoose');

// FR22-FR24: auto-generated offer letter, single-use expiring token, accept/reject
const offerSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
    token: { type: String, required: true, unique: true },
    tokenUsed: { type: Boolean, default: false },
    tokenAmount: Number,
    pdfPath: String,
    validTill: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Expired'], default: 'Pending' },
    decidedAt: Date,
    acceptanceHistory: [
      {
        action: String,
        at: { type: Date, default: Date.now },
        ip: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
