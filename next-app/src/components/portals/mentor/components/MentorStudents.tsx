import React from 'react';
import { mentorMockData } from '../data/mentorMockData';

export const MentorStudents: React.FC = () => {
  const { students } = mentorMockData;

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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <th style={{ padding: '16px' }}>Student</th>
                <th style={{ padding: '16px' }}>Focus Area</th>
                <th style={{ padding: '16px' }}>Progress</th>
                <th style={{ padding: '16px' }}>Next Session</th>
                <th style={{ padding: '16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.college}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{student.focus}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ width: '100px', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${student.progress}%`, height: '100%', background: 'var(--purple-primary)' }} />
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>{student.progress}% Completed</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: 'var(--purple-primary)', fontWeight: 500 }}>{student.nextSession}</td>
                  <td style={{ padding: '16px' }}>
                    <button style={{ padding: '6px 12px', background: 'transparent', color: 'var(--purple-primary)', border: '1px solid var(--purple-primary)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
