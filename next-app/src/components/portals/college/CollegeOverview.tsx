import React, { useEffect, useState } from 'react';
import { api, getCurrentUserId } from '@/services/api';
import { Users, ShieldCheck, Activity, FolderGit2, BarChart3, TrendingUp } from 'lucide-react';
import { EcosystemLeaderboard } from '@/components/ui/EcosystemLeaderboard';

interface CollegeProfileData {
  student_count?: number | null;
  active_projects_count?: number | null;
  verified_students_count?: number | null;
  college_name?: string | null;
  total_contributions?: { commits?: number; prs?: number } | null;
}

export const CollegeOverview: React.FC = () => {
  const [profile, setProfile] = useState<CollegeProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      const userId = getCurrentUserId();
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getCollegeProfile(userId);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const totalContributions = profile?.total_contributions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="stat-box" style={{ borderLeftColor: 'var(--purple-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--purple-primary)" /> {loading ? '—' : (profile?.student_count ?? '—')}
          </div>
          <div className="lbl">Total Students</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--green-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="var(--green-primary)" /> {loading ? '—' : (profile?.verified_students_count ?? '—')}
          </div>
          <div className="lbl">Verified & Active</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--blue-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--blue-primary)" /> {loading ? '—' : (totalContributions?.commits ?? 0)}
          </div>
          <div className="lbl">Contributions</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: 'var(--orange-primary)' }}>
          <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderGit2 size={20} color="var(--orange-primary)" /> {loading ? '—' : (profile?.active_projects_count ?? '—')}
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
              <p>No activity data available yet.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <EcosystemLeaderboard type="students" />
        <EcosystemLeaderboard type="colleges" />
      </div>
    </div>
  );
};
