const mongoose = require('mongoose');

const productivitySchema = new mongoose.Schema({
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
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  tasksAssigned: {
    type: Number,
    default: 0
  },
  tasksInProgress: {
    type: Number,
    default: 0
  },
  tasksOverdue: {
    type: Number,
    default: 0
  },
  efficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  focusTime: {
    type: Number,
    default: 0
  },
  breakTime: {
    type: Number,
    default: 0
  },
  idleTime: {
    type: Number,
    default: 0
  },
  activeTime: {
    type: Number,
    default: 0
  },
  metrics: {
    attendance: Number,
    taskCompletion: Number,
    quality: Number,
    speed: Number
  },
  weeklyTrend: [{
    day: String,
    score: Number
  }],
  monthlyTrend: [{
    week: Number,
    score: Number
  }]
}, {
  timestamps: true
});

productivitySchema.index({ employee: 1, date: -1 });
productivitySchema.index({ date: -1 });

module.exports = mongoose.model('Productivity', productivitySchema);