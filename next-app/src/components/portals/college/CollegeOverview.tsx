import React from 'react';
import { collegeMockData } from '@/data/collegeMockData';
import { Users, ShieldCheck, Activity, FolderGit2, Trophy, BarChart3, TrendingUp } from 'lucide-react';
import { EcosystemLeaderboard } from '@/components/ui/EcosystemLeaderboard';

export const CollegeOverview: React.FC = () => {
  const { overview } = collegeMockData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="stat-box" style={{ borderLeftColor: 'var(--purple-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--purple-primary)" /> {overview.totalStudents}
          </div>
          <div className="lbl">Total Students</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--green-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="var(--green-primary)" /> {overview.activeStudents}
          </div>
          <div className="lbl">Verified & Active</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--blue-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--blue-primary)" /> {overview.studentContributions}
          </div>
          <div className="lbl">Student Contributions</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--orange-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderGit2 size={20} color="var(--orange-primary)" /> {overview.activeProjects}
          </div>
          <div className="lbl">Active Projects</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="gold-card">
          <div className="gold-card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
              <BarChart3 size={18} color="var(--purple-primary)" /> Activity Growth Chart
            </h3>
          </div>
          <div className="gold-card-body" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <TrendingUp size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
              <p>Activity Chart Visualization (Mock)</p>
            </div>
          </div>
        </div>

        <div className="gold-card">
          <div className="gold-card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
              <Activity size={18} color="var(--purple-primary)" /> Recent Activity
            </h3>
          </div>
          <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--purple-primary)', marginTop: '6px' }} />
              <div><div style={{ fontWeight: 600, fontSize: '14px' }}>Project Published</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Trading Dashboard is now open</div></div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green-primary)', marginTop: '6px' }} />
              <div><div style={{ fontWeight: 600, fontSize: '14px' }}>Event Created</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Web3 Builder Meetup</div></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <EcosystemLeaderboard type="students" />
        <EcosystemLeaderboard type="colleges" />
      </div>
    </div>
  );
};
