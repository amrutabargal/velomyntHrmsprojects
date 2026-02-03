import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// Tailwind CSS used

const Attendance = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceHistory();
  }, []);

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
    try {
      const response = await axios.post(`${API_URL}/attendance/punch-in`);
      setMessage('Punched in successfully!');
      setTodayAttendance(response.data.attendance);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error punching in');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePunchOut = async () => {
    try {
      const response = await axios.post(`${API_URL}/attendance/punch-out`);
      setMessage('Punched out successfully!');
      setTodayAttendance(response.data.attendance);
      fetchAttendanceHistory();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error punching out');
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

  const canPunchIn = !todayAttendance || !todayAttendance.punch_in;
  const canPunchOut = todayAttendance && todayAttendance.punch_in && !todayAttendance.punch_out;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-dark-text-primary text-3xl font-bold">Attendance</h1>
        <p className="text-dark-text-secondary mt-2">Punch in/out and view your attendance records</p>
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

      {/* Punch In/Out Section */}
      {user?.role === 'employee' && (
        <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-8 mb-8">
          <h2 className="text-dark-text-primary text-2xl font-bold mb-6">Today's Attendance</h2>
          
          {todayAttendance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-dark-bg-tertiary p-6 rounded-lg">
                <p className="text-dark-text-secondary text-sm mb-2">Punch In</p>
                <p className="text-dark-text-primary text-xl font-semibold">
                  {new Date(todayAttendance.punch_in).toLocaleTimeString()}
                </p>
              </div>
              <div className="bg-dark-bg-tertiary p-6 rounded-lg">
                <p className="text-dark-text-secondary text-sm mb-2">Punch Out</p>
                <p className="text-dark-text-primary text-xl font-semibold">
                  {todayAttendance.punch_out 
                    ? new Date(todayAttendance.punch_out).toLocaleTimeString()
                    : 'Not punched out'}
                </p>
              </div>
              <div className="bg-dark-bg-tertiary p-6 rounded-lg">
                <p className="text-dark-text-secondary text-sm mb-2">Work Hours</p>
                <p className="text-dark-text-primary text-xl font-semibold">
                  {todayAttendance.work_hours ? `${todayAttendance.work_hours} hrs` : '0 hrs'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-dark-text-secondary mb-6">No attendance record for today</p>
          )}

          <div className="flex gap-4">
            {canPunchIn && (
              <button
                onClick={handlePunchIn}
                className="px-8 py-4 bg-green-500 text-white border-none rounded-md font-semibold cursor-pointer transition-colors hover:bg-green-600 text-lg"
              >
                🕐 Punch In
              </button>
            )}
            {canPunchOut && (
              <button
                onClick={handlePunchOut}
                className="px-8 py-4 bg-red-500 text-white border-none rounded-md font-semibold cursor-pointer transition-colors hover:bg-red-600 text-lg"
              >
                🕐 Punch Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-dark-bg-secondary border border-dark-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h2 className="text-dark-text-primary text-2xl font-bold">Attendance History (Last 30 Days)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-dark-bg-tertiary">
              <tr>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Date</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Punch In</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Punch Out</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Work Hours</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-dark-text-secondary">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendanceHistory.map((record) => (
                  <tr key={record._id} className="hover:bg-dark-bg-tertiary transition-colors">
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">
                      {record.punch_in ? new Date(record.punch_in).toLocaleTimeString() : '-'}
                    </td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">
                      {record.punch_out ? new Date(record.punch_out).toLocaleTimeString() : '-'}
                    </td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">
                      {record.work_hours ? `${record.work_hours} hrs` : '-'}
                    </td>
                    <td className="p-4 border-b border-dark-border">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'present' 
                          ? 'bg-green-500/20 text-green-500'
                          : record.status === 'late'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {record.status.toUpperCase()}
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

