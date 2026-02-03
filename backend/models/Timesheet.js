const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
  emp_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  task_description: {
    type: String,
    required: true
  },
  hours_worked: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  project_name: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  submitted_at: {
    type: Date,
    default: null
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approved_at: {
    type: Date,
    default: null
  },
  rejection_reason: {
    type: String,
    default: ''
  },
  week_start: {
    type: Date,
    required: true
  },
  week_end: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
timesheetSchema.index({ user: 1, date: 1 });
timesheetSchema.index({ user: 1, week_start: 1, week_end: 1 });
timesheetSchema.index({ status: 1 });

module.exports = mongoose.model('Timesheet', timesheetSchema);

