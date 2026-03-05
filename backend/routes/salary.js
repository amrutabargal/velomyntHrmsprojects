const express = require('express');
const Salary = require('../models/Salary');
const SalaryConfig = require('../models/SalaryConfig');
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

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min = 0, max = Number.POSITIVE_INFINITY) => {
  return Math.min(max, Math.max(min, value));
};

const DEFAULT_SALARY_CONFIG = {
  basic_ratio: 0.5,
  hra_ratio: 0.2,
  da_ratio: 0.1,
  allowance_ratio: 0.2,
  pf_rate_on_basic: 0.12,
  tax_rate_on_gross: 0.05,
};

const getSalaryConfig = async () => {
  const config = await SalaryConfig.findOne({ key: 'default' }).lean();
  if (!config) return DEFAULT_SALARY_CONFIG;
  return {
    basic_ratio: toNumber(config.basic_ratio, DEFAULT_SALARY_CONFIG.basic_ratio),
    hra_ratio: toNumber(config.hra_ratio, DEFAULT_SALARY_CONFIG.hra_ratio),
    da_ratio: toNumber(config.da_ratio, DEFAULT_SALARY_CONFIG.da_ratio),
    allowance_ratio: toNumber(config.allowance_ratio, DEFAULT_SALARY_CONFIG.allowance_ratio),
    pf_rate_on_basic: toNumber(config.pf_rate_on_basic, DEFAULT_SALARY_CONFIG.pf_rate_on_basic),
    tax_rate_on_gross: toNumber(config.tax_rate_on_gross, DEFAULT_SALARY_CONFIG.tax_rate_on_gross),
  };
};

const calculateLeaveDeduction = async (emp_id, month, year, basicSalary) => {
  const monthStart = new Date(year, getMonthNumber(month), 1);
  const monthEnd = new Date(year, getMonthNumber(month) + 1, 0);

  const unpaidLeaves = await Leave.find({
    emp_id,
    status: 'approved',
    start_date: { $lte: monthEnd },
    end_date: { $gte: monthStart },
    leave_type: 'unpaid',
  });

  const leaveDays = unpaidLeaves.reduce((sum, leave) => {
    const overlapStart = new Date(Math.max(leave.start_date.getTime(), monthStart.getTime()));
    const overlapEnd = new Date(Math.min(leave.end_date.getTime(), monthEnd.getTime()));
    const days = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
    return sum + days;
  }, 0);

  const dailySalary = basicSalary / 30;
  return leaveDays * dailySalary;
};

const deriveFromFinalSalary = ({ finalSalary, manualDeductions = 0, leaveDeduction = 0, config }) => {
  const BASIC_RATIO = clamp(toNumber(config?.basic_ratio, DEFAULT_SALARY_CONFIG.basic_ratio), 0);
  const HRA_RATIO = clamp(toNumber(config?.hra_ratio, DEFAULT_SALARY_CONFIG.hra_ratio), 0);
  const DA_RATIO = clamp(toNumber(config?.da_ratio, DEFAULT_SALARY_CONFIG.da_ratio), 0);
  const ALLOWANCE_RATIO = clamp(toNumber(config?.allowance_ratio, DEFAULT_SALARY_CONFIG.allowance_ratio), 0);
  const PF_RATE_ON_BASIC = clamp(toNumber(config?.pf_rate_on_basic, DEFAULT_SALARY_CONFIG.pf_rate_on_basic), 0);
  const TAX_RATE_ON_GROSS = clamp(toNumber(config?.tax_rate_on_gross, DEFAULT_SALARY_CONFIG.tax_rate_on_gross), 0);

  const targetNet = clamp(toNumber(finalSalary));
  const fixedDeductions = clamp(toNumber(manualDeductions)) + clamp(toNumber(leaveDeduction));
  const effectiveRate = 1 - TAX_RATE_ON_GROSS - BASIC_RATIO * PF_RATE_ON_BASIC;
  const gross = effectiveRate > 0 ? (targetNet + fixedDeductions) / effectiveRate : targetNet;

  const basic = clamp(gross * BASIC_RATIO);
  const hra = clamp(gross * HRA_RATIO);
  const da = clamp(gross * DA_RATIO);
  const allowances = clamp(gross * ALLOWANCE_RATIO);
  const pf = clamp(basic * PF_RATE_ON_BASIC);
  const tax = clamp(gross * TAX_RATE_ON_GROSS);

  return {
    basic,
    hra,
    da,
    allowances,
    pf,
    tax,
    deductions: clamp(toNumber(manualDeductions)),
  };
};

