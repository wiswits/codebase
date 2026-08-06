const mongoose = require('mongoose');
const { APPLICATION_STATUSES, SOURCES, QUOTA_CATEGORIES } = require('../config/constants');

const auditEntrySchema = new mongoose.Schema(
  {
    action: String,
    reason: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    meta: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    // Application number is only assigned on final submit (FR3/FR29), null while draft.
    applicationNo: { type: String, unique: true, sparse: true, index: true },
    fy: { type: String, required: true },

    // Draft resume support (FR2)
    draftToken: { type: String, unique: true, sparse: true, index: true },
    isDraft: { type: Boolean, default: true },
    currentStep: { type: Number, default: 1 },

    // Student / Parent / Address / Academic details captured across the multi-step form
    student: {
      name: String,
      dob: Date,
      gender: String,
      classAppliedFor: { type: String, required: true },
      board: String,
    },
    parent: {
      fatherName: String,
      motherName: String,
      guardianName: String,
      phone: String,
      email: String,
      occupation: String,
      annualIncome: String,
      address: String,
      sameAsFather: Boolean,
    },
    academic: {
      previousSchool: String,
      previousClass: String,
      lastPercentage: Number,
    },

    source: { type: String, enum: SOURCES },
    sourceDetail: String,
    sourceLocked: { type: Boolean, default: false }, // FR9
    sourceChangeLog: [auditEntrySchema],

    quotaCategory: { type: String, enum: QUOTA_CATEGORIES, default: 'General' }, // FR25
    quotaEligibility: {
      rteIncomeCertificateNo: String,
      siblingStudentId: String,
      staffEmployeeId: String,
      sportsAchievement: String,
    },

    status: { type: String, enum: APPLICATION_STATUSES, default: 'Draft' },
    enquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry' },
    counselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Test / Interview / Offer references
    testResult: { type: mongoose.Schema.Types.ObjectId, ref: 'TestResult' },
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },

    waitlistRank: { type: Number }, // FR27
    auditLog: [auditEntrySchema],

    submittedAt: Date,
  },
  { timestamps: true }
);

applicationSchema.index({ 'student.name': 'text', applicationNo: 'text' });
applicationSchema.index({ status: 1, fy: 1, 'student.classAppliedFor': 1 });

module.exports = mongoose.model('Application', applicationSchema);
