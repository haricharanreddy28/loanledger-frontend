import React, { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';
import './NotificationBell.css';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data?.count ?? 0);
    } catch {
      // silent – don't disrupt UI on poll failure
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter(n => !n.isRead).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Use WebSockets for real-time updates
  useEffect(() => {
    const userId = user?.id || user?.userId;
    if (userId) {
      fetchUnreadCount();
      
      const onMessageReceived = (notification) => {
        // Update both the count and the list if it is open
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        console.log('New notification received:', notification.message);
      };

      connectWebSocket(userId, onMessageReceived);

      return () => {
        disconnectWebSocket();
      };
    }
  }, [user, fetchUnreadCount]);

  // When dropdown opens, load full list
  const handleOpen = () => {
    setOpen(true);
    fetchNotifications();
  };

  const handleClose = () => setOpen(false);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  return (
    <div className="notif-bell-wrapper">
      <button
        id="notification-bell-btn"
        className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={open ? handleClose : handleOpen}
        title="Notifications"
        aria-label={`${unreadCount} unread notifications`}
      >
        <i className="bi bi-bell-fill" />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Overlay to close on outside click */}
          <div className="notif-overlay" onClick={handleClose} />

          <div className="notif-dropdown" role="dialog" aria-label="Notifications">
            {/* Header */}
            <div className="notif-header">
              <span className="notif-header-title">
                <i className="bi bi-bell" />
                Notifications
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '999px',
                      padding: '1px 7px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  className="notif-mark-read-btn"
                  onClick={handleMarkAllRead}
                  id="mark-all-read-btn"
                >
                  ✓ Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="notif-list">
              {loading ? (
                <div className="notif-empty">
                  <div
                    className="spinner-border spinner-border-sm text-primary"
                    style={{ width: '1.5rem', height: '1.5rem', marginBottom: '8px' }}
                  />
                  <br />
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty">
                  <i className="bi bi-inbox" />
                  You're all caught up!
                  <br />
                  <span style={{ fontSize: '0.72rem', color: '#d1d5db' }}>
                    Notifications will appear here.
                  </span>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notif-dot" />
                    <div style={{ flex: 1 }}>
                      <div className="notif-msg">{n.message}</div>
                      <span className="notif-time">{formatTime(n.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="notif-footer">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
