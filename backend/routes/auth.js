const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (Admin/HR/Subadmin - for employee creation)
// @access  Private (Admin/HR/Subadmin)
router.post('/register', auth, async (req, res) => {
  try {
    // Check if user is admin, hr, or subadmin
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Not authorized to register users' });
    }

    const { emp_id, name, email, password, role, department, designation, bank_details } = req.body;

    // Validate required fields
    if (!emp_id || !name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields (emp_id, name, email, password)' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Admin can create any role, Subadmin can only create employees
    let allowedRole = role || 'employee';
    if (req.user.role === 'subadmin') {
      // Subadmin can only create employees
      allowedRole = 'employee';
    } else if (req.user.role === 'hr') {
      // HR can create employees only
      allowedRole = 'employee';
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { emp_id }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or employee ID already exists' });
    }

    // Create user with properly structured bank_details
    // Admin creates active users, Subadmin/HR create pending employees (needs admin approval)
    const userStatus = req.user.role === 'admin' ? 'active' : 'pending';
    const approvedBy = req.user.role === 'admin' ? req.user.id : null;
    const approvedAt = req.user.role === 'admin' ? new Date() : null;
    
    const newUser = new User({
      emp_id: emp_id.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: allowedRole,
      status: userStatus,
      approved_by: approvedBy,
      approved_at: approvedAt,
      department: department ? department.trim() : '',
      designation: designation ? designation.trim() : '',
      bank_details: bank_details ? {
        account_number: bank_details.account_number ? bank_details.account_number.trim() : '',
        bank_name: bank_details.bank_name ? bank_details.bank_name.trim() : '',
        ifsc_code: bank_details.ifsc_code ? bank_details.ifsc_code.trim() : '',
      } : {}
    });

    await newUser.save();

    const statusMessage = userStatus === 'active' 
      ? 'User registered successfully' 
      : 'Employee registered successfully! Approval pending from admin.';

    res.status(201).json({
      message: statusMessage,
      user: {
        id: newUser._id,
        emp_id: newUser.emp_id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        department: newUser.department,
        designation: newUser.designation
      }
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field === 'email' ? 'Email' : 'Employee ID'} already exists` });
    }
    res.status(500).json({ message: error.message || 'Error registering user' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is approved (admin can always login)
    if (user.role !== 'admin' && user.status !== 'active') {
      return res.status(403).json({ 
        message: 'Your account is pending approval. Please wait for admin approval.' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        emp_id: user.emp_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error during login' });
  }
});

// @route   POST /api/auth/register-public
// @desc    Public registration (creates subadmin with pending status)
// @access  Public
router.post('/register-public', async (req, res) => {
  try {
    const { emp_id, name, email, password, department, designation, bank_details } = req.body;

    // Validate required fields
    if (!emp_id || !name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields (emp_id, name, email, password)' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { emp_id }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or employee ID already exists' });
    }

    // Create user as subadmin with pending status
    const user = new User({
      emp_id: emp_id.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'subadmin',
      status: 'pending',
      department: department ? department.trim() : '',
      designation: designation ? designation.trim() : '',
      bank_details: bank_details ? {
        account_number: bank_details.account_number ? bank_details.account_number.trim() : '',
        bank_name: bank_details.bank_name ? bank_details.bank_name.trim() : '',
        ifsc_code: bank_details.ifsc_code ? bank_details.ifsc_code.trim() : '',
      } : {}
    });

    await user.save();

    res.status(201).json({
      message: 'Registration successful! Your account is pending approval from admin.',
      user: {
        id: user._id,
        emp_id: user.emp_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field === 'email' ? 'Email' : 'Employee ID'} already exists` });
    }
    res.status(500).json({ message: error.message || 'Error registering user' });
  }
});

// @route   POST /api/auth/approve/:id
// @desc    Approve pending user (Admin approves all, Subadmin approves employees only)
// @access  Private (Admin/Subadmin)
router.post('/approve/:id', auth, async (req, res) => {
  try {
    // Admin can approve all, Subadmin can only approve employees
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Not authorized to approve users' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ message: 'User is already approved' });
    }

    // Subadmin can only approve employees
    if (req.user.role === 'subadmin' && user.role !== 'employee') {
      return res.status(403).json({ message: 'Subadmin can only approve employee requests' });
    }

    // Update user status and approval info
    user.status = 'active';
    user.approved_by = req.user.id;
    user.approved_at = new Date();

    await user.save();

    res.json({
      message: 'User approved successfully',
      user: {
        id: user._id,
        emp_id: user.emp_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error approving user' });
  }
});

// @route   POST /api/auth/change-role/:id
// @desc    Change user role (Admin only - can change any role)
// @access  Private (Admin)
router.post('/change-role/:id', auth, async (req, res) => {
  try {
    // Only admin can change roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can change user roles' });
    }

    const { role } = req.body;
    const allowedRoles = ['subadmin', 'hr', 'employee', 'manager'];
    
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Allowed: subadmin, hr, employee, manager' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot change admin role
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot change admin role' });
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      message: 'User role changed successfully',
      user: {
        id: targetUser._id,
        emp_id: targetUser.emp_id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error changing user role' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching user' });
  }
});

module.exports = router;
