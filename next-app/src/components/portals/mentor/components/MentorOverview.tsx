import React from 'react';
import { FolderGit2, Users, Calendar, Briefcase, Activity, ShieldCheck } from 'lucide-react';

export const MentorOverview: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="stat-box" style={{ borderLeftColor: 'var(--purple-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderGit2 size={20} color="var(--purple-primary)" /> —
          </div>
          <div className="lbl">Active Projects</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--green-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--green-primary)" /> —
          </div>
          <div className="lbl">Active Mentees</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--blue-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="var(--blue-primary)" /> —
          </div>
          <div className="lbl">Upcoming Sessions</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--orange-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={20} color="var(--orange-primary)" /> —
          </div>
          <div className="lbl">Code Reviews Done</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="gold-card">
          <div className="gold-card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
              <ShieldCheck size={18} color="var(--purple-primary)" /> Action Items
            </h3>
          </div>
          <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              <p>No pending action items.</p>
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
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              <p>No recent activity to show.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
