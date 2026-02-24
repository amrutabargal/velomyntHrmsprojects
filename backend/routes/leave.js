const express = require('express');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Helper function to calculate days between dates
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// @route   POST /api/leave
// @desc    Apply for leave
// @access  Private (Employee)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can apply for leave' });
    }

    const { leave_type, start_date, end_date, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const totalDays = calculateDays(startDate, endDate);

    // Check leave balance
    const user = await User.findById(req.user.id);
    const leaveBalance = user.leave_balance || {
      casual: 12,
      sick: 10,
      paid: 15
    };

    if (leaveBalance[leave_type] < totalDays) {
      return res.status(400).json({ 
        message: `Insufficient leave balance. Available: ${leaveBalance[leave_type]} days` 
      });
    }

    const leave = new Leave({
      emp_id: req.user.emp_id,
      user: req.user.id,
      leave_type,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      reason,
      leave_balance: leaveBalance
    });

    await leave.save();

    // Create notification for manager
    if (user.manager) {
      await Notification.create({
        user: user.manager,
        type: 'leave_rejected', // Will be updated when approved
        title: 'Leave Request Pending',
        message: `${user.name} has applied for ${totalDays} days of ${leave_type} leave`,
        related_id: leave._id,
        related_type: 'leave'
      });
    }

    res.status(201).json({
      message: 'Leave application submitted successfully',
      leave
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error applying for leave' });
  }
});

// @route   GET /api/leave
// @desc    Get leave records
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

    const { status, leave_type } = req.query;
    if (status) {
      query.status = status;
    }
    if (leave_type) {
      query.leave_type = leave_type;
    }

    const leaves = await Leave.find(query)
      .populate('user', 'name emp_id email')
      .populate('approved_by_manager', 'name')
      .populate('approved_by_hr', 'name')
      .sort({ applied_at: -1 })
      .limit(100);

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching leaves' });
  }
});

// @route   GET /api/leave/balance
// @desc    Get leave balance
// @access  Private (Employee)
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Calculate used leaves
    const usedLeaves = await Leave.aggregate([
      {
        $match: {
          user: user._id,
          status: 'approved',
          leave_type: { $in: ['casual', 'sick', 'paid'] }
        }
      },
      {
        $group: {
          _id: '$leave_type',
          total: { $sum: '$total_days' }
        }
      }
    ]);

    const balance = {
      casual: (user.leave_balance?.casual || 12) - (usedLeaves.find(l => l._id === 'casual')?.total || 0),
      sick: (user.leave_balance?.sick || 10) - (usedLeaves.find(l => l._id === 'sick')?.total || 0),
      paid: (user.leave_balance?.paid || 15) - (usedLeaves.find(l => l._id === 'paid')?.total || 0)
    };

    res.json(balance);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching leave balance' });
  }
});

// @route   GET /api/leave/pending
// @desc    Get pending leave requests
// @access  Private (Manager/HR/Admin)
router.get('/pending', auth, authorize('manager', 'hr', 'admin', 'subadmin'), async (req, res) => {
  try {
    let query = { status: 'pending' };

    // Manager can only see team pending leaves
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id }).select('_id');
      query.user = { $in: teamMembers.map(u => u._id) };
    }

    const leaves = await Leave.find(query)
      .populate('user', 'name emp_id email department')
      .sort({ applied_at: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching pending leaves' });
  }
});

