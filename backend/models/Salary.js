const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  emp_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  basic: {
    type: Number,
    required: true
  },
  hra: {
    type: Number,
    default: 0
  },
  da: {
    type: Number,
    default: 0
  },
  pf: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  allowances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  leave_deduction: {
    type: Number,
    default: 0
  },
  gross_salary: {
    type: Number,
    required: true
  },
  net_salary: {
    type: Number,
    required: true
  },
  payslip_pdf: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Salary', salarySchema);

