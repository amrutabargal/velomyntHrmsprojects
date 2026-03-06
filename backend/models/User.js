const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EMP_ID_PREFIX_BY_ROLE = {
  admin: 'VM',
  subadmin: 'VMS',
  hr: 'VMH',
  manager: 'VMM',
  employee: 'VME',
};

const getEmpIdPrefix = (role) => {
  return EMP_ID_PREFIX_BY_ROLE[role] || EMP_ID_PREFIX_BY_ROLE.employee;
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

async function generateNextEmpId(model, role) {
  const prefix = getEmpIdPrefix(role);
  const regex = new RegExp(`^${escapeRegex(prefix)}(\\d+)$`);
  const users = await model.find(
    { emp_id: { $regex: `^${escapeRegex(prefix)}\\d+$` } },
    { emp_id: 1 }
  ).lean();

  let maxSeq = 0;
  for (const user of users) {
    const match = user.emp_id?.match(regex);
    if (!match) continue;
    const seq = Number.parseInt(match[1], 10);
    if (Number.isFinite(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

const userSchema = new mongoose.Schema({
  emp_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'subadmin', 'hr', 'employee', 'manager'],
    default: 'subadmin'
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  leave_balance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 10 },
    paid: { type: Number, default: 15 }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approved_at: {
    type: Date,
    default: null
  },
  // OTP sent to admin email for approving this registration
  admin_otp_hash: {
    type: String,
    default: null
  },
  admin_otp_expires_at: {
    type: Date,
    default: null
  },
  department: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  date_of_birth: {
    type: Date,
    default: null
  },
  bank_details: {
    account_number: {
      type: String,
      trim: true
    },
    bank_name: {
      type: String,
      trim: true
    },
    ifsc_code: {
      type: String,
      trim: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate role-wise employee IDs when not supplied.
userSchema.pre('validate', async function (next) {
  try {
    if (this.emp_id && this.emp_id.trim()) {
      this.emp_id = this.emp_id.trim().toUpperCase();
      return next();
    }

    if (!this.isNew) {
      return next();
    }

    const maxAttempts = 5;
    let attempt = 0;
    while (attempt < maxAttempts) {
      const candidateId = await generateNextEmpId(this.constructor, this.role);
      const exists = await this.constructor.exists({ emp_id: candidateId });
      if (!exists) {
        this.emp_id = candidateId;
        return next();
      }
      attempt += 1;
    }

    return next(new Error('Unable to generate unique employee ID. Please retry.'));
  } catch (error) {
    return next(error);
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

