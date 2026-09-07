'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { EventItem } from '@/types';
import { Calendar, MapPin, Users } from 'lucide-react';

interface EventsViewProps {
  onClose: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onClose }) => {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await api.getEvents();
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed loading events:', err);
      }
    }
    loadEvents();
  }, []);


  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="gold-card" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800 }}>
              Technical Open-Source Sprints & Hackathons
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Collaborative coding sprints organized by Colleges, Mentors, and IT Companies.
            </p>
          </div>
          <button onClick={onClose} className="gold-btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }}>
            Close
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map((evt) => (
            <div key={evt.id} style={{
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px',
              background: 'var(--bg-surface)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="gold-badge green" style={{ marginBottom: '8px' }}>{evt.event_type}</span>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>
                    {evt.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '4px' }}>
                    {evt.description}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {evt.event_date}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {evt.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {evt.participant_count} Registered</span>
                  </div>
                </div>

                <button className="gold-btn" style={{ fontSize: '12px', padding: '6px 14px' }}>
                  Register Sprint
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
