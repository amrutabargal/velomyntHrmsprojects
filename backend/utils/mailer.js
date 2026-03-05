const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
  });

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    const err = new Error('SMTP is not configured (missing SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  return t.sendMail({ from, to, subject, text, html });
}

module.exports = { sendMail };


