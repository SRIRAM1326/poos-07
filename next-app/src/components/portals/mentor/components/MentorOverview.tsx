import React from 'react';
import { mentorMockData } from '../data/mentorMockData';
import { Briefcase, Users, Calendar, FolderGit2, Activity, ShieldCheck } from 'lucide-react';

export const MentorOverview: React.FC = () => {
  const { overview } = mentorMockData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="stat-box" style={{ borderLeftColor: 'var(--purple-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderGit2 size={20} color="var(--purple-primary)" /> {overview.activeProjects}
          </div>
          <div className="lbl">Active Projects</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--green-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--green-primary)" /> {overview.mentees}
          </div>
          <div className="lbl">Active Mentees</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--blue-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="var(--blue-primary)" /> {overview.upcomingSessions}
          </div>
          <div className="lbl">Upcoming Sessions</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--orange-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={20} color="var(--orange-primary)" /> {overview.codeReviews}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--orange-primary)' }}>
              <div><div style={{ fontWeight: 600 }}>4 PRs require your review</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Trading Dashboard</div></div>
              <button className="gold-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>Review Code</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--blue-primary)' }}>
              <div><div style={{ fontWeight: 600 }}>1 New Mentorship Request</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sneha Gupta (ML Guidance)</div></div>
              <button className="gold-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>View Request</button>
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
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green-primary)', marginTop: '6px' }} />
              <div><div style={{ fontWeight: 600, fontSize: '14px' }}>Merged PR #42</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Approved in Decentralized Identity</div></div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--purple-primary)', marginTop: '6px' }} />
              <div><div style={{ fontWeight: 600, fontSize: '14px' }}>Event Created</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>FastAPI Masterclass</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
