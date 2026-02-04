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
      // Reset existing admin credentials so password is correct
      existingAdmin.email = 'admin@hrms.com';
      existingAdmin.name = existingAdmin.name || 'Admin User';
      existingAdmin.role = 'admin';
      existingAdmin.status = 'active';
      existingAdmin.department = existingAdmin.department || 'Administration';
      existingAdmin.designation = existingAdmin.designation || 'System Administrator';
      // IMPORTANT: set plain password so User pre-save hook hashes it once
      existingAdmin.password = 'admin123';
      await existingAdmin.save();

      console.log('Admin user already existed. Credentials have been reset.');
      console.log('Email: admin@hrms.com');
      console.log('Password: admin123');
      console.log('Please change the password after first login!');
      process.exit(0);
    }

    // Create admin user (password will be hashed by User model pre-save hook)
    const admin = new User({
      emp_id: 'ADMIN001',
      name: 'Admin User',
      email: 'admin@hrms.com',
      password: 'admin123',
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

