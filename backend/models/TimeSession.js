const mongoose = require('mongoose');

const timeSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startAt: { type: Date, required: true, default: Date.now },
  endAt: { type: Date, default: null },
  source: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  meta: {
    ip: { type: String },
    device: { type: String }
  }
}, {
  timestamps: true
});

timeSessionSchema.virtual('duration').get(function () {
  if (!this.endAt) return null;
  return (new Date(this.endAt) - new Date(this.startAt)) / 1000; // seconds
});

timeSessionSchema.index({ user: 1, startAt: 1 });

module.exports = mongoose.model('TimeSession', timeSessionSchema);
