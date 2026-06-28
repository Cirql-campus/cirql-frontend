import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { api, getErrorMessage } from '../utils/api';
import { normalizeAppLink } from '../utils/navigation';
import './WorkspacePages.css';

interface NotificationItem {
  _id: string;
  type: string;
  text: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface Pagination {
  hasMore: boolean;
  page: number;
}

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ hasMore: false, page: 1 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ notifications: NotificationItem[]; unreadCount: number; pagination?: Pagination }>('/notifications?page=1&limit=20');
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setPagination(res.pagination || { hasMore: false, page: 1 });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load notifications'));
    }
  }, []);

  const loadMore = async () => {
    if (!pagination.hasMore || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const nextPage = pagination.page + 1;
      const res = await api.get<{ notifications: NotificationItem[]; pagination?: Pagination }>(`/notifications?page=${nextPage}&limit=20`);
      setNotifications(prev => [...prev, ...res.notifications]);
      setPagination(res.pagination || { hasMore: false, page: nextPage });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load more notifications'));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    import('../utils/socket').then(({ getSocket }) => {
      const socket = getSocket();
      if (!socket) return;

      const handleNewNotification = ({ notification }: { notification: NotificationItem }) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      };

      socket.on('new_notification', handleNewNotification);
      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }).catch(() => {});
  }, []);

  const markAll = async () => {
    await api.put('/notifications/read-all', {});
    await load();
  };

  const openNotification = async (notification: NotificationItem) => {
    const target = notification.link ? normalizeAppLink(notification.link) : '';
    
    // Optimistically mark as read and decrement unread count
    if (!notification.read) {
      setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      if (!notification.read) await api.put(`/notifications/${notification._id}/read`, {});
    } catch (err) {
      setError(getErrorMessage(err, 'Could not mark notification as read'));
    }
    if (target) navigate(target);
    else await load();
  };

  return (
    <div className="workspace-page container">
      <div className="workspace-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread updates from CirQl.</p>
        </div>
        <Button variant="outline" onClick={markAll}><CheckCheck size={16} /> Mark all read</Button>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {notifications.length === 0 ? (
        <div className="empty-state">No notifications yet.</div>
      ) : (
        <div className="workspace-list">
          {notifications.map(notification => (
            <button className="workspace-card" key={notification._id} onClick={() => openNotification(notification)} style={{ textAlign: 'left' }}>
              <div className="card-kicker"><Bell size={14} /> {notification.type}</div>
              <h2>{notification.text}</h2>
              <p className="muted">{new Date(notification.createdAt).toLocaleString()}</p>
              {!notification.read && <span className="workspace-metrics"><span>Unread</span></span>}
            </button>
          ))}
          {pagination.hasMore && (
            <button className="apply-btn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
