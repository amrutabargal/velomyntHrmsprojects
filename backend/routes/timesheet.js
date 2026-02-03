const express = require('express');
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Helper function to get week start and end dates
const getWeekDates = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
};

// @route   POST /api/timesheet
// @desc    Create timesheet entry
// @access  Private (Employee)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can create timesheet entries' });
    }

    const { date, task_description, hours_worked, project_name } = req.body;

    if (!date || !task_description || !hours_worked) {
      return res.status(400).json({ message: 'Please provide date, task description, and hours worked' });
    }

    const { weekStart, weekEnd } = getWeekDates(date);

    const timesheet = new Timesheet({
      emp_id: req.user.emp_id,
      user: req.user.id,
      date: new Date(date),
      task_description,
      hours_worked: parseFloat(hours_worked),
      project_name: project_name || '',
      week_start: weekStart,
      week_end: weekEnd,
      status: 'draft'
    });

    await timesheet.save();

    res.status(201).json({
      message: 'Timesheet entry created successfully',
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating timesheet' });
  }
});

// @route   PUT /api/timesheet/:id
// @desc    Update timesheet entry
// @access  Private (Employee - own entries only)
router.put('/:id', auth, async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check access
    if (req.user.role === 'employee' && timesheet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (timesheet.status === 'approved') {
      return res.status(400).json({ message: 'Cannot edit approved timesheet' });
    }

    const { task_description, hours_worked, project_name } = req.body;

    if (task_description) timesheet.task_description = task_description;
    if (hours_worked !== undefined) timesheet.hours_worked = parseFloat(hours_worked);
    if (project_name !== undefined) timesheet.project_name = project_name;

    await timesheet.save();

    res.json({
      message: 'Timesheet updated successfully',
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating timesheet' });
  }
});

// @route   POST /api/timesheet/:id/submit
// @desc    Submit timesheet for approval
// @access  Private (Employee)
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (timesheet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (timesheet.status !== 'draft') {
      return res.status(400).json({ message: 'Timesheet already submitted' });
    }

    timesheet.status = 'submitted';
    timesheet.submitted_at = new Date();

    await timesheet.save();

    // Create notification for manager
    const user = await User.findById(req.user.id);
    if (user.manager) {
      await Notification.create({
        user: user.manager,
        type: 'timesheet_pending',
        title: 'Timesheet Pending Approval',
        message: `${user.name} has submitted a timesheet for approval`,
        related_id: timesheet._id,
        related_type: 'timesheet'
      });
    }

    res.json({
      message: 'Timesheet submitted successfully',
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error submitting timesheet' });
  }
});

// @route   POST /api/timesheet/:id/approve
// @desc    Approve timesheet
// @access  Private (Manager/HR/Admin)
router.post('/:id/approve', auth, authorize('manager', 'hr', 'admin'), async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id)
      .populate('user');

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (timesheet.status !== 'submitted') {
      return res.status(400).json({ message: 'Timesheet is not submitted' });
    }

    // Manager can only approve team members
    if (req.user.role === 'manager') {
      const teamMember = await User.findById(timesheet.user._id);
      if (teamMember.manager?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only approve your team members' });
      }
    }

    timesheet.status = 'approved';
    timesheet.approved_by = req.user.id;
    timesheet.approved_at = new Date();

    await timesheet.save();

    // Create notification for employee
    await Notification.create({
      user: timesheet.user._id,
      type: 'timesheet_pending',
      title: 'Timesheet Approved',
      message: `Your timesheet has been approved by ${req.user.name}`,
      related_id: timesheet._id,
      related_type: 'timesheet'
    });

    res.json({
      message: 'Timesheet approved successfully',
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error approving timesheet' });
  }
});

// @route   POST /api/timesheet/:id/reject
// @desc    Reject timesheet
// @access  Private (Manager/HR/Admin)
router.post('/:id/reject', auth, authorize('manager', 'hr', 'admin'), async (req, res) => {
  try {
    const { rejection_reason } = req.body;

    const timesheet = await Timesheet.findById(req.params.id)
      .populate('user');

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (timesheet.status !== 'submitted') {
      return res.status(400).json({ message: 'Timesheet is not submitted' });
    }

    // Manager can only reject team members
    if (req.user.role === 'manager') {
      const teamMember = await User.findById(timesheet.user._id);
      if (teamMember.manager?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only reject your team members' });
      }
    }

    timesheet.status = 'rejected';
    timesheet.rejection_reason = rejection_reason || '';

    await timesheet.save();

    // Create notification for employee
    await Notification.create({
      user: timesheet.user._id,
      type: 'timesheet_pending',
      title: 'Timesheet Rejected',
      message: `Your timesheet has been rejected. Reason: ${rejection_reason || 'No reason provided'}`,
      related_id: timesheet._id,
      related_type: 'timesheet'
    });

    res.json({
      message: 'Timesheet rejected successfully',
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error rejecting timesheet' });
  }
});

// @route   GET /api/timesheet
// @desc    Get timesheet records
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

    const { startDate, endDate, status } = req.query;
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
      .populate('user', 'name emp_id email')
      .populate('approved_by', 'name')
      .sort({ date: -1 })
      .limit(100);

    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching timesheets' });
  }
});

// @route   GET /api/timesheet/pending
// @desc    Get pending timesheets for approval
// @access  Private (Manager/HR/Admin)
router.get('/pending', auth, authorize('manager', 'hr', 'admin'), async (req, res) => {
  try {
    let query = { status: 'submitted' };

    // Manager can only see team pending timesheets
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id }).select('_id');
      query.user = { $in: teamMembers.map(u => u._id) };
    }

    const timesheets = await Timesheet.find(query)
      .populate('user', 'name emp_id email')
      .sort({ submitted_at: -1 });

    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching pending timesheets' });
  }
});

// @route   DELETE /api/timesheet/:id
// @desc    Delete timesheet entry
// @access  Private (Employee - own entries only, if draft)
router.delete('/:id', auth, async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check access
    if (req.user.role === 'employee' && timesheet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (timesheet.status !== 'draft') {
      return res.status(400).json({ message: 'Can only delete draft timesheets' });
    }

    await timesheet.deleteOne();

    res.json({ message: 'Timesheet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting timesheet' });
  }
});

module.exports = router;

