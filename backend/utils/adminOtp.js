const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generateNumericOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = (10 ** length) - 1;
  return String(crypto.randomInt(min, max + 1));
}

async function hashOtp(otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(String(otp), salt);
}

async function verifyOtp(otp, otpHash) {
  if (!otp || !otpHash) return false;
  return bcrypt.compare(String(otp), otpHash);
}

module.exports = {
  generateNumericOtp,
  hashOtp,
  verifyOtp,
};


