const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['company-policy', 'hr-policy', 'leave-policy', 'code-of-conduct', 'nda', 'offer-letter', 'salary-slip', 'appointment-letter', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['policy', 'hr', 'legal', 'employee', 'financial'],
    required: true
  },
  file: {
    name: String,
    url: {
      type: String,
      required: true
    },
    size: Number,
    mimeType: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    name: String,
    url: String,
    size: Number,
    uploadedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  accessRoles: [{
    type: String,
    enum: ['admin', 'hr', 'manager', 'employee']
  }],
  tags: [String],
  expiresAt: Date
}, {
  timestamps: true
});

documentSchema.index({ type: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Document', documentSchema);