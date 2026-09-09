import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';

interface SessionItem {
  id: number;
  student_name?: string;
  topic?: string;
  scheduled_for?: string;
  status?: string;
}

export const MentorStudents: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const data = await api.getMentorSessions('STUDENT');
        if (!cancelled) setSessions(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load mentees.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Students & Mentees</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>Track progress, review tasks, and manage feedback</p>
        </div>
      </div>

      <div className="gold-card">
        <div className="gold-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading sessions...</div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load sessions: {error}</div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No mentee sessions yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px' }}>Student</th>
                  <th style={{ padding: '16px' }}>Topic</th>
                  <th style={{ padding: '16px' }}>Scheduled</th>
                  <th style={{ padding: '16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600 }}>{session.student_name || 'Student'}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{session.topic || '—'}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--purple-primary)', fontWeight: 500 }}>{session.scheduled_for || '—'}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{session.status || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
