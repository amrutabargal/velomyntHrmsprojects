const express = require('express');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Timesheet = require('../models/Timesheet');
const Salary = require('../models/Salary');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/reports/attendance
// @desc    Get attendance report
// @access  Private (Manager/HR/Admin)
router.get('/attendance', auth, authorize('manager', 'hr', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate, emp_id } = req.query;

    let query = {};

    // Manager can only see team reports
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id }).select('_id emp_id');
      query.user = { $in: teamMembers.map(u => u._id) };
    }

    if (emp_id) {
      const user = await User.findOne({ emp_id });
      if (user) {
        query.user = user._id;
      }
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('user', 'name emp_id email department')
      .sort({ date: -1 });

    // Calculate summary
    const summary = {
      total_days: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      half_day: attendance.filter(a => a.status === 'half_day').length,
      late: attendance.filter(a => a.status === 'late').length,
      total_hours: attendance.reduce((sum, a) => sum + (a.work_hours || 0), 0)
    };

    res.json({
      attendance,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error generating attendance report' });
  }
});

// @route   GET /api/reports/leave
// @desc    Get leave report
// @access  Private (Manager/HR/Admin)
router.get('/leave', auth, authorize('manager', 'hr', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate, emp_id, leave_type } = req.query;

    let query = {};

    // Manager can only see team reports
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id }).select('_id emp_id');
      query.user = { $in: teamMembers.map(u => u._id) };
    }

    if (emp_id) {
      const user = await User.findOne({ emp_id });
      if (user) {
        query.user = user._id;
      }
    }

    if (startDate && endDate) {
      query.start_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (leave_type) {
      query.leave_type = leave_type;
    }

    const leaves = await Leave.find(query)
      .populate('user', 'name emp_id email department')
      .sort({ start_date: -1 });

    // Calculate summary
    const summary = {
      total_applications: leaves.length,
      approved: leaves.filter(l => l.status === 'approved').length,
      pending: leaves.filter(l => l.status === 'pending').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
      total_days: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.total_days, 0),
      by_type: {
        casual: leaves.filter(l => l.leave_type === 'casual' && l.status === 'approved').reduce((sum, l) => sum + l.total_days, 0),
        sick: leaves.filter(l => l.leave_type === 'sick' && l.status === 'approved').reduce((sum, l) => sum + l.total_days, 0),
        paid: leaves.filter(l => l.leave_type === 'paid' && l.status === 'approved').reduce((sum, l) => sum + l.total_days, 0)
      }
    };

    res.json({
      leaves,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error generating leave report' });
  }
});

// @route   GET /api/reports/timesheet
// @desc    Get timesheet report
// @access  Private (Manager/HR/Admin)
router.get('/timesheet', auth, authorize('manager', 'hr', 'admin'), async (req, res) => {
  try {
    const { startDate, endDate, emp_id, status } = req.query;

    let query = {};

    // Manager can only see team reports
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id }).select('_id emp_id');
      query.user = { $in: teamMembers.map(u => u._id) };
    }

    if (emp_id) {
      const user = await User.findOne({ emp_id });
      if (user) {
        query.user = user._id;
      }
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) {
      query.status = status;
    }

    const timesheets = await Timesheet.find(query)
      .populate('user', 'name emp_id email department')
      .populate('approved_by', 'name')
      .sort({ date: -1 });

    // Calculate summary
    const summary = {
      total_entries: timesheets.length,
      approved: timesheets.filter(t => t.status === 'approved').length,
      pending: timesheets.filter(t => t.status === 'submitted').length,
      rejected: timesheets.filter(t => t.status === 'rejected').length,
      total_hours: timesheets.filter(t => t.status === 'approved').reduce((sum, t) => sum + (t.hours_worked || 0), 0)
    };

    res.json({
      timesheets,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error generating timesheet report' });
  }
});

// @route   GET /api/reports/payroll
// @desc    Get payroll report
// @access  Private (HR/Admin)
router.get('/payroll', auth, authorize('hr', 'admin'), async (req, res) => {
  try {
    const { month, year, emp_id } = req.query;

    let query = {};

    if (month) query.month = month;
    if (year) query.year = parseInt(year);
    if (emp_id) query.emp_id = emp_id;

    const salaries = await Salary.find(query)
      .populate('emp_id', 'name email department')
      .sort({ year: -1, month: -1 });

    // Calculate summary
    const summary = {
      total_records: salaries.length,
      total_gross: salaries.reduce((sum, s) => sum + (s.gross_salary || 0), 0),
      total_net: salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0),
      total_deductions: salaries.reduce((sum, s) => sum + (s.deductions || 0), 0),
      by_status: {
        pending: salaries.filter(s => s.status === 'pending').length,
        approved: salaries.filter(s => s.status === 'approved').length,
        paid: salaries.filter(s => s.status === 'paid').length
      }
    };

    res.json({
      salaries,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error generating payroll report' });
  }
});

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    let employeeQuery = {};
    let attendanceQuery = {};
    let leaveQuery = {};
    let timesheetQuery = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      employeeQuery._id = req.user.id;
      attendanceQuery.user = req.user.id;
      leaveQuery.user = req.user.id;
      timesheetQuery.user = req.user.id;
    } else if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id }).select('_id');
      const teamIds = teamMembers.map(u => u._id);
      employeeQuery._id = { $in: teamIds };
      attendanceQuery.user = { $in: teamIds };
      leaveQuery.user = { $in: teamIds };
      timesheetQuery.user = { $in: teamIds };
    }

    const [
      totalEmployees,
      todayAttendance,
      pendingLeaves,
      pendingTimesheets,
      totalSalaries
    ] = await Promise.all([
      User.countDocuments(employeeQuery),
      Attendance.countDocuments({ ...attendanceQuery, date: new Date().setHours(0, 0, 0, 0) }),
      Leave.countDocuments({ ...leaveQuery, status: 'pending' }),
      Timesheet.countDocuments({ ...timesheetQuery, status: 'submitted' }),
      Salary.countDocuments()
    ]);

    res.json({
      totalEmployees,
      todayAttendance,
      pendingLeaves,
      pendingTimesheets,
      totalSalaries
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching dashboard stats' });
  }
});

module.exports = router;

