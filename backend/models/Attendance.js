const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    required: true,
    default: Date.now
  },
  punch_in: {
    type: Date,
    required: true
  },
  punch_out: {
    type: Date,
    default: null
  },
  work_hours: {
    type: Number,
    default: 0 // in hours
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'late'],
    default: 'present'
  },
  notes: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ user: 1, date: 1 });
attendanceSchema.index({ emp_id: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

