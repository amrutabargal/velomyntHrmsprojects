const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const COMPANY_CONFIG = require('../config/company');
const { generateNumericOtp, hashOtp, verifyOtp } = require('../utils/adminOtp');
const { sendMail } = require('../utils/mailer');
const { adminRegistrationOtpEmail } = require('../utils/emailTemplates');
const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

async function getAdminRecipientEmail() {
  const admin = await User.findOne({ role: 'admin', status: 'active' }).select('email');
  return (
    admin?.email ||
    process.env.ADMIN_EMAIL ||
    COMPANY_CONFIG?.email ||
    null
  );
}

async function issueAndEmailAdminOtp({ pendingUser }) {
  const otp = generateNumericOtp(6);
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  pendingUser.admin_otp_hash = otpHash;
  pendingUser.admin_otp_expires_at = expiresAt;
  await pendingUser.save();

  const to = await getAdminRecipientEmail();
  if (!to) {
    const err = new Error('Admin email is not configured (set ADMIN_EMAIL or create an active admin user with an email)');
    err.code = 'ADMIN_EMAIL_NOT_CONFIGURED';
    throw err;
  }

  const { subject, text, html } = adminRegistrationOtpEmail({ otp, newUser: pendingUser });
  await sendMail({ to, subject, text, html });

  return { otpSent: true, otpExpiresAt: expiresAt };
}

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
    // Admin creates active users, others create pending users (needs approval)
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

    let otpMeta = { otpSent: false };
    if (newUser.status === 'pending') {
      try {
        otpMeta = await issueAndEmailAdminOtp({ pendingUser: newUser });
      } catch (e) {
        // Don't block registration if SMTP isn't configured; approval can still be done manually.
        otpMeta = { otpSent: false, otpError: e.code || 'OTP_EMAIL_FAILED' };
      }
    }

    const statusMessage = userStatus === 'active' 
      ? 'User registered successfully' 
      : 'Employee registered successfully! Approval pending from admin.';

    res.status(201).json({
      message: statusMessage,
      ...otpMeta,
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
    const { emp_id, name, email, password, role, department, designation, bank_details } = req.body;

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

    // Public registration: allow roles including admin
    const allowedPublicRoles = ['admin', 'subadmin', 'hr', 'employee', 'manager'];
    const selectedRole = role && allowedPublicRoles.includes(role) ? role : 'subadmin';

    // If no admin exists yet and user is registering as admin, auto-activate
    const existingAdmin = await User.exists({ role: 'admin' });
    const userStatus = !existingAdmin && selectedRole === 'admin' ? 'active' : 'pending';

    // Create user
    const user = new User({
      emp_id: emp_id.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: selectedRole,
      status: userStatus,
      department: department ? department.trim() : '',
      designation: designation ? designation.trim() : '',
      bank_details: bank_details ? {
        account_number: bank_details.account_number ? bank_details.account_number.trim() : '',
        bank_name: bank_details.bank_name ? bank_details.bank_name.trim() : '',
        ifsc_code: bank_details.ifsc_code ? bank_details.ifsc_code.trim() : '',
      } : {}
    });

    await user.save();

    let otpMeta = { otpSent: false };
    // Only send OTP if user is pending (i.e. not the very first auto-activated admin)
    if (user.status === 'pending') {
      try {
        otpMeta = await issueAndEmailAdminOtp({ pendingUser: user });
      } catch (e) {
        otpMeta = { otpSent: false, otpError: e.code || 'OTP_EMAIL_FAILED' };
      }
    }

    const message =
      user.status === 'active'
        ? 'Registration successful! Admin account is active. You can login now.'
        : 'Registration successful! Your account is pending approval from admin.';

    res.status(201).json({
      message,
      ...otpMeta,
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

    // Admin OTP validation (extra authentication for approval)
    if (req.user.role === 'admin') {
      const { otp } = req.body;
      if (!otp) {
        return res.status(400).json({ message: 'OTP is required for admin approval' });
      }
      if (!user.admin_otp_hash || !user.admin_otp_expires_at) {
        return res.status(400).json({ message: 'OTP is not generated for this user (please resend OTP)' });
      }
      if (new Date() > new Date(user.admin_otp_expires_at)) {
        return res.status(400).json({ message: 'OTP expired (please resend OTP)' });
      }
      const ok = await verifyOtp(otp, user.admin_otp_hash);
      if (!ok) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
    }

    // Update user status and approval info
    user.status = 'active';
    user.approved_by = req.user.id;
    user.approved_at = new Date();
    // clear otp after approval
    user.admin_otp_hash = null;
    user.admin_otp_expires_at = null;

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

// @route   POST /api/auth/resend-admin-otp/:id
// @desc    Resend admin OTP for a pending user (Admin only)
// @access  Private (Admin)
router.post('/resend-admin-otp/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can resend OTP' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'OTP can be resent only for pending users' });
    }

    const meta = await issueAndEmailAdminOtp({ pendingUser: user });
    res.json({ message: 'OTP sent to admin email', ...meta });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error resending OTP' });
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
