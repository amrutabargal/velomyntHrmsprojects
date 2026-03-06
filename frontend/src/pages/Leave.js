import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Leave = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDashboard();
    if (['manager','hr','admin','subadmin'].includes(user?.role)) fetchPending();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/leave/dashboard`);
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_URL}/leave/pending`);
      setPending(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/leave`, form);
      setMessage('Leave applied successfully');
      setForm({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
      fetchDashboard();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error applying leave');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`${API_URL}/leave/${id}/approve`);
      setMessage('Leave approved');
      fetchPending();
      fetchDashboard();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error approving');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection (optional)');
    try {
      await axios.post(`${API_URL}/leave/${id}/reject`, { rejection_reason: reason });
      setMessage('Leave rejected');
      fetchPending();
      fetchDashboard();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error rejecting');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
        </div>
      </div>

      {message && (
        <div className={message.toLowerCase().includes('error') ? 'alert-error' : 'alert-success'}>
          {message}
        </div>
      )}

      {/* Apply Leave (employees) */}
      {user?.role === 'employee' && (
        <form onSubmit={handleApply} className="panel panel-body mb-6">
          <h2 className="panel-title">Apply for Leave</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })} className="input-field">
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input-field" required />
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="input-field" required />
            <input type="text" placeholder="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="input-field" required />
          </div>
          <div className="mt-4">
            <button className="btn-primary">Apply</button>
          </div>
        </form>
      )}

      {/* Dashboard */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="panel panel-body">
            <h3 className="font-semibold text-text-primary">Leave Balance</h3>
            <ul className="mt-3 text-text-secondary">
              <li>Casual: {dashboard.balance?.casual ?? 0} days</li>
              <li>Sick: {dashboard.balance?.sick ?? 0} days</li>
              <li>Paid: {dashboard.balance?.paid ?? 0} days</li>
            </ul>
          </div>
          <div className="panel panel-body md:col-span-2">
            <h3 className="font-semibold text-text-primary">Recent Leaves</h3>
            <ul className="mt-3">
              {dashboard.recentLeaves && dashboard.recentLeaves.length ? (
                dashboard.recentLeaves.map(l => (
                  <li key={l._id} className="border-b border-border-light py-2">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold text-text-primary">{l.user?.name || user.name} - {l.leave_type}</div>
                        <div className="text-sm text-text-secondary">{new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm text-text-secondary">{l.status.toUpperCase()}</div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-text-secondary">No recent leaves</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Pending approvals for managers/hr/admin/subadmin */}
      {['manager','hr','admin','subadmin'].includes(user?.role) && (
        <div className="panel panel-body">
          <h2 className="panel-title">Pending Leave Approvals ({pending.length})</h2>
          {pending.length === 0 ? (
            <div className="text-sm text-text-secondary">No pending leaves</div>
          ) : (
            <div className="table-shell">
              <table className="table-base">
                <thead className="table-head">
                <tr>
                  <th className="table-head-cell">Employee</th>
                  <th className="table-head-cell">Dates</th>
                  <th className="table-head-cell">Type</th>
                  <th className="table-head-cell">Reason</th>
                  <th className="table-head-cell">Actions</th>
                </tr>
                </thead>
                <tbody>
                {pending.map(l => (
                  <tr key={l._id} className="table-row">
                    <td className="table-cell">{l.user?.name} ({l.user?.emp_id})</td>
                    <td className="table-cell">{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</td>
                    <td className="table-cell">{l.leave_type}</td>
                    <td className="table-cell">{l.reason}</td>
                    <td className="table-cell">
                      <button className="btn-sm-success mr-2" onClick={() => handleApprove(l._id)}>Approve</button>
                      <button className="btn-sm-danger" onClick={() => handleReject(l._id)}>Reject</button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leave;
