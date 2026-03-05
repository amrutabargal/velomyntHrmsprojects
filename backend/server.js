const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make uploads folder publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/payslip', require('./routes/payslip'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/timesheet', require('./routes/timesheet'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/time', require('./routes/time'));
app.use('/api/holidays', require('./routes/holidays'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const BASE_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = Number(process.env.PORT_RETRY_ATTEMPTS || 10);
const AUTO_FALLBACK_PORT = process.env.PORT_AUTO_FALLBACK !== 'false';

const startServer = (port, attempt = 0) => {
  const server = app.listen(port, () => {
    const fallbackNote = attempt > 0 ? ` (fallback from ${BASE_PORT})` : '';
    console.log(`Server running on port ${port}${fallbackNote}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (!AUTO_FALLBACK_PORT || attempt >= MAX_PORT_RETRIES) {
        console.error(
          `Port ${port} is already in use. Stop the existing process or change PORT in backend/.env.`
        );
        process.exit(1);
      }

      const nextPort = port + 1;
      console.warn(`Port ${port} is in use. Retrying on ${nextPort}...`);
      startServer(nextPort, attempt + 1);
      return;
    }

    console.error('Server startup failed:', err.message);
    process.exit(1);
  });
};

startServer(BASE_PORT);

