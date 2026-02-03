const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['leave_approved', 'leave_rejected', 'timesheet_pending', 'payroll_generated', 'attendance_alert', 'system_alert'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  related_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null // Can reference Leave, Timesheet, Salary, etc.
  },
  related_type: {
    type: String,
    enum: ['leave', 'timesheet', 'salary', 'attendance', 'system'],
    default: null
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, is_read: 1 });
notificationSchema.index({ user: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