const deriveSimpleFromFinalSalary = ({ finalSalary }) => {
  const net = clamp(toNumber(finalSalary, 0), 0);
  return {
    basic: net,
    hra: 0,
    da: 0,
    allowances: 0,
    pf: 0,
    tax: 0,
    deductions: 0,
    leave_deduction: 0,
    gross_salary: net,
    net_salary: net,
  };
};

// @route   GET /api/salary/config
// @desc    Get auto-calculation salary config
// @access  Private (Admin/HR/Subadmin)
router.get('/config', auth, authorize('admin', 'hr', 'subadmin'), async (req, res) => {
  try {
    const config = await getSalaryConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/salary/config
// @desc    Update auto-calculation salary config
// @access  Private (Admin)
router.put('/config', auth, authorize('admin'), async (req, res) => {
  try {
    const allowedFields = [
      'basic_ratio',
      'hra_ratio',
      'da_ratio',
      'allowance_ratio',
      'pf_rate_on_basic',
      'tax_rate_on_gross',
    ];

    const update = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        update[field] = clamp(toNumber(req.body[field], DEFAULT_SALARY_CONFIG[field]), 0, 1);
      }
    });

    const ratioSum =
      (update.basic_ratio ?? DEFAULT_SALARY_CONFIG.basic_ratio) +
      (update.hra_ratio ?? DEFAULT_SALARY_CONFIG.hra_ratio) +
      (update.da_ratio ?? DEFAULT_SALARY_CONFIG.da_ratio) +
      (update.allowance_ratio ?? DEFAULT_SALARY_CONFIG.allowance_ratio);
    if (Math.abs(ratioSum - 1) > 0.0001) {
      return res.status(400).json({ message: 'basic/hra/da/allowance ratios must sum to 1.0' });
    }

    const config = await SalaryConfig.findOneAndUpdate(
      { key: 'default' },
      { $set: { ...update, key: 'default' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
      deductions,
      final_salary
    } = req.body;

    // Check if employee exists
    const employee = await User.findOne({ emp_id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Pre-calculate leave deduction with provided basic (or 0, recomputed below for final salary flow)
    let leave_deduction = await calculateLeaveDeduction(emp_id, month, year, toNumber(basic, 0));

    const useFinalSalaryAuto = final_salary !== undefined && final_salary !== null && final_salary !== '';
    let salaryParts = {
      basic: toNumber(basic, 0),
      hra: toNumber(hra, 0),
      da: toNumber(da, 0),
      pf: toNumber(pf, 0),
      tax: toNumber(tax, 0),
      allowances: toNumber(allowances, 0),
      deductions: toNumber(deductions, 0),
    };

    if (useFinalSalaryAuto) {
      // Simplified mode: final salary is directly monthly net salary.
      const simple = deriveSimpleFromFinalSalary({ finalSalary: toNumber(final_salary, 0) });
      salaryParts = {
        basic: simple.basic,
        hra: simple.hra,
        da: simple.da,
        pf: simple.pf,
        tax: simple.tax,
        allowances: simple.allowances,
        deductions: simple.deductions,
      };
      leave_deduction = simple.leave_deduction;
    }

    // Calculate salaries
    const gross_salary = salaryParts.basic + salaryParts.hra + salaryParts.da + salaryParts.allowances;
    const total_deductions = salaryParts.pf + salaryParts.tax + salaryParts.deductions + leave_deduction;
    const net_salary = useFinalSalaryAuto ? toNumber(final_salary, 0) : gross_salary - total_deductions;

    // Check if salary for this month already exists
    const existingSalary = await Salary.findOne({ emp_id, month, year });
    if (existingSalary) {
      return res.status(400).json({ message: 'Salary for this month already exists' });
    }

    const salary = new Salary({
      emp_id,
      month,
      year,
      basic: salaryParts.basic,
      hra: salaryParts.hra,
      da: salaryParts.da,
      pf: salaryParts.pf,
      tax: salaryParts.tax,
      allowances: salaryParts.allowances,
      deductions: salaryParts.deductions,
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

// @route   GET /api/salary/eligible-users
// @desc    Get users eligible for salary creation/updation
// @access  Private (Admin/HR/Subadmin)
router.get('/eligible-users', auth, authorize('admin', 'hr', 'subadmin'), async (req, res) => {
  try {
    let roleFilter = ['employee'];

    if (req.user.role === 'admin') {
      roleFilter = ['employee', 'manager', 'hr', 'subadmin'];
    } else if (req.user.role === 'subadmin') {
      roleFilter = ['employee', 'manager', 'hr'];
    } else if (req.user.role === 'hr') {
      roleFilter = ['employee', 'manager'];
    }

    const users = await User.find({
      role: { $in: roleFilter },
    })
      .select('name emp_id role department designation email')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/salary/latest/:empId
// @desc    Get latest salary record by employee ID
// @access  Private (Admin/HR/Subadmin)
router.get('/latest/:empId', auth, authorize('admin', 'hr', 'subadmin'), async (req, res) => {
  try {
    const latestSalary = await Salary.findOne({ emp_id: req.params.empId }).sort({ createdAt: -1 });
    if (!latestSalary) {
      return res.status(404).json({ message: 'No previous salary found for this employee' });
    }
    return res.json(latestSalary);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/salary
// @desc    Get all salary records (Admin/HR) or own records (Employee)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'hr', 'subadmin', 'employee'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

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
// @access  Private (Admin/HR/Subadmin)
router.put('/:id', auth, authorize('admin', 'hr', 'subadmin'), async (req, res) => {
  try {
    const {
      basic,
      hra,
      da,
      pf,
      tax,
      allowances,
      deductions,
      final_salary
    } = req.body;

    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    const useFinalSalaryAuto = final_salary !== undefined && final_salary !== null && final_salary !== '';
    const requestedBasic = basic !== undefined ? toNumber(basic) : salary.basic;
    let leave_deduction = await calculateLeaveDeduction(salary.emp_id, salary.month, salary.year, requestedBasic);

    if (useFinalSalaryAuto) {
      const simple = deriveSimpleFromFinalSalary({
        finalSalary: toNumber(final_salary, salary.net_salary),
      });
      salary.basic = simple.basic;
      salary.hra = simple.hra;
      salary.da = simple.da;
      salary.allowances = simple.allowances;
      salary.pf = simple.pf;
      salary.tax = simple.tax;
      salary.deductions = simple.deductions;
      leave_deduction = simple.leave_deduction;
    } else if (
      basic !== undefined ||
      hra !== undefined ||
      da !== undefined ||
      allowances !== undefined ||
      pf !== undefined ||
      tax !== undefined ||
      deductions !== undefined
    ) {
      salary.basic = basic !== undefined ? toNumber(basic) : salary.basic;
      salary.hra = hra !== undefined ? toNumber(hra) : salary.hra;
      salary.da = da !== undefined ? toNumber(da) : salary.da;
      salary.allowances = allowances !== undefined ? toNumber(allowances) : salary.allowances;
      salary.pf = pf !== undefined ? toNumber(pf) : salary.pf;
      salary.tax = tax !== undefined ? toNumber(tax) : salary.tax;
      salary.deductions = deductions !== undefined ? toNumber(deductions) : salary.deductions;
    }

    salary.leave_deduction = leave_deduction;
    salary.gross_salary = salary.basic + salary.hra + salary.da + salary.allowances;
    salary.net_salary = useFinalSalaryAuto
      ? toNumber(final_salary, salary.net_salary)
      : salary.gross_salary - salary.pf - salary.tax - salary.deductions - salary.leave_deduction;

    // Update additional allowed fields only
    if (req.body.status) {
      salary.status = req.body.status;
    }
    if (req.body.payslip_pdf !== undefined) {
      salary.payslip_pdf = req.body.payslip_pdf;
    }

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

