import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Calendar, Globe, Users, Users2 } from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  organizer_name: string;
  event_type: string;
  description?: string | null;
  location: string;
  event_date: string;
  participant_count: number;
  scope: string;
  created_at?: string;
}

export const CollegeEvents: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const data = await api.getEvents();
        if (!cancelled) setEvents(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load events.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Events & Workshops</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading events...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Events & Workshops</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>Organize open technical sessions and meetups</p>
        </div>
        <button className="gold-btn" style={{ background: 'var(--purple-primary)' }}>
          + Create Event
        </button>
      </div>

      {error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load events: {error}</div>
      ) : events.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No events have been created yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {events.map(ev => (
            <div key={ev.id} className="gold-card" style={{ cursor: 'pointer' }}>
              <div className="gold-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span className="gold-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>{ev.event_type}</span>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{ev.title}</h4>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> {ev.event_date || '—'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> {ev.participant_count} Registered
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                    {ev.scope === 'Open to Entire PoOS' ? <Globe size={14} /> : <Users2 size={14} />}
                    Scope: <strong style={{ color: 'var(--text-main)' }}>{ev.scope}</strong>
                  </div>
                  {ev.organizer_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                      Organized by: <strong style={{ color: 'var(--text-main)' }}>{ev.organizer_name}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
