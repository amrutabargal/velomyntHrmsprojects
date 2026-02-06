const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const ADMIN_EMAIL = 'amruta442001@gmail.com';
const ADMIN_PASSWORD = 'Amruta@2001';
const ADMIN_EMP_ID = 'ADMIN001';

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Step 1: Find user by email (target email)
    const userByEmail = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    
    // Step 2: Find user by emp_id (ADMIN001)
    const userByEmpId = await User.findOne({ emp_id: ADMIN_EMP_ID });

    // Case 1: Same user has both - just update
    if (userByEmail && userByEmpId && userByEmail._id.toString() === userByEmpId._id.toString()) {
      userByEmail.role = 'admin';
      userByEmail.status = 'active';
      userByEmail.password = ADMIN_PASSWORD;
      userByEmail.department = userByEmail.department || 'Administration';
      userByEmail.designation = userByEmail.designation || 'System Administrator';
      await userByEmail.save();
      
      console.log('');
      console.log('✅ Admin user updated successfully!');
      showCredentials();
      process.exit(0);
    }

    // Case 2: User exists with target email (but different emp_id) - update this user to be admin
    if (userByEmail) {
      // Delete old ADMIN001 if exists (to avoid emp_id conflict)
      if (userByEmpId) {
        await User.deleteOne({ _id: userByEmpId._id });
        console.log('Old ADMIN001 user removed.');
      }
      
      userByEmail.emp_id = ADMIN_EMP_ID;
      userByEmail.role = 'admin';
      userByEmail.status = 'active';
      userByEmail.password = ADMIN_PASSWORD;
      userByEmail.department = userByEmail.department || 'Administration';
      userByEmail.designation = userByEmail.designation || 'System Administrator';
      await userByEmail.save();
      
      console.log('');
      console.log('✅ Existing user converted to Admin!');
      showCredentials();
      process.exit(0);
    }

    // Case 3: ADMIN001 exists but with different email - update email
    if (userByEmpId) {
      userByEmpId.email = ADMIN_EMAIL.toLowerCase();
      userByEmpId.role = 'admin';
      userByEmpId.status = 'active';
      userByEmpId.password = ADMIN_PASSWORD;
      userByEmpId.department = userByEmpId.department || 'Administration';
      userByEmpId.designation = userByEmpId.designation || 'System Administrator';
      await userByEmpId.save();
      
      console.log('');
      console.log('✅ Admin credentials updated!');
      showCredentials();
      process.exit(0);
    }

    // Case 4: No user exists - create new admin
    const admin = new User({
      emp_id: ADMIN_EMP_ID,
      name: 'Admin User',
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
      role: 'admin',
      status: 'active',
      department: 'Administration',
      designation: 'System Administrator'
    });

    await admin.save();
    console.log('');
    console.log('✅ Admin user created successfully!');
    showCredentials();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

function showCredentials() {
  console.log('-----------------------------------');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log('-----------------------------------');
  console.log('You can now login with these credentials!');
}

createAdmin();
