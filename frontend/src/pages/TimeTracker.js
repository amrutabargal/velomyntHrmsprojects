import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function formatSeconds(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}h ${m}m ${s}s`;
}

const TimeTracker = () => {
  const { user } = useAuth();
  const [live, setLive] = useState(null);
  const [daily, setDaily] = useState({ totalSeconds: 0, sessions: [] });
  const [runningSeconds, setRunningSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchLive();
    fetchDaily();
    return () => clearInterval(intervalRef.current);
  }, []);

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
      const res = await axios.post(`${API_URL}/time/stop`);
      setLive(null);
      clearInterval(intervalRef.current);
      setRunningSeconds(0);
      fetchDaily();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Time Tracker</h1>
        <p className="text-muted mt-1">Automatic login/logout tracking and manual start/stop</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold">Live Session</h3>
          {live ? (
            <div className="mt-3">
              <div>Started at: {new Date(live.startAt).toLocaleTimeString()}</div>
              <div className="text-xl font-semibold mt-2">{formatSeconds(runningSeconds)}</div>
              <div className="mt-3">
                <button onClick={handleStop} className="px-4 py-2 bg-red-600 text-white rounded">Stop</button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="text-sm text-muted">No active session</div>
              <div className="mt-3"><button onClick={handleStart} className="px-4 py-2 bg-green-600 text-white rounded">Start</button></div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white rounded shadow md:col-span-2">
          <h3 className="font-semibold">Today's Summary</h3>
          <div className="mt-3">Total: {formatSeconds(daily.totalSeconds || 0)}</div>
          <div className="mt-4">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-2">Start</th>
                  <th className="p-2">End</th>
                  <th className="p-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {daily.sessions && daily.sessions.length ? (
                  daily.sessions.map(s => (
                    <tr key={s._id} className="border-t">
                      <td className="p-2">{new Date(s.startAt).toLocaleTimeString()}</td>
                      <td className="p-2">{s.endAt ? new Date(s.endAt).toLocaleTimeString() : '-'}</td>
                      <td className="p-2">{formatSeconds(((s.endAt ? new Date(s.endAt) : new Date()) - new Date(s.startAt)) / 1000)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="p-4 text-sm text-muted">No sessions today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
