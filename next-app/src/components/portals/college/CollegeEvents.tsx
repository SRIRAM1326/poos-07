import React from 'react';
import { collegeMockData } from '@/data/collegeMockData';
import { Calendar, Globe, Users, Users2 } from 'lucide-react';

export const CollegeEvents: React.FC = () => {
  const { events } = collegeMockData;

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {events.map(ev => (
          <div key={ev.id} className="gold-card" style={{ cursor: 'pointer' }}>
            <div className="gold-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="gold-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>{ev.type}</span>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{ev.title}</h4>
                </div>
                <span className={`gold-badge ${ev.status === 'Upcoming' ? 'purple' : 'green'}`}>
                  {ev.status}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> {ev.date}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} /> {ev.registered} Registered
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                  {ev.scope === 'Open to Entire PoOS' ? <Globe size={14} /> : <Users2 size={14} />} 
                  Scope: <strong style={{ color: 'var(--text-main)' }}>{ev.scope}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
