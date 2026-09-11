import React, { useEffect, useState } from 'react';
import { api, getCurrentUserId } from '@/services/api';
import {
  Users, UserCheck, FolderGit2, Activity, BadgeCheck,
  Calendar, CalendarClock, Trophy, GitCommitHorizontal, Users2,
  Code2, GitBranch,
} from 'lucide-react';

interface CollegeOverviewStats {
  total_students: number;
  active_students: number;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_events: number;
  upcoming_events: number;
  total_hackathons: number;
  total_github_contributions: number;
  active_github_contributors: number;
  total_skills_identified: number;
  projects_with_github_activity: number;
}

interface CollegeProfileData {
  college_name?: string | null;
  overview?: CollegeOverviewStats | null;
}

const STAT_CARDS: {
  key: keyof CollegeOverviewStats;
  label: string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  { key: 'total_students', label: 'Total Students', hint: 'Students registered under the college', icon: <Users size={20} color="var(--purple-primary)" />, accent: 'var(--purple-primary)' },
  { key: 'active_students', label: 'Active Students', hint: 'Students currently active on POOS', icon: <UserCheck size={20} color="var(--green-primary)" />, accent: 'var(--green-primary)' },
  { key: 'total_projects', label: 'Total Projects', hint: 'Projects created or registered by students', icon: <FolderGit2 size={20} color="var(--blue-primary)" />, accent: 'var(--blue-primary)' },
  { key: 'active_projects', label: 'Active Projects', hint: 'Projects currently in development', icon: <Activity size={20} color="var(--orange-primary)" />, accent: 'var(--orange-primary)' },
  { key: 'completed_projects', label: 'Completed Projects', hint: 'Projects successfully completed', icon: <BadgeCheck size={20} color="var(--green-primary)" />, accent: 'var(--green-primary)' },
  { key: 'total_events', label: 'Total Events', hint: 'College events conducted or hosted', icon: <Calendar size={20} color="var(--purple-primary)" />, accent: 'var(--purple-primary)' },
  { key: 'upcoming_events', label: 'Upcoming Events', hint: 'Events scheduled in the future', icon: <CalendarClock size={20} color="var(--blue-primary)" />, accent: 'var(--blue-primary)' },
  { key: 'total_hackathons', label: 'Total Hackathons', hint: 'Hackathons available / organized', icon: <Trophy size={20} color="var(--orange-primary)" />, accent: 'var(--orange-primary)' },
  { key: 'total_github_contributions', label: 'Total GitHub Contributions', hint: 'Combined GitHub activity of students', icon: <GitCommitHorizontal size={20} color="var(--text-main)" />, accent: 'var(--text-main)' },
  { key: 'active_github_contributors', label: 'Active GitHub Contributors', hint: 'Students actively contributing on GitHub', icon: <Users2 size={20} color="var(--green-primary)" />, accent: 'var(--green-primary)' },
  { key: 'total_skills_identified', label: 'Total Skills Identified', hint: 'Technical skills from profiles / projects', icon: <Code2 size={20} color="var(--purple-primary)" />, accent: 'var(--purple-primary)' },
  { key: 'projects_with_github_activity', label: 'Projects With GitHub Activity', hint: 'Projects with actual GitHub contributions', icon: <GitBranch size={20} color="var(--blue-primary)" />, accent: 'var(--blue-primary)' },
];

export const CollegeOverview: React.FC = () => {
  const [profile, setProfile] = useState<CollegeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const stats = profile?.overview;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Overview — College Performance at a Glance</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
          {profile?.college_name ? `${profile.college_name} · ` : ''}A quick understanding of the college&apos;s overall activity and student performance.
        </p>
      </div>

      {error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load overview: {error}</div>
      ) : (
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
            Key Statistics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {STAT_CARDS.map((card) => (
              <div key={card.key} className="stat-box" style={{ borderLeftColor: card.accent }}>
                <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {card.icon} {loading ? '—' : (stats?.[card.key] ?? 0)}
                </div>
                <div className="lbl">{card.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{card.hint}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
