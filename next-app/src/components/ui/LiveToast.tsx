import React from 'react';
import { LiveNotification } from '@/hooks/useLiveNotifications';
import { Trophy, Bell, X } from 'lucide-react';

interface LiveToastProps {
  notification: LiveNotification | null;
  onDismiss: () => void;
}

export const LiveToast: React.FC<LiveToastProps> = ({ notification, onDismiss }) => {
  if (!notification) return null;

  const isGamification = notification.type === 'GAMIFICATION';

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '16px',
      width: '320px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      zIndex: 9999,
      display: 'flex',
      gap: '12px',
      animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        background: isGamification ? 'rgba(234, 179, 8, 0.2)' : 'rgba(168, 85, 247, 0.2)',
        color: isGamification ? 'var(--orange-primary)' : 'var(--purple-primary)',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {isGamification ? <Trophy size={20} /> : <Bell size={20} />}
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
          {notification.payload.title}
        </h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-soft)', lineHeight: 1.4 }}>
          {notification.payload.message}
        </p>
      </div>

      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
        <X size={16} />
      </button>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
