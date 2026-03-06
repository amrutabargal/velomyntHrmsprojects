import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TimesheetPage = () => {
  const { user } = useAuth();
  const canCreateEntry = ['employee', 'manager', 'hr', 'subadmin', 'admin'].includes(user?.role);

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
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Timesheets</h1>
        </div>
      </div>

      {message && (
        <div className={message.toLowerCase().includes('error') ? 'alert-error' : 'alert-success'}>
          {message}
        </div>
      )}

      {/* Create entry (all roles) */}
      {canCreateEntry && (
        <form onSubmit={handleCreate} className="panel panel-body mb-6">
          <h2 className="panel-title">Add Timesheet Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" required />
            <input type="text" placeholder="Task description" value={form.task_description} onChange={e => setForm({ ...form, task_description: e.target.value })} className="input-field" required />
            <input type="number" step="0.25" placeholder="Hours" value={form.hours_worked} onChange={e => setForm({ ...form, hours_worked: e.target.value })} className="input-field" required />
            <input type="text" placeholder="Project name" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} className="input-field" />
          </div>
          <div className="mt-4">
            <button className="btn-primary">Add Entry</button>
          </div>
        </form>
      )}

      {/* My entries */}
      <div className="panel panel-body mb-6">
        <h2 className="panel-title">My Timesheet Entries</h2>
        {entries.length === 0 ? (
          <div className="text-sm text-text-secondary">No entries found</div>
        ) : (
          <div className="table-shell">
            <table className="table-base">
              <thead className="table-head">
              <tr>
                <th className="table-head-cell">Date</th>
                <th className="table-head-cell">Task</th>
                <th className="table-head-cell">Hours</th>
                <th className="table-head-cell">Project</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell">Actions</th>
              </tr>
              </thead>
              <tbody>
              {entries.map(e => (
                <tr key={e._id} className="table-row">
                  <td className="table-cell">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="table-cell">{e.task_description}</td>
                  <td className="table-cell">{e.hours_worked}</td>
                  <td className="table-cell">{e.project_name}</td>
                  <td className="table-cell">{e.status}</td>
                  <td className="table-cell">
                    {e.status === 'draft' && (
                      <button className="mr-2 px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors" onClick={() => handleSubmit(e._id)}>Submit</button>
                    )}
                    {e.status === 'draft' && (
                      <button className="btn-sm-danger mr-2" onClick={() => handleDelete(e._id)}>Delete</button>
                    )}
                    {e.status === 'submitted' && <span className="text-sm text-blue-600">Pending approval</span>}
                    {e.status === 'approved' && <span className="text-sm text-green-600">Approved</span>}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending approvals for managers/hr/admin/subadmin */}
      {['manager','hr','admin','subadmin'].includes(user?.role) && (
        <div className="panel panel-body">
          <h2 className="panel-title">Pending Timesheets ({pending.length})</h2>
          {pending.length === 0 ? (
            <div className="text-sm text-text-secondary">No pending timesheets</div>
          ) : (
            <div className="table-shell">
              <table className="table-base">
                <thead className="table-head">
                <tr>
                  <th className="table-head-cell">Employee</th>
                  <th className="table-head-cell">Date</th>
                  <th className="table-head-cell">Task</th>
                  <th className="table-head-cell">Hours</th>
                  <th className="table-head-cell">Actions</th>
                </tr>
                </thead>
                <tbody>
                {pending.map(t => (
                  <tr key={t._id} className="table-row">
                    <td className="table-cell">{t.user?.name} ({t.user?.emp_id})</td>
                    <td className="table-cell">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="table-cell">{t.task_description}</td>
                    <td className="table-cell">{t.hours_worked}</td>
                    <td className="table-cell">
                      <button className="btn-sm-success mr-2" onClick={() => handleApprove(t._id)}>Approve</button>
                      <button className="btn-sm-danger" onClick={() => handleReject(t._id)}>Reject</button>
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

export default TimesheetPage;
