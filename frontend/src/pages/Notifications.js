import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import velomyntLogo from '../image/velomyntlogo.png';

const getApiUrl = () => {
  const configuredApi = process.env.REACT_APP_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5001/api';
  }
  return configuredApi || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notificationId } = useParams();
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [compose, setCompose] = useState({
    type: 'company_announcement',
    title: '',
    message: '',
  });
  const canBroadcast = ['admin', 'subadmin'].includes(user?.role);
  const isDetailView = Boolean(notificationId);
  const selectedNotification = notificationId
    ? items.find((n) => String(n._id) === String(notificationId))
    : null;

  const refreshSidebarUnread = () => {
    window.dispatchEvent(new Event('notifications:updated'));
  };

  useEffect(() => {
    fetchNotifications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDateTime = (value) => {
    const dateObj = value ? new Date(value) : new Date();
    return dateObj.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const normalizeMessageContent = (rawMessage = '') => {
    if (!rawMessage) return '';
    const lines = String(rawMessage).split('\n');
    const filtered = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^velomynt hrms official notification$/i.test(trimmed)) return false;
      if (/^date\s*&\s*time\s*:/i.test(trimmed)) return false;
      return true;
    });
    return filtered.join('\n').trim();
  };

  const getMessagePreview = (fullMessage = '') => {
    const firstLine = normalizeMessageContent(fullMessage).split('\n').find((line) => line.trim()) || '';
    if (firstLine.length <= 120) return firstLine;
    return `${firstLine.slice(0, 120)}...`;
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setItems(res.data || []);
      refreshSidebarUnread();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error loading notifications');
    }
  };

  const markRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
      fetchNotifications();
      refreshSidebarUnread();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error marking notification');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      fetchNotifications();
      refreshSidebarUnread();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error marking all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_URL}/notifications/${id}`);
      fetchNotifications();
      refreshSidebarUnread();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error deleting notification');
    }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const cleanedMessage = normalizeMessageContent(compose.message);
      if (!cleanedMessage) {
        setMessage('Please enter notification message');
        setSending(false);
        return;
      }

      const payload = {
        ...compose,
        message: cleanedMessage,
      };
      await axios.post(`${API_URL}/notifications/broadcast`, payload);
      setMessage('Notification sent to users successfully');
      setCompose({
        type: 'company_announcement',
        title: '',
        message: '',
      });
      fetchNotifications();
      refreshSidebarUnread();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const apiMessage =
        error.response?.data?.message ||
        `Error sending notification${error.response?.status ? ` (HTTP ${error.response.status})` : ''}`;
      setMessage(apiMessage);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSending(false);
    }
  };

  const openNotification = async (notification) => {
    navigate(`/notifications/${notification._id}`);
    if (!notification.is_read) {
      await markRead(notification._id);
    }
  };

  const renderLetterheadTemplate = ({ title, body, dateValue }) => (
    <div className="rounded-2xl border border-border-light bg-surface-primary overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-border-light bg-primary-50">
        <img
          src={velomyntLogo}
          alt="Velomynt logo"
          className="w-full max-h-24 object-contain"
        />
      </div>
      <div className="p-5">
        <p className="font-semibold text-text-primary text-lg">{title || 'Company Notification'}</p>
        <p className="text-sm text-text-secondary mt-3 whitespace-pre-line">
          {body || 'Your message will appear here.'}
        </p>
      </div>
      <div className="px-5 py-4 border-t border-border-light bg-surface-tertiary">
        <div className="flex flex-col items-start gap-2">
          <img
            src={velomyntLogo}
            alt="Velomynt small logo"
            className="h-7 w-auto max-w-[140px] object-contain"
          />
          <p className="text-sm text-text-secondary font-medium">Regarding: Velomynt</p>
          <div className="w-full h-px bg-border-light my-1" />
          <p className="text-xs text-text-muted uppercase tracking-wide">Date & Time</p>
          <p className="text-base text-text-primary font-semibold">{formatDateTime(dateValue || new Date())}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      {isDetailView ? (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Notification Message</h1>
            </div>
            <button className="btn-secondary" onClick={() => navigate('/notifications')}>
              Back to Notifications
            </button>
          </div>

          {selectedNotification ? (
            <div className="panel panel-body">
              {renderLetterheadTemplate({
                title: selectedNotification.title,
                body: normalizeMessageContent(selectedNotification.message),
                dateValue: selectedNotification.created_at || selectedNotification.createdAt,
              })}
              <div className="mt-4 flex justify-end gap-2">
                {!selectedNotification.is_read && (
                  <button className="btn-sm-primary" onClick={() => markRead(selectedNotification._id)}>
                    Read
                  </button>
                )}
                <button
                  className="btn-sm-danger"
                  onClick={async () => {
                    await deleteNotification(selectedNotification._id);
                    navigate('/notifications');
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="panel panel-body text-sm text-text-secondary">
              Notification not found. It may have been deleted.
            </div>
          )}
        </>
      ) : (
        <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
        </div>
        <button className="btn-secondary" onClick={markAllRead}>Mark All Read</button>
      </div>

      {message && (
        <div className={message.toLowerCase().includes('error') ? 'alert-error' : 'alert-success'}>
          {message}
        </div>
      )}

      {canBroadcast && (
        <form onSubmit={sendBroadcast} className="panel panel-body mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={velomyntLogo}
                alt="Velomynt logo"
                className="w-12 h-12 rounded-xl object-cover border border-border-light"
              />
              <div>
                <h2 className="panel-title m-0">Admin / Subadmin Notification Template</h2>
                <p className="text-xs text-text-secondary">
                  Branding with company logo and auto date-time stamp
                </p>
              </div>
            </div>
            <div className="text-xs text-text-secondary">
              Current Time: {formatDateTime(new Date())}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select
              className="input-field"
              value={compose.type}
              onChange={(e) => setCompose({ ...compose, type: e.target.value })}
            >
              <option value="company_announcement">Company Announcement</option>
              <option value="leave_announcement">Leave Related</option>
              <option value="system_alert">System Alert</option>
            </select>
            <input
              className="input-field md:col-span-2"
              value={compose.title}
              onChange={(e) => setCompose({ ...compose, title: e.target.value })}
              placeholder="Notification title"
              required
            />
          </div>
          <textarea
            className="input-field"
            rows="4"
            value={compose.message}
            onChange={(e) => setCompose({ ...compose, message: e.target.value })}
            placeholder="Write official message for all users"
            required
          />
          <div className="mt-4">
            <p className="text-sm text-text-secondary">This notification will be sent to all active users.</p>
          </div>
          <div className="mt-4 p-4 rounded-xl border border-primary-200 bg-primary-50">
            <p className="text-xs text-text-secondary mb-2 font-semibold">Template Preview</p>
            {renderLetterheadTemplate({
              title: compose.title || 'Notification title',
              body: normalizeMessageContent(compose.message),
              dateValue: new Date(),
            })}
          </div>
          <div className="mt-4">
            <button
              className="btn-primary"
              type="submit"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      )}

      <div className="panel panel-body">
          <h2 className="panel-title">My Notifications ({items.length})</h2>
          {items.length === 0 ? (
            <div className="text-text-secondary text-sm">No notifications found</div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {items.map((n) => {
                return (
                  <div
                    key={n._id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      n.is_read
                          ? 'border-border-light bg-surface-primary'
                          : 'border-primary-200 bg-primary-50'
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openNotification(n)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openNotification(n);
                      }
                    }}
                  >
                    <div className="flex justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={velomyntLogo}
                          alt="Velomynt logo"
                          className="w-10 h-10 rounded-lg object-cover border border-border-light"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary">{n.title}</p>
                          <p className="text-sm text-text-secondary mt-1">{getMessagePreview(n.message)}</p>
                          <p className="text-xs text-text-muted mt-2">
                            Date & Time: {formatDateTime(n.created_at || n.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        {!n.is_read && (
                          <button
                            className="btn-sm-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(n._id);
                            }}
                          >
                            Read
                          </button>
                        )}
                        <button
                          className="btn-sm-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n._id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
      </>
      )}
    </div>
  );
};

export default Notifications;
