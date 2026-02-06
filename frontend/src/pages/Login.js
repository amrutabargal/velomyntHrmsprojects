import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Material Icons
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    emp_id: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: '',
    designation: '',
    bank_details: {
      account_number: '',
      bank_name: '',
      ifsc_code: '',
    },
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bank_')) {
      let bankField = name.replace('bank_', '');
      if (bankField === 'bank_name') {
        bankField = 'bank_name';
      }
      setRegisterData({
        ...registerData,
        bank_details: {
          ...registerData.bank_details,
          [bankField]: value,
        },
      });
    } else {
      setRegisterData({
        ...registerData,
        [name]: value,
      });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterMessage('');

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterMessage('Passwords do not match');
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterMessage('Password must be at least 6 characters long');
      return;
    }

    setRegisterLoading(true);
    try {
      const dataToSend = {
        emp_id: registerData.emp_id,
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
        department: registerData.department,
        designation: registerData.designation,
        bank_details: {
          account_number: registerData.bank_details.account_number || '',
          bank_name: registerData.bank_details.bank_name || '',
          ifsc_code: registerData.bank_details.ifsc_code || '',
        },
      };

      const response = await axios.post(`${API_URL}/auth/register-public`, dataToSend);
      setRegisterMessage(response.data.message || 'Registration successful! Please wait for admin approval.');
      
      setRegisterData({
        emp_id: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
        department: '',
        designation: '',
        bank_details: {
          account_number: '',
          bank_name: '',
          ifsc_code: '',
        },
      });

      setTimeout(() => {
        setShowRegister(false);
        setRegisterMessage('');
      }, 3000);
    } catch (error) {
      setRegisterMessage(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const inputClass = "w-full p-4 pl-12 bg-surface-primary border border-border-light rounded-xl text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all";
  const labelClass = "text-text-primary font-medium text-sm mb-2 block";

  if (showRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
        <div className="bg-surface-primary border border-border-light rounded-2xl p-10 w-full max-w-2xl shadow-elevated max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PersonAddIcon className="text-white" style={{ fontSize: 32 }} />
            </div>
            <h1 className="text-primary-700 text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-text-secondary text-sm">Join Velomynt HRMS Portal</p>
          </div>

          {registerMessage && (
            <div className={`p-4 mb-6 rounded-xl text-sm text-center flex items-center justify-center gap-2 ${
              registerMessage.includes('successful') || registerMessage.includes('approval')
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {registerMessage}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Employee ID *</label>
                <div className="relative">
                  <BadgeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    name="emp_id"
                    value={registerData.emp_id}
                    onChange={handleRegisterChange}
                    required
                    placeholder="EMP001"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Full Name *</label>
                <div className="relative">
                  <PersonIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    required
                    placeholder="John Doe"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Email *</label>
                <div className="relative">
                  <EmailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                    placeholder="john@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Role *</label>
                <div className="relative">
                  <WorkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <select
                    name="role"
                    value={registerData.role}
                    onChange={handleRegisterChange}
                    className={inputClass}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="subadmin">Sub Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Department</label>
                <div className="relative">
                  <BusinessIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    name="department"
                    value={registerData.department}
                    onChange={handleRegisterChange}
                    placeholder="IT Department"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <div className="relative">
                  <WorkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    name="designation"
                    value={registerData.designation}
                    onChange={handleRegisterChange}
                    placeholder="Software Developer"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Password *</label>
                <div className="relative">
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    minLength="6"
                    placeholder="Min 6 characters"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm Password *</label>
                <div className="relative">
                  <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Confirm password"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-light">
              <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                <AccountBalanceIcon className="text-primary-600" />
                Bank Details (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-text-secondary text-sm mb-2 block">Account Number</label>
                  <input
                    type="text"
                    name="bank_account_number"
                    value={registerData.bank_details.account_number}
                    onChange={handleRegisterChange}
                    placeholder="Account number"
                    className="w-full p-3 bg-surface-primary border border-border-light rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-2 block">Bank Name</label>
                  <input
                    type="text"
                    name="bank_bank_name"
                    value={registerData.bank_details.bank_name}
                    onChange={handleRegisterChange}
                    placeholder="Bank name"
                    className="w-full p-3 bg-surface-primary border border-border-light rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-2 block">IFSC Code</label>
                  <input
                    type="text"
                    name="bank_ifsc_code"
                    value={registerData.bank_details.ifsc_code}
                    onChange={handleRegisterChange}
                    placeholder="IFSC code"
                    className="w-full p-3 bg-surface-primary border border-border-light rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowRegister(false);
                  setRegisterMessage('');
                }}
                className="flex-1 p-4 bg-surface-tertiary text-text-primary rounded-xl font-semibold text-base hover:bg-surface-hover transition-all flex items-center justify-center gap-2 border border-border-light"
              >
                <ArrowBackIcon />
                Back to Login
              </button>
              <button
                type="submit"
                className="flex-1 p-4 bg-primary-600 text-white rounded-xl font-semibold text-base hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2"
                disabled={registerLoading}
              >
                <PersonAddIcon />
                {registerLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
      <div className="bg-surface-primary border border-border-light rounded-2xl p-10 w-full max-w-md shadow-elevated">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">V</span>
          </div>
          <h1 className="text-primary-700 text-3xl font-bold mb-2">Velomynt HRMS</h1>
          <p className="text-text-secondary text-sm">Human Resource Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className={labelClass}>Email Address</label>
            <div className="relative">
              <EmailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full p-4 bg-primary-600 text-white rounded-xl font-semibold text-base hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2"
            disabled={loading}
          >
            <LoginIcon />
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-primary text-text-muted">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="w-full p-4 bg-emerald-600 text-white rounded-xl font-semibold text-base hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <PersonAddIcon />
            New User? Register Here
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
