import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './PendingApprovals.css';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [otpByUserId, setOtpByUserId] = useState({});

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees/pending`);
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setMessage('Error fetching pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const pendingUser = pendingUsers.find(u => u._id === userId);
      
      // Subadmin can only approve employees
      if (user?.role === 'subadmin' && pendingUser?.role !== 'employee') {
        setMessage('Subadmin can only approve employee requests');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      const payload = {};
      if (user?.role === 'admin') {
        const otp = otpByUserId[userId];
        if (!otp) {
          setMessage('OTP is required for admin approval (check admin email)');
          setTimeout(() => setMessage(''), 3000);
          return;
        }
        payload.otp = otp;
      }

      await axios.post(`${API_URL}/auth/approve/${userId}`, payload);
      setMessage('User approved successfully!');
      setOtpByUserId(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      fetchPendingUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error approving user');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleResendOtp = async (userId) => {
    try {
      if (user?.role !== 'admin') {
        setMessage('Only admin can resend OTP');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      await axios.post(`${API_URL}/auth/resend-admin-otp/${userId}`);
      setMessage('OTP sent to admin email');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error resending OTP');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      // Only admin can change roles
      if (user?.role !== 'admin') {
        setMessage('Only admin can change user roles');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      await axios.post(`${API_URL}/auth/change-role/${userId}`, { role: newRole });
      setMessage('User role changed successfully!');
      fetchPendingUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error changing role');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-dark-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-dark-text-primary text-3xl font-bold">Pending Approvals</h1>
        <p className="text-dark-text-secondary mt-2">
          {user?.role === 'admin' 
            ? 'Approve or manage pending user registrations' 
            : 'Approve pending employee registrations'}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-md mb-4 text-center ${
          message.includes('Error')
            ? 'bg-red-500/10 border border-red-500 text-red-500'
            : 'bg-green-500/10 border border-green-500 text-green-500'
        }`}>
          {message}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-12 text-center">
          <p className="text-dark-text-secondary text-lg">No pending approvals</p>
          <p className="text-dark-text-secondary text-sm mt-2">All users have been approved</p>
        </div>
      ) : (
        <div className="bg-dark-bg-secondary border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-dark-bg-tertiary">
                <tr>
                  <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Employee ID</th>
                  <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Name</th>
                  <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Email</th>
                  <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Department</th>
                  <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Designation</th>
                  {user?.role === 'admin' && (
                    <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Current Role</th>
                  )}
                  {user?.role === 'admin' && (
                    <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">OTP</th>
                  )}
                  <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((pendingUser) => (
                  <tr key={pendingUser._id} className="hover:bg-dark-bg-tertiary transition-colors">
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{pendingUser.emp_id}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{pendingUser.name}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{pendingUser.email}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{pendingUser.department || 'N/A'}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{pendingUser.designation || 'N/A'}</td>
                    {user?.role === 'admin' && (
                      <td className="p-4 border-b border-dark-border">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-500">
                          {pendingUser.role.toUpperCase()}
                        </span>
                      </td>
                    )}
                    {user?.role === 'admin' && (
                      <td className="p-4 border-b border-dark-border">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter OTP"
                          value={otpByUserId[pendingUser._id] || ''}
                          onChange={(e) => setOtpByUserId(prev => ({ ...prev, [pendingUser._id]: e.target.value.trim() }))}
                          className="px-3 py-2 bg-dark-bg-tertiary text-dark-text-primary border border-dark-border rounded text-sm focus:outline-none focus:border-blue-500 w-40"
                        />
                      </td>
                    )}
                    <td className="p-4 border-b border-dark-border">
                      <div className="flex flex-wrap gap-2">
                        {user?.role === 'admin' && (
                          <select
                            value={pendingUser.role}
                            onChange={(e) => handleChangeRole(pendingUser._id, e.target.value)}
                            className="px-3 py-1 bg-dark-bg-tertiary text-dark-text-primary border border-dark-border rounded text-sm focus:outline-none focus:border-blue-500"
                          >
                            <option value="subadmin">Sub Admin</option>
                            <option value="hr">HR</option>
                            <option value="employee">Employee</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleApprove(pendingUser._id)}
                          className="px-4 py-1 bg-green-500 text-white border-none rounded text-sm cursor-pointer font-medium transition-colors hover:bg-green-600"
                        >
                          Approve
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleResendOtp(pendingUser._id)}
                            className="px-4 py-1 bg-blue-500 text-white border-none rounded text-sm cursor-pointer font-medium transition-colors hover:bg-blue-600"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
