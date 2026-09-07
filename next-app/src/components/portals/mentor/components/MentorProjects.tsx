import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { FolderGit2, Users, FileCode, CheckCircle2 } from 'lucide-react';

export const MentorProjects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getProjects();
        setProjects(data || []);
      } catch (err) {
        console.error('Failed loading mentor projects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-soft)' }}>Syncing with PoOS Ecosystem...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>My Projects</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>Manage projects, review PRs, and track contributions</p>
        </div>
        <button className="gold-btn" style={{ background: 'var(--purple-primary)' }}>
          + Create New Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {projects.map(proj => (
          <div key={proj.id} className="gold-card" style={{ cursor: 'pointer' }}>
            <div className="gold-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{proj.title}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--purple-primary)', fontWeight: 600, marginTop: '4px' }}>Role: {proj.owner_name ? 'Project Owner' : 'Mentor Reviewer'}</div>
                </div>
                <span className={`gold-badge ${proj.status === 'ACTIVE' ? 'green' : ''}`}>
                  {proj.status || 'Active'}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="var(--text-soft)" /> {proj.forks_count} Team
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileCode size={14} color={proj.stars_count > 0 ? "var(--orange-primary)" : "var(--text-soft)"} /> 
                  {proj.stars_count > 0 ? <strong style={{ color: 'var(--orange-primary)' }}>{proj.stars_count} PRs to Review</strong> : <span>0 Pending PRs</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
