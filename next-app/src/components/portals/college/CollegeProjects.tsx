import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Globe, Users2, FolderGit2, Users } from 'lucide-react';

export const CollegeProjects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getProjects();
        // optionally filter for college specific ones, or show all
        setProjects(data || []);
      } catch (err) {
        console.error('Failed loading college projects:', err);
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
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>College Projects</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>Manage projects, define skills, and open for ecosystem participation</p>
        </div>
        <button className="gold-btn" style={{ background: 'var(--purple-primary)' }}>
          + Create Open Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {projects.map(proj => (
          <div key={proj.id} className="gold-card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
            <div className="gold-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{proj.title}</h4>
                <span className={`gold-badge ${proj.status === 'Active' ? 'green' : ''}`}>
                  {proj.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {(proj.tech_stack_json || []).map((skill: string) => (
                   <span key={skill} style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{skill}</span>
                ))}
              </div>

              <div style={{ padding: '8px', background: 'var(--bg-subtle)', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {proj.scope === 'Open to Entire PoOS' ? <Globe size={14} color="var(--purple-primary)"/> : <Users2 size={14} color="var(--orange-primary)"/>}
                Participation: <strong>{proj.scope || 'Open to Entire PoOS'}</strong>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="var(--text-soft)" /> {proj.forks_count} Contributors
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FolderGit2 size={14} color="var(--text-soft)" /> {proj.stars_count} Stars
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
