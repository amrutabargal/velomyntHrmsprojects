import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Calendar = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [dayDetails, setDayDetails] = useState(null);

  useEffect(() => {
    fetchLeaves();
    fetchTimesheets();
  }, [month]);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API_URL}/leave`);
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimesheets = async () => {
    try {
      const res = await axios.get(`${API_URL}/timesheet`);
      setTimesheets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year, month, day) => {
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const getLeavesForDate = (dateStr) => {
    return leaves.filter(l => {
      const start = new Date(l.start_date).toISOString().split('T')[0];
      const end = new Date(l.end_date).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end && l.status === 'approved';
    });
  };

  const getTimesheetsForDate = (dateStr) => {
    return timesheets.filter(t => {
      const tDate = new Date(t.date).toISOString().split('T')[0];
      return tDate === dateStr;
    });
  };

  const handlePrevMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1));
  };

  const handleToday = () => {
    setMonth(new Date());
  };

  const handleDayClick = (day) => {
    const dateStr = formatDate(month.getFullYear(), month.getMonth(), day);
    const dayLeaves = getLeavesForDate(dateStr);
    const dayTs = getTimesheetsForDate(dateStr);
    setDayDetails({ date: dateStr, leaves: dayLeaves, timesheets: dayTs });
  };

  const daysInMonth = getDaysInMonth(month);
  const firstDay = getFirstDayOfMonth(month);
  const monthName = month.toLocaleString('default', { month: 'long', year: 'numeric' });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const leaveColors = { casual: 'bg-blue-100 border-blue-500', sick: 'bg-red-100 border-red-500', paid: 'bg-green-100 border-green-500' };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted mt-1">View leaves and timesheet entries by date</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Calendar */}
        <div className="col-span-2 bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrevMonth} className="px-4 py-2 bg-gray-200 rounded">&lt; Prev</button>
            <h2 className="text-xl font-semibold">{monthName}</h2>
            <button onClick={handleNextMonth} className="px-4 py-2 bg-gray-200 rounded">Next &gt;</button>
          </div>
          <button onClick={handleToday} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded">Today</button>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {days.map(d => <div key={d} className="p-2 font-semibold text-center">{d}</div>)}
          </div>

          {/* Empty cells */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 bg-gray-100 rounded"></div>
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDate(month.getFullYear(), month.getMonth(), day);
              const dayLeaves = getLeavesForDate(dateStr);
              const dayTs = getTimesheetsForDate(dateStr);
              const hasLeave = dayLeaves.length > 0;
              const hasTimesheet = dayTs.length > 0;
              const leaveType = dayLeaves[0]?.leave_type;
              const leaveColor = leaveType ? leaveColors[leaveType] : '';

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`p-3 rounded border-2 cursor-pointer hover:shadow-lg transition ${
                    hasLeave ? leaveColor : 'bg-white border-gray-300'
                  } ${hasTimesheet ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  <div className="font-semibold">{day}</div>
                  <div className="text-xs mt-1">
                    {hasLeave && <div className="text-red-600">📅 Leave</div>}
                    {hasTimesheet && <div className="text-yellow-600">📝 TS</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <div className="font-semibold mb-2">Legend:</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
                <span>Casual Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
                <span>Sick Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                <span>Paid Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">📝</span>
                <span>Timesheet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="col-span-1 bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Day Details</h3>
          {dayDetails ? (
            <div>
              <div className="mb-4">
                <div className="font-semibold text-lg">
                  {new Date(dayDetails.date).toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Leaves for this day */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Leaves</h4>
                {dayDetails.leaves.length === 0 ? (
                  <p className="text-sm text-muted">No leaves</p>
                ) : (
                  <ul className="text-sm space-y-2">
                    {dayDetails.leaves.map(l => (
                      <li key={l._id} className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                        <div className="font-semibold">{l.leave_type.toUpperCase()}</div>
                        <div className="text-xs text-muted">{l.reason}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Timesheets for this day */}
              <div>
                <h4 className="font-semibold mb-2">Timesheets</h4>
                {dayDetails.timesheets.length === 0 ? (
                  <p className="text-sm text-muted">No timesheet entries</p>
                ) : (
                  <ul className="text-sm space-y-2">
                    {dayDetails.timesheets.map(t => (
                      <li key={t._id} className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-500">
                        <div className="font-semibold">{t.hours_worked}h - {t.task_description}</div>
                        <div className="text-xs text-muted">{t.project_name || 'No project'}</div>
                        <div className="text-xs mt-1 bg-white px-2 py-1 rounded">{t.status}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted">Click a day to see details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
