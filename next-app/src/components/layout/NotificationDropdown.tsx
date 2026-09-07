'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, GitPullRequest, ShieldCheck, Star, MessageSquare } from 'lucide-react';
import { api, getCurrentUserId, getWebSocketBaseUrl, getAuthToken } from '@/services/api';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let ws: WebSocket | null = null;

    async function connect() {
      const userId = getCurrentUserId();
      const token = getAuthToken();
      if (!userId || !token) return;

      try {
        const data = await api.getNotifications();
        const safeData = Array.isArray(data) ? data : [];
        setNotifications(safeData);
        setUnreadCount(safeData.filter((n: any) => !n.is_read).length);
      } catch (err) {
        console.error('Failed loading notifications:', err);
      }

      if (ws) return;
      try {
        ws = new WebSocket(`${getWebSocketBaseUrl()}/ws/notifications/${userId}?token=${encodeURIComponent(token)}`);
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'PONG') return;
          const title = data.payload?.title || data.title;
          if (title) {
            setNotifications(prev => [{ ...data?.payload, ...data, id: Date.now(), category: data.type || 'GAMIFICATION' }, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        };
        ws.onclose = () => { ws = null; };
      } catch (e) {
        console.log('WebSocket connect fallback to REST polling');
      }
    }

    connect();
    const timer = setInterval(connect, 15000);

    return () => {
      clearInterval(timer);
      if (ws) ws.close();
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed marking notifications as read:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GITHUB':
        return <GitPullRequest size={16} color="var(--accent-green)" />;
      case 'MENTORSHIP':
        return <Star size={16} color="var(--blue-primary)" />;
      case 'OUTREACH':
        return <MessageSquare size={16} color="var(--gold-primary)" />;
      default:
        return <ShieldCheck size={16} color="var(--purple-primary)" />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          color: 'var(--text-soft)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <Bell size={16} color="var(--text-main)" />
        <span>Alerts</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--accent-green)',
            color: '#0a0f1d',
            fontSize: '10px',
            fontWeight: 800,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '42px',
          right: 0,
          width: '360px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-subtle)'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Notifications & WebSocket Events
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No new notifications.
              </div>
            ) : (
              notifications.map((n, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    background: n.is_read ? 'transparent' : 'rgba(0, 245, 212, 0.04)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{getCategoryIcon(n.category)}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '2px' }}>{n.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
