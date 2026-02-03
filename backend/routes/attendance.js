const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/attendance/punch-in
// @desc    Employee punch in
// @access  Private (Employee)
router.post('/punch-in', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can punch in' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already punched in today
    const existingAttendance = await Attendance.findOne({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance && existingAttendance.punch_in) {
      return res.status(400).json({ message: 'Already punched in today' });
    }

    const attendance = new Attendance({
      emp_id: req.user.emp_id,
      user: req.user.id,
      date: today,
      punch_in: new Date(),
      status: 'present'
    });

    await attendance.save();

    res.status(201).json({
      message: 'Punched in successfully',
      attendance: {
        id: attendance._id,
        punch_in: attendance.punch_in,
        date: attendance.date
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error punching in' });
  }
});

// @route   POST /api/attendance/punch-out
// @desc    Employee punch out
// @access  Private (Employee)
router.post('/punch-out', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can punch out' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(400).json({ message: 'Please punch in first' });
    }

    if (attendance.punch_out) {
      return res.status(400).json({ message: 'Already punched out today' });
    }

    const punchOutTime = new Date();
    attendance.punch_out = punchOutTime;

    // Calculate work hours
    const workHours = (punchOutTime - attendance.punch_in) / (1000 * 60 * 60);
    attendance.work_hours = Math.round(workHours * 100) / 100;

    await attendance.save();

    res.json({
      message: 'Punched out successfully',
      attendance: {
        id: attendance._id,
        punch_in: attendance.punch_in,
        punch_out: attendance.punch_out,
        work_hours: attendance.work_hours
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error punching out' });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance status
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    res.json(attendance || null);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching attendance' });
  }
});

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // Employee can only see own records
    if (req.user.role === 'employee') {
      query.user = req.user.id;
    }
    // Manager can see team records
    else if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id }).select('_id');
      query.user = { $in: teamMembers.map(u => u._id) };
    }
    // HR and Admin can see all
    // query remains empty

    const { startDate, endDate } = req.query;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('user', 'name emp_id email')
      .sort({ date: -1 })
      .limit(100);

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching attendance' });
  }
});

// @route   GET /api/attendance/:id
// @desc    Get single attendance record
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('user', 'name emp_id email');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check access
    if (req.user.role === 'employee' && attendance.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching attendance' });
  }
});

module.exports = router;

