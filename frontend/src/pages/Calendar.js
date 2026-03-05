import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const KALNIRNAY_FIXED_DAYS = [
  { md: '01-26', title: 'Republic Day' },
  { md: '03-08', title: "International Women's Day" },
  { md: '05-01', title: 'Maharashtra Day / Labour Day' },
  { md: '08-15', title: 'Independence Day' },
  { md: '10-02', title: 'Gandhi Jayanti' },
  { md: '12-25', title: 'Christmas Day' },
];

const Calendar = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [dayDetails, setDayDetails] = useState(null);

  useEffect(() => {
    fetchLeaves();
    fetchTimesheets();
  }, [month, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API_URL}/leave`, { params: { scope: 'all' } });
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimesheets = async () => {
    try {
      const res = await axios.get(`${API_URL}/timesheet`, { params: { scope: 'all' } });
      setTimesheets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getKalnirnayFixedDays = (year) => {
    return KALNIRNAY_FIXED_DAYS.map((item, idx) => ({
      id: `kalnirnay-${year}-${idx}`,
      date: `${year}-${item.md}`,
      title: item.title,
    }));
  };

  const mergeHolidays = (primary = [], secondary = []) => {
    const seen = new Set();
    return [...primary, ...secondary]
      .filter((item) => {
        const key = `${item.date}::${String(item.title || '').trim().toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  };

  const fetchHolidays = async () => {
    try {
      const year = month.getFullYear();
      const monthNumber = month.getMonth() + 1;
      const res = await axios.get(`${API_URL}/holidays`, {
        params: { year, month: monthNumber },
      });

      const kalnirnayDays = getKalnirnayFixedDays(year).filter(
        (item) => Number(item.date.split('-')[1]) === monthNumber
      );
      setHolidays(mergeHolidays(res.data || [], kalnirnayDays));
    } catch (error) {
      console.error('Holiday fetch failed:', error.message);
      const year = month.getFullYear();
      const monthNumber = month.getMonth() + 1;
      const kalnirnayDays = getKalnirnayFixedDays(year).filter(
        (item) => Number(item.date.split('-')[1]) === monthNumber
      );
      setHolidays(kalnirnayDays);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const toDateKey = (dateObj) => {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDate = (year, monthIndex, day) => {
    return toDateKey(new Date(Date.UTC(year, monthIndex, day)));
  };

  const parseDateKey = (dateKey) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const getLeavesForDate = (dateStr) => {
    return leaves.filter(l => {
      const start = toDateKey(new Date(l.start_date));
      const end = toDateKey(new Date(l.end_date));
      return dateStr >= start && dateStr <= end;
    });
  };

  const getTimesheetsForDate = (dateStr) => {
    return timesheets.filter(t => {
      const tDate = toDateKey(new Date(t.date));
      return tDate === dateStr;
    });
  };

  const getHolidaysForDate = (dateStr) => {
    return holidays.filter((h) => h.date === dateStr);
  };

  const isWeekendDate = (year, monthIndex, day) => {
    const weekDay = new Date(year, monthIndex, day).getDay();
    return weekDay === 0 || weekDay === 6;
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
    const dayHolidays = getHolidaysForDate(dateStr);
    const isWeekend = isWeekendDate(month.getFullYear(), month.getMonth(), day);
    setDayDetails({
      date: dateStr,
      leaves: dayLeaves,
      timesheets: dayTs,
      holidays: dayHolidays,
      isWeekend,
    });
  };

  const daysInMonth = getDaysInMonth(month);
  const firstDay = getFirstDayOfMonth(month);
  const monthName = month.toLocaleString('default', { month: 'long', year: 'numeric' });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const leaveCellColor = 'bg-red-100 border-red-500';

  useEffect(() => {
    fetchHolidays();
  }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">View all leave, holiday and timesheet entries by date</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Calendar */}
        <div className="col-span-2 panel panel-body">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrevMonth} className="btn-secondary px-4 py-2">&lt; Prev</button>
            <h2 className="text-xl font-semibold text-text-primary">{monthName}</h2>
            <button onClick={handleNextMonth} className="btn-secondary px-4 py-2">Next &gt;</button>
          </div>
          <button onClick={handleToday} className="btn-primary mb-4 px-4 py-2">Today</button>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {days.map(d => <div key={d} className="p-2 font-semibold text-center">{d}</div>)}
          </div>

          {/* Empty cells */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 bg-surface-tertiary rounded"></div>
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDate(month.getFullYear(), month.getMonth(), day);
              const dayLeaves = getLeavesForDate(dateStr);
              const dayTs = getTimesheetsForDate(dateStr);
              const dayHolidays = getHolidaysForDate(dateStr);
              const isWeekend = isWeekendDate(month.getFullYear(), month.getMonth(), day);
              const hasLeave = dayLeaves.length > 0;
              const hasTimesheet = dayTs.length > 0;
              const hasHoliday = dayHolidays.length > 0;
              const approvedLeaves = dayLeaves.filter((l) => l.status === 'approved').length;
              const pendingLeaves = dayLeaves.filter((l) => l.status === 'pending').length;
              const defaultColor = isWeekend ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300';

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`p-3 rounded-xl border-2 cursor-pointer hover:shadow-lg transition ${
                    hasLeave ? leaveCellColor : defaultColor
                  } ${hasTimesheet ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  <div className="font-semibold">{day}</div>
                  <div className="text-xs mt-1">
                    {isWeekend && <div className="text-blue-700">Weekend</div>}
                    {hasLeave && (
                      <div className="text-red-700 font-medium">
                        📅 Leave ({dayLeaves.length})
                      </div>
                    )}
                    {pendingLeaves > 0 && <div className="text-yellow-700">Pending: {pendingLeaves}</div>}
                    {approvedLeaves > 0 && <div className="text-green-700">Approved: {approvedLeaves}</div>}
                    {hasHoliday && <div className="text-purple-700">🎉 Holiday ({dayHolidays.length})</div>}
                    {hasTimesheet && <div className="text-yellow-600">📝 TS</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-surface-tertiary rounded-xl">
            <div className="font-semibold mb-2">Legend:</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
                <span>Leave Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
                <span>Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded"></div>
                <span>Pending Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-700">🎉</span>
                <span>Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">📝</span>
                <span>Timesheet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="col-span-1 panel panel-body">
          <h3 className="text-lg font-semibold mb-4">Day Details</h3>
          {dayDetails ? (
            <div>
              <div className="mb-4">
                <div className="font-semibold text-lg">
                  {parseDateKey(dayDetails.date).toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Day type */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Day Type</h4>
                <div className="text-sm">
                  {dayDetails.isWeekend ? (
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">Weekend (Weekly Off)</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">Working Day</span>
                  )}
                </div>
              </div>

              {/* Holidays */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Holidays</h4>
                {dayDetails.holidays?.length ? (
                  <ul className="text-sm space-y-2">
                    {dayDetails.holidays.map((h) => (
                      <li key={h.id} className="p-2 bg-purple-50 rounded border-l-4 border-purple-500">
                        <div className="font-semibold">{h.title}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No holidays</p>
                )}
              </div>

              {/* Leaves for this day */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Leaves</h4>
                {dayDetails.leaves.length === 0 ? (
                  <p className="text-sm text-muted">
                    {dayDetails.isWeekend ? 'No leave requests (Weekly off day)' : 'No leaves'}
                  </p>
                ) : (
                  <ul className="text-sm space-y-2">
                    {dayDetails.leaves.map(l => (
                      <li
                        key={l._id}
                        className={`p-2 rounded border-l-4 ${
                          l.status === 'approved'
                            ? 'bg-green-50 border-green-500'
                            : l.status === 'pending'
                            ? 'bg-yellow-50 border-yellow-500'
                            : l.status === 'rejected'
                            ? 'bg-red-50 border-red-500'
                            : 'bg-gray-50 border-gray-500'
                        }`}
                      >
                        <div className="font-semibold">
                          {(l.user?.name || 'Employee')} - {l.leave_type.toUpperCase()}
                        </div>
                        <div className="text-xs uppercase font-medium mt-1">{l.status}</div>
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
