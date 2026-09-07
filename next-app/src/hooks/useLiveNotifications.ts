import { useEffect, useState } from 'react';
import { getWebSocketBaseUrl, getAuthToken } from '@/services/api';

export interface LiveNotification {
  type: string;
  payload: {
    title: string;
    message: string;
    score_update?: number;
  };
}

export const useLiveNotifications = (userId: number) => {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [latestNotification, setLatestNotification] = useState<LiveNotification | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !userId) return;

    const wsUrl = `${getWebSocketBaseUrl()}/ws/notifications/${userId}?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to Ecosystem Live Notifications (WS)');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PONG') return; // Ignore ping/pong
        
        setNotifications((prev) => [data, ...prev]);
        setLatestNotification(data);
        
        // Auto-clear latest after 5 seconds to dismiss the toast
        setTimeout(() => setLatestNotification(null), 5000);
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Ecosystem Live Notifications');
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  return { notifications, latestNotification };
};
