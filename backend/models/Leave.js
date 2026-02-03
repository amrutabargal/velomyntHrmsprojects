const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
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
  leave_type: {
    type: String,
    enum: ['casual', 'sick', 'paid', 'unpaid'],
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  total_days: {
    type: Number,
    required: true,
    min: 0.5
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  applied_at: {
    type: Date,
    default: Date.now
  },
  approved_by_manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approved_by_hr: {
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
  leave_balance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 10 },
    paid: { type: Number, default: 15 }
  }
}, {
  timestamps: true
});

// Index for efficient queries
leaveSchema.index({ user: 1, start_date: 1, end_date: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ approved_by_manager: 1, status: 1 });

module.exports = mongoose.model('Leave', leaveSchema);

