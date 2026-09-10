'use client';

import React, { useEffect, useState } from 'react';
import { api, getCurrentUserId } from '@/services/api';
import { StudentProfile, Project } from '@/types';
import {
  CheckCircle,
  Code,
  Zap,
  PlusCircle,
  Compass,
  UserCheck,
  Bot,
  Users,
  Bell,
  Sparkles,
  Flame,
  GitCommit,
} from 'lucide-react';

import { MentorBookingModal } from './MentorBookingModal';
import { CreateProjectModal } from '../workspace/CreateProjectModal';
import { SuperProfileView } from './SuperProfileView';
import { ProfileSetupModal } from '../auth/ProfileSetupModal';

interface StudentDashboardProps {
  onSelectProject: (projectId: number) => void;
  activeTab?: string;
  onOpenCertificates?: () => void;
  currentUser?: any;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectProject,
  activeTab = 'dashboard',
  onOpenCertificates,
  currentUser
}) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<{ id: number; name: string } | null>(null);

  // Filters & State
  const [projectSubTab, setProjectSubTab] = useState<'ALL' | 'CREATED' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const connectGithub = async () => {
    try {
      const result = await api.getGitHubAuthUrl();
      window.location.href = result.auth_url;
    } catch (err: any) {
      alert(err?.message || 'GitHub OAuth is not configured on the server.');
    }
  };

  const requestMentorship = (mentor: { id: number; name: string }) => {
    setSelectedMentor(mentor);
    setShowBookingModal(true);
  };

  const loadData = React.useCallback(async (silent: boolean = false) => {
    try {
      const userId = currentUser?.id || getCurrentUserId();
      if (!userId) return;
      const profData = await api.getStudentProfile(userId);
      const projData = await api.getProjects();
      setProfile(profData);
      if (!silent) setProjects(projData);
    } catch (err) {
      console.error('Failed loading student dashboard:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh the dashboard so contributions and GitHub activity that arrive
  // via the webhook pipeline appear live without a page reload.
  useEffect(() => {
    const timer = window.setInterval(() => loadData(true), 30000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  useEffect(() => {
    if (!activeTab || activeTab === 'dashboard') return;
    setTimeout(() => {
      const sectionMap: Record<string, string> = {
        'projects': 'projects-section',
        'contributions': 'contributions-section',
        'skills': 'skills-section',
        'achievements': 'achievements-section',
        'recommendations': 'recommendations-section',
        'notifications': 'notifications-section',
        'super_profile': 'super-profile-section'
      };
      const elemId = sectionMap[activeTab];
      if (elemId) {
        document.getElementById(elemId)?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, [activeTab, loading]);

  if (loading || !profile) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--gold-dark)', fontFamily: 'var(--font-heading)', fontSize: '18px' }}>
        ✨ Loading PoOS Student Super Profile & Dashboard Engine...
      </div>
    );
  }

  // If user selected "My Super Profile" tab directly, render dedicated Super Profile view
  if (activeTab === 'super_profile') {
    return (
      <div id="super-profile-section">
        <SuperProfileView
          profile={profile}
          projects={projects}
          onSelectProject={onSelectProject}
          onOpenCertificates={onOpenCertificates}
        />
      </div>
    );
  }

  // Filter projects by sub-tab
  const myUserId = currentUser?.id || getCurrentUserId();
  const filteredProjects = projects.filter(p => {
    if (projectSubTab === 'CREATED') return p.owner_id === myUserId;
    if (projectSubTab === 'ACTIVE') return p.status === 'IN_PROGRESS' || p.status === 'ACTIVE';
    if (projectSubTab === 'COMPLETED') return p.status === 'COMPLETED';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ------------------------------------------------------------- */}
      {/* 1. Dashboard Overview / Welcome & Quick Actions */}
      {/* ------------------------------------------------------------- */}
      <div className="gold-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #ffffff 0%, #fffbe6 60%, #ecfdf5 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            <div style={{
              width: '92px',
              height: '92px',
              borderRadius: '50%',
              border: '3px solid var(--gold-primary)',
              objectFit: 'cover',
              boxShadow: 'var(--shadow-gold)',
              background: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--gold-dark)',
              fontFamily: 'var(--font-heading)',
              overflow: 'hidden'
            }}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Student Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (profile.full_name || 'S').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Welcome back, {profile.full_name || 'Student'} 👋
                </h1>
                <span className="gold-badge green">
                  <CheckCircle size={12} /> {profile.verified_by_college ? 'College Verified' : 'Student'}
                </span>
                <span className="gold-badge amber">
                  <Flame size={12} /> {profile.streak_days || 0}-Day Streak
                </span>
              </div>

              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold-dark)', marginTop: '4px' }}>
                {profile.department} · {profile.college_name} ({profile.year_of_study})
              </p>

              {/* Profile Completion Bar */}
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, maxWidth: '240px', height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${profile.profile_completion_pct || 0}%`, height: '100%', background: 'var(--gold-primary)' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-dark)', fontFamily: 'var(--font-mono)' }}>
                  {profile.profile_completion_pct || 0}% Profile Completion
                </span>
              </div>
            </div>
          </div>

          {/* Contribution Score Badge & Primary CTA */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '2px solid var(--gold-primary)',
              padding: '12px 20px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Reputation Score
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: 'var(--gold-dark)', lineHeight: '1' }}>
                {profile.contribution_score || profile.reputation_score} <span style={{ fontSize: '15px' }}>pts</span>
              </div>
            </div>

            <button
              onClick={() => document.getElementById('mentors-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="gold-btn"
              style={{ fontSize: '13px', background: 'var(--blue-primary)', color: '#ffffff' }}
            >
              + Request Architecture Mentorship
            </button>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--gold-border)', flexWrap: 'wrap' }}>
          <button onClick={() => setShowCreateProject(true)} className="gold-btn" style={{ fontSize: '13px', padding: '8px 16px' }}>
            <PlusCircle size={15} /> Create Project
          </button>

          <button onClick={() => document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' })} className="gold-btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
            <Compass size={15} /> Discover Projects
          </button>

          {profile.github_url ? (
            <a href={profile.github_url} target="_blank" rel="noreferrer" className="gold-btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
              <Code size={15} /> GitHub {profile.github_handle ? `(@${profile.github_handle})` : ''}
            </a>
          ) : (
            <button onClick={connectGithub} className="gold-btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
              <Code size={15} /> Connect GitHub via OAuth
            </button>
          )}

          <button onClick={() => setShowProfileSetup(true)} className="gold-btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
            <UserCheck size={15} /> Update Profile
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Contribution Statistics ⭐ (9 Main KPI Cards) */}
      {/* ------------------------------------------------------------- */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--gold-primary)" />
          2. Contribution Statistics ⭐
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div className="stat-box">
            <div className="num">{profile.contribution_score ?? 0} <span>pts</span></div>
            <div className="lbl">Contribution Score</div>
          </div>
          <div className="stat-box">
            <div className="num">{profile.active_projects_count ?? 0} <span>repos</span></div>
            <div className="lbl">Active Projects</div>
          </div>
          <div className="stat-box">
            <div className="num">{profile.total_commits ?? 0} <span>commits</span></div>
            <div className="lbl">Total Commits</div>
          </div>
          <div className="stat-box">
            <div className="num">{profile.total_prs ?? 0} <span>PRs</span></div>
            <div className="lbl">Pull Requests</div>
          </div>
          <div className="stat-box">
            <div className="num" style={{ color: 'var(--accent-green)' }}>{profile.merged_prs ?? 0} <span>merged</span></div>
            <div className="lbl">Merged PRs</div>
          </div>
          <div className="stat-box">
            <div className="num">{profile.issues_solved ?? 0} <span>solved</span></div>
            <div className="lbl">Issues Solved</div>
          </div>
          <div className="stat-box">
            <div className="num">{profile.code_reviews ?? 0} <span>reviews</span></div>
            <div className="lbl">Code Reviews</div>
          </div>
          <div className="stat-box">
            <div className="num" style={{ color: 'var(--gold-dark)' }}>{profile.college_rank ? `#${profile.college_rank}` : '—'} <span>{profile.college_total_students ? `/ ${profile.college_total_students}` : ''}</span></div>
            <div className="lbl">🏫 College Rank</div>
          </div>
          <div className="stat-box">
            <div className="num" style={{ color: 'var(--purple-primary)' }}>{profile.global_rank ? `#${profile.global_rank}` : '—'} <span>{profile.global_total_devs ? `/ ${(profile.global_total_devs / 1000).toFixed(1)}k` : ''}</span></div>
            <div className="lbl">🌍 Global Rank</div>
          </div>
        </div>
      </div>

      {/* GitHub Webhook Trigger Card */}
      <div className="gold-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="gold-badge green">GitHub Webhook Pipeline Active</span>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Handle: <b>@{profile.github_handle}</b>
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, marginTop: '6px' }}>
              Real-time Ingestion via X-Hub-Signature-256 Webhooks
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '2px' }}>
              Pushes and merged pull requests automatically calculate skill reputation points (+35 pts per merged PR) in PostgreSQL database.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. My Projects */}
      {/* ------------------------------------------------------------- */}
      <div className="gold-card" id="projects-section">
        <div className="gold-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={18} color="var(--gold-primary)" />
              3. My Projects & Workspace Repositories
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Created projects, active collaborations, and completed repositories
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {(['ALL', 'CREATED', 'ACTIVE', 'COMPLETED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setProjectSubTab(tab)}
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: projectSubTab === tab ? 700 : 500,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: projectSubTab === tab ? '1px solid var(--gold-primary)' : '1px solid var(--border-color)',
                  background: projectSubTab === tab ? 'var(--gold-bg)' : 'transparent',
                  color: projectSubTab === tab ? 'var(--gold-dark)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            ))}

            <button onClick={() => setShowCreateProject(true)} className="gold-btn" style={{ fontSize: '12px', padding: '6px 12px' }}>
              + Create Project
            </button>
          </div>
        </div>

        <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              style={{
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px',
                background: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4
                    onClick={() => onSelectProject(proj.id)}
                    style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
                  >
                    {proj.title}
                  </h4>
                  <span className="gold-badge blue">{proj.project_type}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '4px' }}>
                  {proj.tagline || proj.description}
                </p>

                {/* Team & Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>• Rights: {proj.rights_tag}</span>
                  <span>• Stars: ⭐ {proj.stars_count}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {(proj.tech_stack_json || []).map((t, i) => (
                    <span key={i} style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      background: 'var(--bg-subtle)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--text-muted)'
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => onSelectProject(proj.id)} className="gold-btn" style={{ fontSize: '13px', padding: '8px 16px' }}>
                  Continue Working ↗
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Recent Contributions Feed */}
      {/* ------------------------------------------------------------- */}
      <div className="gold-card" id="contributions-section">
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCommit size={18} color="var(--accent-green)" />
            4. Recent Contributions Timeline
          </h3>
          <span className="gold-badge green">Live Sync</span>
        </div>
        <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {profile.activity_timeline?.map((item) => (
            <div key={item.id} style={{
              padding: '14px 18px',
              background: 'var(--bg-subtle)',
              borderRadius: '8px',
              borderLeft: `4px solid ${item.type === 'PR_MERGED' ? 'var(--accent-green)' : item.type === 'ISSUE_SOLVED' ? 'var(--blue-primary)' : 'var(--gold-primary)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  Project: <b>{item.project_name}</b> · {item.details}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="gold-badge" style={{ fontSize: '11px' }}>
                  {item.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. Verified Skills Section (Evidence-Backed) */}
      {/* ------------------------------------------------------------- */}
      <div className="gold-card" id="skills-section">
        <div className="gold-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--gold-primary)" />
              5. Skills (Technical & Domain) with Project Evidence
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              *Golden Principle: Every skill is supported by real project work or contribution evidence.
            </p>
          </div>
          <span className="gold-badge green">Verified via PRs</span>
        </div>
        <div className="gold-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {(profile.skills_json || []).map((skill, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>{skill.name}</span>
                  <span className={`gold-badge ${skill.category === 'Business/Domain' ? 'purple' : 'green'}`} style={{ fontSize: '10px' }}>
                    {skill.level}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '4px' }}>
                  {skill.evidence_summary || 'Verified through merged pull request code contributions.'}
                </p>

                {skill.evidence_project && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--gold-dark)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Proof: {skill.evidence_project}</span>
                    <span><b>{skill.evidence_link}</b></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. Achievements & 7. Rankings */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

        {/* 6. Achievements */}
        <div className="gold-card" id="achievements-section">
          <div className="gold-card-header">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700 }}>
              6. Achievements & Milestones
            </h3>
          </div>
          <div className="gold-card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {profile.badges?.map(b => (
              <span key={b.id} className="gold-badge green" style={{ padding: '8px 12px', fontSize: '12px' }}>
                {b.title}
              </span>
            ))}
            <button onClick={onOpenCertificates} className="gold-btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>
              View {profile.certificates_count ?? 0} Verified Certificate{profile.certificates_count === 1 ? '' : 's'} ↗
            </button>
          </div>
        </div>

        {/* 7. Rankings Cards */}
        <div className="gold-card">
          <div className="gold-card-header">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700 }}>
              7. Rankings Breakdown
            </h3>
          </div>
          <div className="gold-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
            <div style={{ padding: '12px', background: 'var(--gold-bg)', borderRadius: '8px', border: '1px solid var(--gold-border)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gold-dark)' }}>{profile.college_rank ? `#${profile.college_rank}` : '—'}</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>🏫 College</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--blue-bg)', borderRadius: '8px', border: '1px solid var(--blue-border)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--blue-primary)' }}>{profile.dept_rank ? `#${profile.dept_rank}` : '—'}</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>🏢 Dept</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--purple-bg)', borderRadius: '8px', border: '1px solid var(--purple-border)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--purple-primary)' }}>{profile.global_rank ? `#${profile.global_rank}` : '—'}</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>🌍 Global</div>
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 8. Recommended Projects 🤖 */}
      {/* ------------------------------------------------------------- */}
      <div className="gold-card" id="recommendations-section">
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={18} color="var(--purple-primary)" />
            8. Recommended Projects 🤖 (AI Match Engine)
          </h3>
          <span className="gold-badge purple">vector search match</span>
        </div>
        <div className="gold-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {!profile.recommended_projects?.length && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No project recommendations yet. Complete your profile to get AI-matched projects.</p>
          )}
          {profile.recommended_projects?.map((item) => (
            <div key={item.id} style={{
              padding: '20px',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>{item.title}</h4>
                  <span className="gold-badge green" style={{ fontSize: '12px' }}>{item.match_percentage}% Match</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '6px' }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {item.required_skills.map((s, i) => (
                    <span key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Owner: {item.owner_name}</span>
                <button onClick={() => alert(`Applied to join ${item.title}!`)} className="gold-btn" style={{ fontSize: '12px', padding: '4px 12px' }}>
                  Join / Explore ↗
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 9. Recommended Mentors */}
      {/* ------------------------------------------------------------- */}
      <div className="gold-card" id="mentors-section">
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--blue-primary)" />
            9. Recommended Mentors
          </h3>
          <span className="gold-badge blue">Top Industry Experts</span>
        </div>
        <div className="gold-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {!profile.recommended_mentors?.length && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No mentor recommendations yet. Explore the mentor directory to request sessions.</p>
          )}
          {profile.recommended_mentors?.map((mentor) => (
            <div key={mentor.id} style={{
              padding: '20px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <img src={mentor.avatar_url} alt={mentor.name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>{mentor.name}</h4>
                  <span className="gold-badge green" style={{ fontSize: '11px' }}>{mentor.match_percentage}% Match</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gold-dark)', fontWeight: 600 }}>{mentor.title} @ {mentor.company}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  Domain: {mentor.domain} · ⭐ {mentor.rating} · ${mentor.hourly_rate}/hr
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => requestMentorship({ id: mentor.id, name: mentor.name })}
                    className="gold-btn"
                    style={{ fontSize: '12px', padding: '4px 12px' }}
                  >
                    Request Mentorship ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 10. Real-time Notifications */}
      {/* ------------------------------------------------------------- */}
      <div className="gold-card" id="notifications-section">
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--gold-primary)" />
            10. Real-Time Notifications Inbox
          </h3>
          <span className="gold-badge green">{profile.notifications?.filter(n => !n.is_read).length || 0} Unread</span>
        </div>
        <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {profile.notifications?.map((notif) => (
            <div key={notif.id} style={{
              padding: '12px 16px',
              background: notif.is_read ? 'var(--bg-surface)' : 'var(--gold-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>{notif.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '2px' }}>{notif.message}</div>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{notif.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showBookingModal && selectedMentor && (
        <MentorBookingModal
          mentorName={selectedMentor.name}
          mentorId={selectedMentor.id}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onSuccess={(newProj) => setProjects(prev => [newProj, ...prev])}
        />
      )}

      {showProfileSetup && (
        <ProfileSetupModal
          currentUser={{ ...profile, role: 'STUDENT' }}
          onClose={() => setShowProfileSetup(false)}
          onSuccess={(updated) => {
            setProfile(prev => prev ? ({ ...prev, ...updated }) : prev);
          }}
        />
      )}

    </div>
  );
};
