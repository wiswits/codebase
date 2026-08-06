const mongoose = require('mongoose');
const { ENQUIRY_STAGES, SOURCES } = require('../config/constants');

const contactLogSchema = new mongoose.Schema(
  {
    note: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const enquirySchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    parentName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    classAppliedFor: { type: String, required: true },
    stage: { type: String, enum: ENQUIRY_STAGES, default: 'New' }, // FR5
    source: { type: String, enum: SOURCES, required: true }, // FR8
    sourceDetail: { type: String, trim: true },
    sourceLocked: { type: Boolean, default: false }, // FR9
    counselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // FR7
    contactLog: [contactLogSchema], // FR7
    lostReason: { type: String }, // FR6 - mandatory when stage moves to "Lost"
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    fy: { type: String, required: true },
  },
  { timestamps: true }
);

enquirySchema.index({ stage: 1, fy: 1 });
enquirySchema.index({ source: 1, fy: 1 });
enquirySchema.index({ studentName: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Enquiry', enquirySchema);
