const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/employees
// @desc    Get all employees (Admin can see all, HR can see employees)
// @access  Private (Admin/HR)
router.get('/', auth, authorize('admin', 'hr', 'subadmin'), async (req, res) => {
  try {
    let query = {};
    
    // Admin can see all users, HR and subadmin see only employees
    if (req.user.role === 'admin') {
      query = { role: { $in: ['subadmin', 'hr', 'employee'] } };
    } else {
      query = { role: 'employee' };
    }
    
    const employees = await User.find(query)
      .select('-password')
      .populate('approved_by', 'name email')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/employees/pending
// @desc    Get pending users for approval (Admin sees all, Subadmin sees employees only)
// @access  Private (Admin/Subadmin)
router.get('/pending', auth, authorize('admin', 'subadmin'), async (req, res) => {
  try {
    let query = { status: 'pending' };
    
    // Subadmin can only see pending employees
    if (req.user.role === 'subadmin') {
      query.role = 'employee';
    }
    
    const pendingUsers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // Employees can only view their own profile, Admin/HR can view any
    if (req.user.role === 'employee' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // Employees can only update their own profile (except role), Admin/HR can update any
    if (req.user.role === 'employee' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove role from update if user is not admin/hr
    if (req.user.role === 'employee' && req.body.role) {
      delete req.body.role;
    }

    // Don't allow password update through this route
    if (req.body.password) {
      delete req.body.password;
    }

    // Don't allow emp_id or email update (should be immutable)
    if (req.body.emp_id) {
      delete req.body.emp_id;
    }
    if (req.body.email) {
      // Only allow email update if admin/hr
      if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        delete req.body.email;
      } else if (req.body.email) {
        req.body.email = req.body.email.toLowerCase().trim();
      }
    }

    // Clean up the update data
    const updateData = { ...req.body };
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.department) updateData.department = updateData.department.trim();
    if (updateData.designation) updateData.designation = updateData.designation.trim();
    
    // Ensure bank_details is properly structured
    if (updateData.bank_details) {
      updateData.bank_details = {
        account_number: updateData.bank_details.account_number ? updateData.bank_details.account_number.trim() : '',
        bank_name: updateData.bank_details.bank_name ? updateData.bank_details.bank_name.trim() : '',
        ifsc_code: updateData.bank_details.ifsc_code ? updateData.bank_details.ifsc_code.trim() : '',
      };
    }

    const employee = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private (Admin/HR)
router.delete('/:id', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

