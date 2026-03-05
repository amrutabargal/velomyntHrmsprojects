const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();


const TRACKED_ROLES = ['employee', 'manager', 'hr', 'subadmin'];
const HALF_DAY_HOURS = Number(process.env.ATTENDANCE_HALF_DAY_HOURS || 4.5);
const LATE_AFTER_HOUR = Number(process.env.ATTENDANCE_LATE_AFTER_HOUR || 10);
const LATE_AFTER_MINUTE = Number(process.env.ATTENDANCE_LATE_AFTER_MINUTE || 15);

const canTrackAttendance = (role) => TRACKED_ROLES.includes(role);

const getDayBounds = (baseDate = new Date()) => {
  const dayStart = new Date(baseDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { dayStart, dayEnd };
};

const classifyStatus = (punchIn, workHours) => {
  if (workHours < HALF_DAY_HOURS) return 'half_day';
  const cutoff = new Date(punchIn);
  cutoff.setHours(LATE_AFTER_HOUR, LATE_AFTER_MINUTE, 0, 0);
  if (punchIn > cutoff) return 'late';
  return 'present';
};

// @route   POST /api/attendance/punch-in
// @desc    User punch in
// @access  Private (employee/manager/hr/subadmin)
router.post('/punch-in', auth, async (req, res) => {
  try {
    if (!canTrackAttendance(req.user.role)) {
      return res.status(403).json({ message: 'Your role is not allowed to punch in' });
    }

    const { dayStart, dayEnd } = getDayBounds();

    // Check if already punched in today
    const existingAttendance = await Attendance.findOne({
      user: req.user.id,
      date: {
        $gte: dayStart,
        $lt: dayEnd
      }
    });

    if (existingAttendance && existingAttendance.punch_in) {
      return res.status(400).json({ message: 'Already punched in today' });
    }

    const punchInTime = new Date();
    const attendance = new Attendance({
      emp_id: req.user.emp_id,
      user: req.user.id,
      date: dayStart,
      punch_in: punchInTime,
      status: 'present'
    });

    await attendance.save();

    res.status(201).json({
      message: 'Punched in successfully',
      attendance: {
        id: attendance._id,
        punch_in: attendance.punch_in,
        punch_out: attendance.punch_out,
        work_hours: attendance.work_hours,
        status: attendance.status,
        date: attendance.date
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error punching in' });
  }
});

// @route   POST /api/attendance/punch-out
// @desc    User punch out
// @access  Private (employee/manager/hr/subadmin)
router.post('/punch-out', auth, async (req, res) => {
  try {
    if (!canTrackAttendance(req.user.role)) {
      return res.status(403).json({ message: 'Your role is not allowed to punch out' });
    }

    const { dayStart, dayEnd } = getDayBounds();

    const attendance = await Attendance.findOne({
      user: req.user.id,
      date: {
        $gte: dayStart,
        $lt: dayEnd
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
    attendance.status = classifyStatus(attendance.punch_in, attendance.work_hours);

    await attendance.save();

    res.json({
      message: 'Punched out successfully',
      attendance: {
        id: attendance._id,
        punch_in: attendance.punch_in,
        punch_out: attendance.punch_out,
        work_hours: attendance.work_hours,
        status: attendance.status
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
    if (!canTrackAttendance(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view attendance' });
    }
    const { dayStart, dayEnd } = getDayBounds();

    const attendance = await Attendance.findOne({
      user: req.user.id,
      date: {
        $gte: dayStart,
        $lt: dayEnd
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
    if (!canTrackAttendance(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view attendance records' });
    }
    let query = {};

    // Employee -> own records, Manager -> team, HR/Subadmin -> all non-admin tracked users
    if (req.user.role === 'employee') {
      query.user = req.user.id;
    } else if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id, role: 'employee' }).select('_id');
      query.user = { $in: teamMembers.map((u) => u._id) };
    } else if (req.user.role === 'hr' || req.user.role === 'subadmin') {
      // No user filter means all attendance in date range (admin page already blocked at frontend)
    }

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

    if (!canTrackAttendance(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Access check by role
    if (req.user.role === 'employee' && attendance.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'manager') {
      const employee = await User.findById(attendance.user._id).select('manager');
      if (!employee || !employee.manager || employee.manager.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching attendance' });
  }
});

module.exports = router;

