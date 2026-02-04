import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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

    // Validation
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
      
      // Reset form
      setRegisterData({
        emp_id: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        designation: '',
        bank_details: {
          account_number: '',
          bank_name: '',
          ifsc_code: '',
        },
      });

      // Switch to login after 3 seconds
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

  if (showRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <h1 className="text-blue-500 text-3xl font-bold mb-2">Register</h1>
            <p className="text-dark-text-secondary text-sm">Create your Velomynt HRMS account</p>
          </div>

          {registerMessage && (
            <div className={`p-3 mb-4 rounded-lg text-sm text-center ${
              registerMessage.includes('successful') || registerMessage.includes('approval')
                ? 'bg-green-500/10 border border-green-500 text-green-500'
                : 'bg-red-500/10 border border-red-500 text-red-500'
            }`}>
              {registerMessage}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-primary font-medium text-sm">Employee ID *</label>
                <input
                  type="text"
                  name="emp_id"
                  value={registerData.emp_id}
                  onChange={handleRegisterChange}
                  required
                  placeholder="EMP001"
                  className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-primary font-medium text-sm">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  required
                  placeholder="John Doe"
                  className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-primary font-medium text-sm">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                  placeholder="john@example.com"
                  className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-primary font-medium text-sm">Role *</label>
                <select
                  name="role"
                  value={registerData.role}
                  onChange={handleRegisterChange}
                  className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="subadmin">Sub Admin</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-primary font-medium text-sm">Department</label>
                <input
                  type="text"
                  name="department"
                  value={registerData.department}
                  onChange={handleRegisterChange}
                  placeholder="IT"
                  className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-primary font-medium text-sm">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={registerData.designation}
                  onChange={handleRegisterChange}
                  placeholder="Software Developer"
                  className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-primary font-medium text-sm">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                  minLength="6"
                  placeholder="Min 6 characters"
                  className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-primary font-medium text-sm">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Confirm password"
                  className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-2">
              <h3 className="text-dark-text-primary font-medium mb-3">Bank Details (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-secondary text-sm">Account Number</label>
                  <input
                    type="text"
                    name="bank_account_number"
                    value={registerData.bank_details.account_number}
                    onChange={handleRegisterChange}
                    className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-secondary text-sm">Bank Name</label>
                  <input
                    type="text"
                    name="bank_bank_name"
                    value={registerData.bank_details.bank_name}
                    onChange={handleRegisterChange}
                    className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-secondary text-sm">IFSC Code</label>
                  <input
                    type="text"
                    name="bank_ifsc_code"
                    value={registerData.bank_details.ifsc_code}
                    onChange={handleRegisterChange}
                    className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowRegister(false);
                  setRegisterMessage('');
                  setRegisterData({
                    emp_id: '',
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
        role: 'employee',
                    role: 'employee',
                    department: '',
                    designation: '',
                    bank_details: {
                      account_number: '',
                      bank_name: '',
                      ifsc_code: '',
                    },
                  });
                }}
                className="flex-1 p-3 bg-dark-bg-tertiary text-dark-text-primary rounded-lg font-semibold text-base hover:bg-dark-border transition-colors"
              >
                Back to Login
              </button>
              <button
                type="submit"
                className="flex-1 p-3 bg-blue-500 text-white rounded-lg font-semibold text-base hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                disabled={registerLoading}
              >
                {registerLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-blue-500 text-4xl font-bold mb-2">Velomynt HRMS</h1>
          <p className="text-dark-text-secondary text-sm">Human Resource Management System</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-dark-text-primary font-medium text-sm">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-dark-text-primary font-medium text-sm">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="p-3 border border-dark-border rounded-lg bg-dark-bg-tertiary text-dark-text-primary text-base focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="p-3 bg-blue-500 text-white rounded-lg font-semibold text-base hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="p-3 bg-green-500 text-white rounded-lg font-semibold text-base hover:bg-green-600 transition-colors"
          >
            New User? Register Here
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
