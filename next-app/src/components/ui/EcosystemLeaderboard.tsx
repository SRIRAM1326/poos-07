import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Trophy, Star, TrendingUp } from 'lucide-react';

interface LeaderboardProps {
  type: 'students' | 'colleges';
}

export const EcosystemLeaderboard: React.FC<LeaderboardProps> = ({ type }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const fetcher = type === 'students' ? api.getStudentLeaderboard : api.getCollegeLeaderboard;
        const res = await fetcher();
        if (active) setData(res || []);
      } catch (err) {
        console.error('Failed loading leaderboard:', err);
        if (active) setData([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [type]);

  if (loading) return <div style={{ color: 'var(--text-soft)', padding: '24px' }}>Loading Global {type === 'students' ? 'Student' : 'College'} Rankings...</div>;

  if (data.length === 0) return (
    <div className="gold-card" style={{ padding: '24px' }}>
      <div style={{ color: 'var(--text-soft)', fontSize: '13px' }}>No rankings available yet.</div>
    </div>
  );

  return (
    <div className="gold-card" style={{ padding: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Trophy size={24} color="var(--orange-primary)" />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
          Global {type === 'students' ? 'Student' : 'College'} Leaderboard
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.slice(0, 5).map((item, index) => (
          <div key={item.rank} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '12px',
            background: index === 0 ? 'rgba(234, 179, 8, 0.1)' : 'var(--bg-subtle)',
            border: index === 0 ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid transparent',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%', 
                background: index < 3 ? 'var(--orange-primary)' : 'var(--bg-muted)',
                color: index < 3 ? '#fff' : 'var(--text-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px'
              }}>
                {item.rank}
              </div>
              
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {type === 'students' ? item.full_name : item.college_name}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {type === 'students' ? `${item.college_name} · ${item.department}` : `${item.location} · ${item.student_count} Students`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--orange-primary)', fontWeight: 700 }}>
              {type === 'students' ? (
                <>
                  <Star size={16} /> {item.reputation_score} pts
                </>
              ) : (
                <>
                  <TrendingUp size={16} /> {item.active_projects} Open Projects
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
