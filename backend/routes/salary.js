const express = require('express');
const Salary = require('../models/Salary');
const User = require('../models/User');
const Leave = require('../models/Leave');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Helper function to get month number
const getMonthNumber = (monthName) => {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  return months[monthName] || 0;
};

// @route   POST /api/salary
// @desc    Create salary record
// @access  Private (Admin/HR/Subadmin)
router.post('/', auth, authorize('admin', 'hr', 'subadmin'), async (req, res) => {
  try {
    const {
      emp_id,
      month,
      year,
      basic,
      hra,
      da,
      pf,
      tax,
      allowances,
      deductions
    } = req.body;

    // Check if employee exists
    const employee = await User.findOne({ emp_id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate leave deduction for the month
    const monthStart = new Date(year, getMonthNumber(month), 1);
    const monthEnd = new Date(year, getMonthNumber(month) + 1, 0);
    
    const unpaidLeaves = await Leave.find({
      emp_id,
      status: 'approved',
      start_date: { $lte: monthEnd },
      end_date: { $gte: monthStart },
      leave_type: 'unpaid'
    });
    
    const leaveDays = unpaidLeaves.reduce((sum, leave) => {
      const overlapStart = new Date(Math.max(leave.start_date.getTime(), monthStart.getTime()));
      const overlapEnd = new Date(Math.min(leave.end_date.getTime(), monthEnd.getTime()));
      const days = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0);
    
    const dailySalary = basic / 30; // Assuming 30 days per month
    const leave_deduction = leaveDays * dailySalary;

    // Calculate salaries
    const gross_salary = basic + hra + da + allowances;
    const total_deductions = pf + tax + deductions + leave_deduction;
    const net_salary = gross_salary - total_deductions;

    // Check if salary for this month already exists
    const existingSalary = await Salary.findOne({ emp_id, month, year });
    if (existingSalary) {
      return res.status(400).json({ message: 'Salary for this month already exists' });
    }

    const salary = new Salary({
      emp_id,
      month,
      year,
      basic,
      hra,
      da,
      pf,
      tax,
      allowances,
      deductions,
      leave_deduction,
      gross_salary,
      net_salary
    });

    await salary.save();
    res.status(201).json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/salary
// @desc    Get all salary records (Admin/HR) or own records (Employee)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Employees can only see their own salary records
    if (req.user.role === 'employee') {
      query.emp_id = req.user.emp_id;
      const salaries = await Salary.find(query).sort({ year: -1, month: -1 });
      // For employees, add user data manually
      const user = await User.findOne({ emp_id: req.user.emp_id });
      const salariesWithUser = salaries.map(salary => ({
        ...salary.toObject(),
        emp_id: {
          name: user.name,
          email: user.email,
          emp_id: user.emp_id
        }
      }));
      return res.json(salariesWithUser);
    }
    
    // For admin/hr, get all salaries and populate employee data
    const salaries = await Salary.find(query).sort({ year: -1, month: -1 });
    
    // Manually populate employee data since emp_id is string not ObjectId
    const salariesWithEmployees = await Promise.all(
      salaries.map(async (salary) => {
        const employee = await User.findOne({ emp_id: salary.emp_id }).select('name email emp_id');
        return {
          ...salary.toObject(),
          emp_id: employee ? {
            name: employee.name,
            email: employee.email,
            emp_id: employee.emp_id
          } : { name: 'N/A', email: 'N/A', emp_id: salary.emp_id }
        };
      })
    );
    
    res.json(salariesWithEmployees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/salary/:id
// @desc    Get salary by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    // Employees can only view their own salary
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

// @route   PUT /api/salary/:id
// @desc    Update salary record
// @access  Private (Admin/HR)
router.put('/:id', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const {
      basic,
      hra,
      da,
      pf,
      tax,
      allowances,
      deductions
    } = req.body;

    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    // Recalculate if salary components changed
    if (basic || hra || da || allowances || pf || tax || deductions) {
      const newBasic = basic !== undefined ? basic : salary.basic;
      const newHra = hra !== undefined ? hra : salary.hra;
      const newDa = da !== undefined ? da : salary.da;
      const newAllowances = allowances !== undefined ? allowances : salary.allowances;
      const newPf = pf !== undefined ? pf : salary.pf;
      const newTax = tax !== undefined ? tax : salary.tax;
      const newDeductions = deductions !== undefined ? deductions : salary.deductions;

      salary.gross_salary = newBasic + newHra + newDa + newAllowances;
      salary.net_salary = salary.gross_salary - newPf - newTax - newDeductions;
    }

    // Update other fields
    Object.assign(salary, req.body);
    await salary.save();

    res.json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/salary/:id
// @desc    Delete salary record
// @access  Private (Admin/HR/Subadmin)
router.delete('/:id', auth, authorize('admin', 'hr', 'subadmin'), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    res.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

