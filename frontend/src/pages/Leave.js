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
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Leave</h1>
        <p className="text-muted mt-1">Apply for leave or manage approvals</p>
      </div>

      {message && <div className="p-3 mb-4 bg-green-50 text-green-700 rounded">{message}</div>}

      {/* Apply Leave (employees) */}
      {user?.role === 'employee' && (
        <form onSubmit={handleApply} className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Apply for Leave</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })} className="p-3 border rounded">
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="p-3 border rounded" required />
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="p-3 border rounded" required />
            <input type="text" placeholder="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="p-3 border rounded" required />
          </div>
          <div className="mt-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded">Apply</button>
          </div>
        </form>
      )}

      {/* Dashboard */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold">Leave Balance</h3>
            <ul className="mt-3">
              <li>Casual: {dashboard.balance?.casual ?? 0} days</li>
              <li>Sick: {dashboard.balance?.sick ?? 0} days</li>
              <li>Paid: {dashboard.balance?.paid ?? 0} days</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded shadow md:col-span-2">
            <h3 className="font-semibold">Recent Leaves</h3>
            <ul className="mt-3">
              {dashboard.recentLeaves && dashboard.recentLeaves.length ? (
                dashboard.recentLeaves.map(l => (
                  <li key={l._id} className="border-b py-2">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">{l.user?.name || user.name} - {l.leave_type}</div>
                        <div className="text-sm text-muted">{new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm">{l.status.toUpperCase()}</div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted">No recent leaves</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Pending approvals for managers/hr/admin/subadmin */}
      {['manager','hr','admin','subadmin'].includes(user?.role) && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Pending Leave Approvals ({pending.length})</h2>
          {pending.length === 0 ? (
            <div className="text-sm text-muted">No pending leaves</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-2">Employee</th>
                  <th className="p-2">Dates</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(l => (
                  <tr key={l._id} className="border-t">
                    <td className="p-2">{l.user?.name} ({l.user?.emp_id})</td>
                    <td className="p-2">{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</td>
                    <td className="p-2">{l.leave_type}</td>
                    <td className="p-2">{l.reason}</td>
                    <td className="p-2">
                      <button className="mr-2 px-3 py-1 bg-green-600 text-white rounded" onClick={() => handleApprove(l._id)}>Approve</button>
                      <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => handleReject(l._id)}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Leave;
