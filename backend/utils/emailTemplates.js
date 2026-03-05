function adminRegistrationOtpEmail({ otp, newUser }) {
  const safe = (v) => (v ? String(v) : 'N/A');
  const subject = `HRMS Approval OTP: ${otp}`;
  const text = [
    `OTP: ${otp}`,
    '',
    'A new user registered and requires approval:',
    `Name: ${safe(newUser?.name)}`,
    `Employee ID: ${safe(newUser?.emp_id)}`,
    `Email: ${safe(newUser?.email)}`,
    `Requested Role: ${safe(newUser?.role)}`,
    '',
    'Use this OTP in Pending Approvals to approve the request.',
    'If you did not expect this, please ignore.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">HRMS Approval OTP</h2>
      <p style="margin: 0 0 12px;">A new user registration requires your approval.</p>
      <div style="padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; display: inline-block;">
        <div style="font-size: 12px; color: #6b7280;">One-Time Password (OTP)</div>
        <div style="font-size: 28px; letter-spacing: 3px; font-weight: 700; margin-top: 4px;">${otp}</div>
      </div>
      <h3 style="margin: 20px 0 8px;">Registration details</h3>
      <ul style="margin: 0; padding-left: 18px;">
        <li><b>Name</b>: ${safe(newUser?.name)}</li>
        <li><b>Employee ID</b>: ${safe(newUser?.emp_id)}</li>
        <li><b>Email</b>: ${safe(newUser?.email)}</li>
        <li><b>Requested Role</b>: ${safe(newUser?.role)}</li>
      </ul>
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 12px;">
        Use this OTP in the Pending Approvals screen to approve the request. If you did not expect this email, you can ignore it.
      </p>
    </div>
  `;

  return { subject, text, html };
}

module.exports = { adminRegistrationOtpEmail };


