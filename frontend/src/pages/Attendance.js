import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// Tailwind CSS used

const Attendance = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const canUsePunch = ['employee', 'manager', 'hr', 'subadmin'].includes(user?.role);
  const isReviewer = ['manager', 'hr', 'subadmin'].includes(user?.role);

  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get(`${API_URL}/attendance/today`);
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const response = await axios.get(`${API_URL}/attendance`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const handlePunchIn = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      const response = await axios.post(`${API_URL}/attendance/punch-in`);
      setMessage('Punched in successfully!');
      setTodayAttendance(response.data.attendance);
      await fetchTodayAttendance();
      await fetchAttendanceHistory();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error punching in');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      const response = await axios.post(`${API_URL}/attendance/punch-out`);
      setMessage('Punched out successfully!');
      setTodayAttendance(response.data.attendance);
      await fetchTodayAttendance();
      await fetchAttendanceHistory();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error punching out');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  const canPunchIn = canUsePunch && (!todayAttendance || !todayAttendance.punch_in);
  const canPunchOut = canUsePunch && todayAttendance && todayAttendance.punch_in && !todayAttendance.punch_out;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Punch in/out and view attendance records</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-4 text-center ${
          message.includes('Error')
            ? 'alert-error'
            : 'alert-success'
        }`}>
          {message}
        </div>
      )}

      {/* Punch In/Out Section */}
      {canUsePunch && (
        <div className="panel mb-8">
          <div className="panel-body">
            <h2 className="panel-title">Today's Attendance</h2>
          
            {todayAttendance ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-surface-tertiary p-4 rounded-xl">
                  <p className="text-text-secondary text-sm mb-1">Punch In</p>
                  <p className="text-text-primary text-lg font-semibold">
                    {todayAttendance.punch_in ? new Date(todayAttendance.punch_in).toLocaleTimeString() : '-'}
                  </p>
                </div>
                <div className="bg-surface-tertiary p-4 rounded-xl">
                  <p className="text-text-secondary text-sm mb-1">Punch Out</p>
                  <p className="text-text-primary text-lg font-semibold">
                    {todayAttendance.punch_out 
                      ? new Date(todayAttendance.punch_out).toLocaleTimeString()
                      : 'Not punched out'}
                  </p>
                </div>
                <div className="bg-surface-tertiary p-4 rounded-xl">
                  <p className="text-text-secondary text-sm mb-1">Work Hours</p>
                  <p className="text-text-primary text-lg font-semibold">
                    {todayAttendance.work_hours !== undefined && todayAttendance.work_hours !== null
                      ? `${todayAttendance.work_hours} hrs`
                      : '0 hrs'}
                  </p>
                </div>
                <div className="bg-surface-tertiary p-4 rounded-xl">
                  <p className="text-text-secondary text-sm mb-1">Status</p>
                  <p className="text-text-primary text-lg font-semibold">
                    {todayAttendance.status ? todayAttendance.status.replace('_', ' ').toUpperCase() : 'PRESENT'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary mb-6">No attendance record for today</p>
            )}

            <div className="flex flex-wrap gap-3">
              {canPunchIn && (
                <button
                  onClick={handlePunchIn}
                  disabled={actionLoading}
                  className="btn-sm-success px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Punch In'}
                </button>
              )}
              {canPunchOut && (
                <button
                  onClick={handlePunchOut}
                  disabled={actionLoading}
                  className="btn-sm-danger px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Punch Out'}
                </button>
              )}
              {todayAttendance?.punch_in && todayAttendance?.punch_out && (
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-medium">
                  Attendance completed for today
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="panel overflow-hidden">
        <div className="p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">
            {isReviewer ? 'Team Attendance (Last 30 Days)' : 'Attendance History (Last 30 Days)'}
          </h2>
        </div>
        <div className="table-shell">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                {isReviewer && (
                  <>
                    <th className="table-head-cell">Employee</th>
                    <th className="table-head-cell">Emp ID</th>
                  </>
                )}
                <th className="table-head-cell">Date</th>
                <th className="table-head-cell">Punch In</th>
                <th className="table-head-cell">Punch Out</th>
                <th className="table-head-cell">Work Hours</th>
                <th className="table-head-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.length === 0 ? (
                <tr>
                  <td colSpan={isReviewer ? 7 : 5} className="p-8 text-center text-text-secondary">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendanceHistory.map((record) => (
                  <tr key={record._id} className="table-row">
                    {isReviewer && (
                      <>
                        <td className="table-cell">
                          {record.user?.name || '-'}
                        </td>
                        <td className="table-cell">
                          {record.user?.emp_id || '-'}
                        </td>
                      </>
                    )}
                    <td className="table-cell">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      {record.punch_in ? new Date(record.punch_in).toLocaleTimeString() : '-'}
                    </td>
                    <td className="table-cell">
                      {record.punch_out ? new Date(record.punch_out).toLocaleTimeString() : '-'}
                    </td>
                    <td className="table-cell">
                      {record.work_hours !== undefined && record.work_hours !== null
                        ? `${record.work_hours} hrs`
                        : '-'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        record.status === 'present'
                          ? 'bg-emerald-100 text-emerald-700'
                          : record.status === 'late'
                          ? 'bg-yellow-100 text-yellow-700'
                          : record.status === 'half_day'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {(record.status || 'present').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;

