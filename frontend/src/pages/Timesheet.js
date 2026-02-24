import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TimesheetPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState({ date: '', task_description: '', hours_worked: '', project_name: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEntries();
    if (['manager','hr','admin','subadmin'].includes(user?.role)) fetchPending();
  }, [user]);

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API_URL}/timesheet`);
      setEntries(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_URL}/timesheet/pending`);
      setPending(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/timesheet`, form);
      setMessage('Timesheet entry created');
      setForm({ date: '', task_description: '', hours_worked: '', project_name: '' });
      fetchEntries();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating entry');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSubmit = async (id) => {
    try {
      await axios.post(`${API_URL}/timesheet/${id}/submit`);
      setMessage('Timesheet submitted');
      fetchEntries();
      fetchPending();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error submitting');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`${API_URL}/timesheet/${id}/approve`);
      setMessage('Timesheet approved');
      fetchEntries();
      fetchPending();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error approving');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection (optional)');
    try {
      await axios.post(`${API_URL}/timesheet/${id}/reject`, { rejection_reason: reason });
      setMessage('Timesheet rejected');
      fetchEntries();
      fetchPending();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error rejecting');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft timesheet?')) return;
    try {
      await axios.delete(`${API_URL}/timesheet/${id}`);
      setMessage('Timesheet deleted');
      fetchEntries();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error deleting');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Timesheets</h1>
        <p className="text-muted mt-1">Create, submit and manage timesheet entries</p>
      </div>

      {message && <div className="p-3 mb-4 bg-green-50 text-green-700 rounded">{message}</div>}

      {/* Create entry (employee) */}
      {user?.role === 'employee' && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="p-3 border rounded" required />
            <input type="text" placeholder="Task description" value={form.task_description} onChange={e => setForm({ ...form, task_description: e.target.value })} className="p-3 border rounded" required />
            <input type="number" step="0.25" placeholder="Hours" value={form.hours_worked} onChange={e => setForm({ ...form, hours_worked: e.target.value })} className="p-3 border rounded" required />
            <input type="text" placeholder="Project name" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} className="p-3 border rounded" />
          </div>
          <div className="mt-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded">Add Entry</button>
          </div>
        </form>
      )}

      {/* My entries */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">My Timesheet Entries</h2>
        {entries.length === 0 ? (
          <div className="text-sm text-muted">No entries found</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Task</th>
                <th className="p-2">Hours</th>
                <th className="p-2">Project</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e._id} className="border-t">
                  <td className="p-2">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="p-2">{e.task_description}</td>
                  <td className="p-2">{e.hours_worked}</td>
                  <td className="p-2">{e.project_name}</td>
                  <td className="p-2">{e.status}</td>
                  <td className="p-2">
                    {e.status === 'draft' && (
                      <button className="mr-2 px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => handleSubmit(e._id)}>Submit</button>
                    )}
                    {e.status === 'draft' && (
                      <button className="mr-2 px-3 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(e._id)}>Delete</button>
                    )}
                    {e.status === 'submitted' && <span className="text-sm text-blue-600">Pending approval</span>}
                    {e.status === 'approved' && <span className="text-sm text-green-600">Approved</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending approvals for managers/hr/admin/subadmin */}
      {['manager','hr','admin','subadmin'].includes(user?.role) && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Pending Timesheets ({pending.length})</h2>
          {pending.length === 0 ? (
            <div className="text-sm text-muted">No pending timesheets</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-2">Employee</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Task</th>
                  <th className="p-2">Hours</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(t => (
                  <tr key={t._id} className="border-t">
                    <td className="p-2">{t.user?.name} ({t.user?.emp_id})</td>
                    <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="p-2">{t.task_description}</td>
                    <td className="p-2">{t.hours_worked}</td>
                    <td className="p-2">
                      <button className="mr-2 px-3 py-1 bg-green-600 text-white rounded" onClick={() => handleApprove(t._id)}>Approve</button>
                      <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => handleReject(t._id)}>Reject</button>
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

export default TimesheetPage;
