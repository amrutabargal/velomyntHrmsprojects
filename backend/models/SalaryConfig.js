const mongoose = require('mongoose');

const salaryConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    basic_ratio: { type: Number, default: 0.5, min: 0, max: 1 },
    hra_ratio: { type: Number, default: 0.2, min: 0, max: 1 },
    da_ratio: { type: Number, default: 0.1, min: 0, max: 1 },
    allowance_ratio: { type: Number, default: 0.2, min: 0, max: 1 },
    pf_rate_on_basic: { type: Number, default: 0.12, min: 0, max: 1 },
    tax_rate_on_gross: { type: Number, default: 0.05, min: 0, max: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalaryConfig', salaryConfigSchema);
