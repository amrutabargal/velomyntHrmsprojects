const express = require('express');
const Salary = require('../models/Salary');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const generatePayslipPDF = require('../utils/generatePayslip');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// @route   POST /api/payslip/generate/:salaryId
// @desc    Generate payslip PDF
// @access  Private (Admin/HR/Subadmin)
router.post('/generate/:salaryId', auth, authorize('admin', 'hr', 'subadmin'), async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.salaryId);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    const employee = await User.findOne({ emp_id: salary.emp_id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Generate PDF
    const pdfPath = await generatePayslipPDF(salary, employee);

    // Update salary record with PDF path
    salary.payslip_pdf = pdfPath;
    salary.status = 'approved';
    await salary.save();

    res.json({
      message: 'Payslip generated successfully',
      payslip_url: pdfPath,
      salary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/payslip/download/:salaryId
// @desc    Download payslip PDF
// @access  Private
router.get('/download/:salaryId', auth, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'hr', 'subadmin', 'employee'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const salary = await Salary.findById(req.params.salaryId);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    // Employees can only download their own payslips
    if (req.user.role === 'employee' && salary.emp_id !== req.user.emp_id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!salary.payslip_pdf) {
      return res.status(404).json({ message: 'Payslip not generated yet' });
    }

    const filePath = path.join(__dirname, '..', salary.payslip_pdf);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Payslip file not found' });
    }

    res.download(filePath, (err) => {
      if (err) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/payslip/:salaryId
// @desc    Get payslip info
// @access  Private
router.get('/:salaryId', auth, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'hr', 'subadmin', 'employee'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const Salary = require('../models/Salary');
    const User = require('../models/User');
    
    const salary = await Salary.findById(req.params.salaryId);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    // Employees can only view their own payslip
    if (req.user.role === 'employee' && salary.emp_id !== req.user.emp_id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Populate employee data
    const employee = await User.findOne({ emp_id: salary.emp_id }).select('name email emp_id');
    const salaryWithEmployee = {
      ...salary.toObject(),
      emp_id: employee ? {
        name: employee.name,
        email: employee.email,
        emp_id: employee.emp_id
      } : { name: 'N/A', email: 'N/A', emp_id: salary.emp_id }
    };

    res.json(salaryWithEmployee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

