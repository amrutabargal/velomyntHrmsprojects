import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Material Icons
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchPendingUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/employees/pending`);
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setMessage('Error fetching pending users');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleApprove = async (userId) => {
    try {
      const pendingUser = pendingUsers.find(u => u._id === userId);
      
      if (user?.role === 'subadmin' && pendingUser?.role !== 'employee') {
        setMessage('Subadmin can only approve employee requests');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      await axios.post(`${API_URL}/auth/approve/${userId}`, {});
      setMessage('User approved successfully!');
      fetchPendingUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error approving user');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleReject = async (userId) => {
    try {
      await axios.delete(`${API_URL}/employees/${userId}`);
      setMessage('User rejected and removed!');
      fetchPendingUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error rejecting user');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
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

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'hr': return 'bg-primary-100 text-primary-700';
      case 'subadmin': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-amber-100 text-amber-700';
      default: return 'bg-emerald-100 text-emerald-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-text-primary text-3xl font-bold flex items-center gap-3">
          <PendingActionsIcon className="text-primary-600" fontSize="large" />
          Pending Approvals
        </h1>
        <p className="text-text-secondary mt-2">
          {user?.role === 'admin' 
            ? 'Approve or manage pending user registrations' 
            : 'Approve pending employee registrations'}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-center flex items-center justify-center gap-2 ${
          message.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          <CheckCircleIcon />
          {message}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="bg-surface-primary border border-border-light rounded-2xl p-12 text-center shadow-card">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="text-primary-600" style={{ fontSize: 40 }} />
          </div>
          <p className="text-text-primary text-lg font-semibold">No pending approvals</p>
          <p className="text-text-secondary text-sm mt-2">All users have been approved</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((pendingUser) => (
            <div key={pendingUser._id} className="bg-surface-primary border border-border-light rounded-2xl p-6 shadow-card hover:shadow-soft transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* User Avatar & Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-700">
                      {pendingUser.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-text-primary font-semibold truncate">{pendingUser.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(pendingUser.role)}`}>
                        {pendingUser.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <BadgeIcon fontSize="small" className="text-text-muted" />
                        {pendingUser.emp_id}
                      </span>
                      <span className="flex items-center gap-1">
                        <EmailIcon fontSize="small" className="text-text-muted" />
                        {pendingUser.email}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <BusinessIcon fontSize="small" className="text-text-muted" />
                        {pendingUser.department || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <WorkIcon fontSize="small" className="text-text-muted" />
                        {pendingUser.designation || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {user?.role === 'admin' && (
                    <select
                      value={pendingUser.role}
                      onChange={(e) => handleChangeRole(pendingUser._id, e.target.value)}
                      className="px-4 py-2 bg-surface-tertiary text-text-primary border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="hr">HR</option>
                      <option value="subadmin">Sub Admin</option>
                      <option value="manager">Manager</option>
                    </select>
                  )}
                  <button
                    onClick={() => handleApprove(pendingUser._id)}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <CheckCircleIcon fontSize="small" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(pendingUser._id)}
                    className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <CancelIcon fontSize="small" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
