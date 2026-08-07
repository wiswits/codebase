const mongoose = require('mongoose');
const { DOCUMENT_STATUSES } = require('../config/constants');

// One row per required document per application (FR11-FR13)
const applicationDocumentSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    docType: { type: String, required: true },
    fileName: String,
    filePath: String, // local path or Cloudinary URL depending on STORAGE_DRIVER
    mimeType: String,
    status: { type: String, enum: DOCUMENT_STATUSES, default: 'Pending' },
    rejectionReason: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedOn: Date,
  },
  { timestamps: true }
);

applicationDocumentSchema.index({ application: 1, docType: 1 }, { unique: true });

module.exports = mongoose.model('ApplicationDocument', applicationDocumentSchema);
