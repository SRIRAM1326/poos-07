'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Trophy } from 'lucide-react';

interface LeaderboardsViewProps {
  onClose: () => void;
}

export const LeaderboardsView: React.FC<LeaderboardsViewProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'colleges'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [stList, colList] = await Promise.all([
          api.getStudentLeaderboard(),
          api.getCollegeLeaderboard()
        ]);
        setStudents(Array.isArray(stList) ? stList : []);
        setColleges(Array.isArray(colList) ? colList : []);
      } catch (err) {
        console.error('Failed loading leaderboards:', err);
      }
    }
    loadData();
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
      <div className="gold-card" style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={24} color="var(--gold-primary)" />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800 }}>
                PoOS Ecosystem Leaderboards
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Rankings based strictly on verified merged code, commits, code reviews, and active project output.
            </p>
          </div>
          <button onClick={onClose} className="gold-btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }}>
            Close
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('students')}
            className={activeTab === 'students' ? 'gold-btn' : 'gold-btn-outline'}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            🎓 Student Developer Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('colleges')}
            className={activeTab === 'colleges' ? 'gold-btn' : 'gold-btn-outline'}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            🏛️ College Institutional Leaderboard
          </button>
        </div>

        {/* Content */}
        {activeTab === 'students' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {students.map((st) => (
              <div key={st.rank} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-sm)',
                background: st.rank === 1 ? 'var(--gold-bg)' : 'var(--bg-surface)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: st.rank === 1 ? 'var(--gold-primary)' : 'var(--bg-subtle)',
                    color: st.rank === 1 ? '#ffffff' : 'var(--text-main)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontFamily: 'var(--font-mono)'
                  }}>
                    #{st.rank}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{st.full_name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {st.department} · {st.college_name}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: 'var(--gold-dark)' }}>
                    {st.reputation_score} pts
                  </div>
                  <span className="gold-badge green" style={{ fontSize: '10px' }}>✓ Verified PRs</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {colleges.map((col) => (
              <div key={col.rank} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--purple-bg)', color: 'var(--purple-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontFamily: 'var(--font-mono)'
                  }}>
                    #{col.rank}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{col.college_name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {col.location} · {col.student_count} Enrolled Developers
                    </div>
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--purple-primary)' }}>
                  {col.active_projects} Active Repositories
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
