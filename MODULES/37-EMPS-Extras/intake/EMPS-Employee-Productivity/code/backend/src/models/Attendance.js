const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0)
  },
  checkIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    ip: String,
    deviceInfo: String
  },
  checkOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    ip: String,
    deviceInfo: String
  },
  lunchBreak: {
    start: Date,
    end: Date,
    duration: Number
  },
  workingHours: {
    scheduled: { type: Number, default: 8 },
    actual: Number,
    overtime: Number,
    breakTime: Number,
    totalHours: Number
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'],
    default: 'absent'
  },
  lateLogin: {
    isLate: Boolean,
    minutes: Number,
    reason: String
  },
  earlyLogout: {
    isEarly: Boolean,
    minutes: Number,
    reason: String
  },
  idleTime: {
    total: Number,
    details: [{
      start: Date,
      end: Date,
      duration: Number
    }]
  },
  manualCorrection: {
    isCorrected: Boolean,
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    corrections: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      correctedAt: Date
    }],
    correctedAt: Date
  },
  approval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    comments: String
  },
  notes: String
}, {
  timestamps: true
});

attendanceSchema.index({ employee: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);