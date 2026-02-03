const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ emp_id: 'ADMIN001' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      emp_id: 'ADMIN001',
      name: 'Admin User',
      email: 'admin@hrms.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      department: 'Administration',
      designation: 'System Administrator'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@hrms.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

