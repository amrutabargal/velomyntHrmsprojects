import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function formatSeconds(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}h ${m}m ${s}s`;
}

const TimeTracker = () => {
  const [live, setLive] = useState(null);
  const [daily, setDaily] = useState({ totalSeconds: 0, sessions: [] });
  const [runningSeconds, setRunningSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchLive();
    fetchDaily();
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLive = async () => {
    try {
      const res = await axios.get(`${API_URL}/time/live`);
      setLive(res.data.session);
      if (res.data.session) startTimer(res.data.session);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDaily = async () => {
    try {
      const res = await axios.get(`${API_URL}/time/daily`);
      setDaily(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startTimer = (session) => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const start = new Date(session.startAt);
      const now = new Date();
      const secs = Math.floor((now - start) / 1000);
      setRunningSeconds(secs);
    }, 1000);
  };

  const handleStart = async () => {
    try {
      const res = await axios.post(`${API_URL}/time/start`, { source: 'manual' });
      setLive(res.data.session);
      startTimer(res.data.session);
      fetchDaily();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStop = async () => {
    try {
      await axios.post(`${API_URL}/time/stop`);
      setLive(null);
      clearInterval(intervalRef.current);
      setRunningSeconds(0);
      fetchDaily();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Time Tracker</h1>
          <p className="page-subtitle">Track work sessions with live timer and daily summary</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="panel panel-body">
          <h3 className="panel-title mb-2">Live Session</h3>
          {live ? (
            <div className="mt-3">
              <div className="text-text-secondary">Started at: {new Date(live.startAt).toLocaleTimeString()}</div>
              <div className="text-2xl font-semibold mt-2 text-text-primary">{formatSeconds(runningSeconds)}</div>
              <div className="mt-3">
                <button onClick={handleStop} className="btn-sm-danger">Stop</button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="text-sm text-text-secondary">No active session</div>
              <div className="mt-3"><button onClick={handleStart} className="btn-sm-success">Start</button></div>
            </div>
          )}
        </div>

        <div className="panel panel-body md:col-span-2">
          <h3 className="panel-title mb-2">Today's Summary</h3>
          <div className="mt-3 text-text-secondary">Total: <span className="font-semibold text-text-primary">{formatSeconds(daily.totalSeconds || 0)}</span></div>
          <div className="mt-4">
            <div className="table-shell">
              <table className="table-base">
                <thead className="table-head">
                <tr>
                  <th className="table-head-cell">Start</th>
                  <th className="table-head-cell">End</th>
                  <th className="table-head-cell">Duration</th>
                </tr>
                </thead>
                <tbody>
                {daily.sessions && daily.sessions.length ? (
                  daily.sessions.map(s => (
                    <tr key={s._id} className="table-row">
                      <td className="table-cell">{new Date(s.startAt).toLocaleTimeString()}</td>
                      <td className="table-cell">{s.endAt ? new Date(s.endAt).toLocaleTimeString() : '-'}</td>
                      <td className="table-cell">{formatSeconds(((s.endAt ? new Date(s.endAt) : new Date()) - new Date(s.startAt)) / 1000)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="p-4 text-sm text-text-secondary">No sessions today</td></tr>
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