// @route   GET /api/leave/dashboard
// @desc    Get leave dashboard data (balance, recent leaves, pending counts)
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Calculate used leaves (approved)
    const usedLeaves = await Leave.aggregate([
      { $match: { user: user._id, status: 'approved', leave_type: { $in: ['casual', 'sick', 'paid'] } } },
      { $group: { _id: '$leave_type', total: { $sum: '$total_days' } } }
    ]);

    const balance = {
      casual: (user.leave_balance?.casual || 12) - (usedLeaves.find(l => l._id === 'casual')?.total || 0),
      sick: (user.leave_balance?.sick || 10) - (usedLeaves.find(l => l._id === 'sick')?.total || 0),
      paid: (user.leave_balance?.paid || 15) - (usedLeaves.find(l => l._id === 'paid')?.total || 0)
    };

    // Recent leaves for employee or team (if manager)
    let recentQuery = {};
    if (req.user.role === 'employee') {
      recentQuery.user = req.user.id;
    } else if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id }).select('_id');
      recentQuery.user = { $in: teamMembers.map(u => u._id) };
    }

    const recentLeaves = await Leave.find(recentQuery)
      .populate('user', 'name emp_id')
      .sort({ applied_at: -1 })
      .limit(10);

    // Pending counts (for manager/hr/admin)
    let pendingCount = 0;
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user.id }).select('_id');
      pendingCount = await Leave.countDocuments({ user: { $in: teamMembers.map(u => u._id) }, status: 'pending' });
    } else if (req.user.role === 'hr' || req.user.role === 'admin') {
      pendingCount = await Leave.countDocuments({ status: 'pending' });
    }

    res.json({
      balance,
      recentLeaves,
      pendingCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error building dashboard' });
  }
});

// @route   POST /api/leave/:id/approve
// @desc    Approve leave request
// @access  Private (Manager/HR/Admin)
router.post('/:id/approve', auth, authorize('manager', 'hr', 'admin', 'subadmin'), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('user');

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request is not pending' });
    }

    // Manager can only approve team members
    if (req.user.role === 'manager') {
      const teamMember = await User.findById(leave.user._id);
      if (teamMember.manager?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only approve your team members' });
      }
      leave.approved_by_manager = req.user.id;
      // Still needs HR approval
      leave.status = 'pending';
    } else {
      // HR/Admin can final approve
      if (leave.approved_by_manager) {
        leave.approved_by_hr = req.user.id;
      } else {
        leave.approved_by_manager = req.user.id;
      }
      leave.status = 'approved';
      leave.approved_at = new Date();

      // Deduct leave balance
      const user = await User.findById(leave.user._id);
      const leaveType = leave.leave_type;
      if (user.leave_balance && user.leave_balance[leaveType] !== undefined) {
        user.leave_balance[leaveType] = Math.max(0, user.leave_balance[leaveType] - leave.total_days);
        await user.save();
      }
    }

    await leave.save();

    // Create notification for employee
    await Notification.create({
      user: leave.user._id,
      type: 'leave_approved',
      title: 'Leave Approved',
      message: `Your ${leave.leave_type} leave request has been approved`,
      related_id: leave._id,
      related_type: 'leave'
    });

    res.json({
      message: 'Leave request approved successfully',
      leave
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error approving leave' });
  }
});

// @route   POST /api/leave/:id/reject
// @desc    Reject leave request
// @access  Private (Manager/HR/Admin)
router.post('/:id/reject', auth, authorize('manager', 'hr', 'admin', 'subadmin'), async (req, res) => {
  try {
    const { rejection_reason } = req.body;

    const leave = await Leave.findById(req.params.id)
      .populate('user');

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request is not pending' });
    }

    // Manager can only reject team members
    if (req.user.role === 'manager') {
      const teamMember = await User.findById(leave.user._id);
      if (teamMember.manager?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only reject your team members' });
      }
    }

    leave.status = 'rejected';
    leave.rejection_reason = rejection_reason || '';

    await leave.save();

    // Create notification for employee
    await Notification.create({
      user: leave.user._id,
      type: 'leave_rejected',
      title: 'Leave Rejected',
      message: `Your leave request has been rejected. Reason: ${rejection_reason || 'No reason provided'}`,
      related_id: leave._id,
      related_type: 'leave'
    });

    res.json({
      message: 'Leave request rejected successfully',
      leave
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error rejecting leave' });
  }
});

// @route   DELETE /api/leave/:id
// @desc    Cancel leave request (only if pending)
// @access  Private (Employee - own requests only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending leave requests' });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({ message: 'Leave request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error cancelling leave' });
  }
});

module.exports = router;

