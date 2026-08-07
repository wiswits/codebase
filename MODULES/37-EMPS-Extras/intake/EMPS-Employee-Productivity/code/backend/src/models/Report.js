const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'task-completion', 'performance', 'attendance', 'leave'],
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  dateRange: {
    start: Date,
    end: Date
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  summary: String,
  metrics: {
    totalEmployees: Number,
    presentEmployees: Number,
    absentEmployees: Number,
    tasksCompleted: Number,
    tasksPending: Number,
    leavesTaken: Number,
    productivity: Number
  },
  charts: [{
    type: String,
    data: mongoose.Schema.Types.Mixed,
    config: mongoose.Schema.Types.Mixed
  }],
  format: {
    type: String,
    enum: ['json', 'pdf', 'excel', 'csv'],
    default: 'json'
  },
  fileUrl: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

reportSchema.index({ type: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);