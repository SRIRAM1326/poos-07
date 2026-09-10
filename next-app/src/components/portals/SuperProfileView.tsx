'use client';

import React from 'react';
import { StudentProfile, Project } from '@/types';
import { 
  CheckCircle, 
  Code, 
  ExternalLink, 
  Globe, 
  Award, 
  Star, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Flame, 
  Briefcase, 
  Users, 
  GraduationCap, 
  Eye, 
  Sparkles,
  Building2
} from 'lucide-react';
import { RadarSkillChart } from '@/components/ui/RadarSkillChart';
import { GitHubInsightsCard } from '@/components/portals/GitHubInsightsCard';

interface SuperProfileViewProps {
  profile: StudentProfile;
  projects: Project[];
  onSelectProject?: (projectId: number) => void;
  onOpenCertificates?: () => void;
}

export const SuperProfileView: React.FC<SuperProfileViewProps> = ({ 
  profile, 
  projects,
  onSelectProject,
  onOpenCertificates
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. Header Banner & Basic Profile + Profile Analytics Bar */}
      <div className="gold-card" style={{ padding: '36px', background: 'linear-gradient(135deg, #ffffff 0%, #fffbe6 60%, #fef3c7 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '104px',
                  height: '104px',
                  borderRadius: '50%',
                  border: '4px solid var(--gold-primary)',
                  objectFit: 'cover',
                  boxShadow: 'var(--shadow-gold)',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  fontWeight: 800,
                  color: 'var(--gold-dark)',
                  fontFamily: 'var(--font-heading)',
                  overflow: 'hidden'
                }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (profile.full_name || 'S').charAt(0).toUpperCase()
                )}
              </div>
              <span className="gold-badge green" style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '10px', padding: '2px 8px' }}>
                <CheckCircle size={11} /> {profile.verified_by_college ? 'Verified' : 'Student'}
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {profile.full_name || 'Student'}
                </h1>
                <span className="gold-badge blue" style={{ fontSize: '12px' }}>
                  <ShieldCheck size={13} /> {profile.roll_number || 'Roll Number Pending'}
                </span>
                <span className="gold-badge amber" style={{ fontSize: '12px' }}>
                  🔥 {profile.streak_days || 0}-Day Streak
                </span>
              </div>

              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gold-dark)', marginTop: '4px' }}>
                {profile.headline || 'Student Developer'}
              </p>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '13px', color: 'var(--text-soft)', fontFamily: 'var(--font-mono)' }}>
                <span><GraduationCap size={14} style={{ display: 'inline', marginRight: '4px' }} /> {profile.college_name}</span>
                <span>• {profile.department}</span>
                <span>• {profile.year_of_study}{profile.academic_year ? ` (${profile.academic_year})` : ''}</span>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginTop: '12px', maxWidth: '750px', lineHeight: '1.6' }}>
                {profile.bio}
              </p>
            </div>
          </div>

          {/* Score & Profile Strength */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '2px solid var(--gold-primary)',
              padding: '16px 24px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-gold)'
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Contribution Score
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 800, color: 'var(--gold-dark)', lineHeight: '1.1' }}>
                {profile.contribution_score || profile.reputation_score} <span style={{ fontSize: '16px' }}>pts</span>
              </div>
            </div>

            {/* Profile Strength Gauge */}
            <div style={{ width: '220px', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                <span>Super Profile Strength</span>
                <span style={{ color: 'var(--gold-dark)' }}>{profile.analytics?.profile_strength_pct ?? 0}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${profile.analytics?.profile_strength_pct || 0}%`, height: '100%', background: 'linear-gradient(90deg, #c9a227 0%, #10b981 100%)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Links Banner */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--gold-border)', flexWrap: 'wrap' }}>
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noreferrer" className="gold-btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }}>
              <Globe size={14} /> GitHub (@{profile.github_handle}) <ExternalLink size={12} />
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="gold-btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }}>
              <Globe size={14} /> LinkedIn Profile <ExternalLink size={12} />
            </a>
          )}
          {profile.portfolio_url && (
            <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="gold-btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }}>
              <Globe size={14} /> Portfolio Website <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>



      {/* 7. Reputation & Rankings Row */}
      <div className="gold-card">
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--gold-primary)" />
            7. Reputation Score & Rankings Breakdown
          </h3>
          <span className="gold-badge green">Verified DB Leaderboard</span>
        </div>
        <div className="gold-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          
          <div style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--gold-primary)' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>🏫 COLLEGE RANK</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {profile.college_rank ? `#${profile.college_rank}` : '—'} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{profile.college_total_students ? `out of ${profile.college_total_students}` : ''}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gold-dark)', marginTop: '4px' }}>
              College reputation leaderboard · {profile.college_name}
            </p>
          </div>

          <div style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--blue-primary)' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>🏢 DEPARTMENT RANK</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {profile.dept_rank ? `#${profile.dept_rank}` : '—'} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{profile.dept_total_students ? `out of ${profile.dept_total_students}` : ''}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--blue-primary)', marginTop: '4px' }}>
              {profile.department} department leaderboard
            </p>
          </div>

          <div style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--purple-primary)' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>🌍 GLOBAL RANK</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {profile.global_rank ? `#${profile.global_rank}` : '—'} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{profile.global_total_devs ? `out of ${profile.global_total_devs.toLocaleString()}` : ''}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--purple-primary)', marginTop: '4px' }}>
              Global reputation leaderboard
            </p>
          </div>

        </div>
      </div>

      {/* 3. Radar Spider Chart Skills */}
      <div className="gold-card" style={{ overflow: 'hidden' }}>
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--gold-primary)" />
            3. Interactive Verified Skills
          </h3>
          <span className="gold-badge purple">Algorithmically Verified</span>
        </div>
        <RadarSkillChart skills={profile.skills_json} />
      </div>

      {/* 3b. Evidence-backed Skills Section */}
      <div className="gold-card" id="skills">
        <div className="gold-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--gold-primary)" />
              3b. Verified Skills & Proof Evidence List
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              *Golden Principle: Every skill is backed by verified merged PRs, commit hashes, or project repositories.
            </p>
          </div>
          <span className="gold-badge green">100% Evidence Verified</span>
        </div>
        <div className="gold-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {(profile.skills_json || []).map((skill, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>{skill.name}</span>
                    <span className={`gold-badge ${skill.category === 'Business/Domain' ? 'purple' : 'green'}`} style={{ fontSize: '11px' }}>
                      {skill.level} ({skill.category})
                    </span>
                  </div>

                  {skill.evidence_summary && (
                    <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '8px', lineHeight: '1.4' }}>
                      {skill.evidence_summary}
                    </p>
                  )}
                </div>

                {skill.evidence_project && (
                  <div style={{ 
                    padding: '8px 12px', 
                    background: 'var(--bg-surface)', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-dark)', fontWeight: 600 }}>
                      Proof: {skill.evidence_project} ({skill.evidence_link})
                    </span>
                    <span className="gold-badge green" style={{ fontSize: '10px', padding: '2px 6px' }}>✓ Verified</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Projects Section */}
      <div className="gold-card" id="projects">
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={18} color="var(--gold-primary)" />
            4. Projects & Technical Workspaces
          </h3>
          <span className="gold-badge blue">{projects.length} Active Repositories</span>
        </div>
        <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject?.(proj.id)}
              style={{
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px',
                background: 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {proj.title}
                  </h4>
                  <span className="gold-badge blue">{proj.project_type}</span>
                  <span className="gold-badge green">{proj.status}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '4px' }}>
                  {proj.tagline || proj.description}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {proj.tech_stack_json.map((tech, i) => (
                    <span key={i} style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      background: 'var(--bg-subtle)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--text-muted)'
                    }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--gold-dark)', fontFamily: 'var(--font-mono)' }}>
                  <Star size={14} color="var(--gold-primary)" /> {proj.stars_count}
                </div>
                <button className="gold-btn" style={{ fontSize: '13px', padding: '6px 14px' }}>
                  Explore Workspace ↗
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* 5b. GitHub Contribution & Statistics (Real Data) */}
        <GitHubInsightsCard />

      {/* 6. Achievements & 9. Certificates Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        
        {/* Achievements & Badges */}
        <div className="gold-card">
          <div className="gold-card-header">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--gold-primary)" />
              6. Achievements & Verified Badges
            </h3>
          </div>
          <div className="gold-card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {profile.badges?.map((badge) => (
              <div key={badge.id} style={{
                padding: '12px 16px',
                background: 'var(--gold-bg)',
                border: '1px solid var(--gold-border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Sparkles size={16} color="var(--gold-primary)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gold-dark)' }}>{badge.title}</div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{badge.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Certificates */}
        <div className="gold-card">
          <div className="gold-card-header">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--green-primary)" />
              9. Issued Certificates ({profile.certificates_count ?? 0})
            </h3>
            <button onClick={onOpenCertificates} className="gold-btn" style={{ fontSize: '12px', padding: '4px 12px' }}>
              View Credentials ↗
            </button>
          </div>
          <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.certificates_count ? (
              <div style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {profile.certificates_count} verified certificate{profile.certificates_count === 1 ? '' : 's'} issued
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  Stored on-chain with a unique certificate hash on PoOS.
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>No certificates issued yet</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  Certificates appear here once awarded by PoOS or an issuing body.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 8. Experience & Collaboration */}
      <div className="gold-card">
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} color="var(--purple-primary)" />
            8. Experience & Open Source Collaborations
          </h3>
        </div>
        <div className="gold-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          
          <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
            <span className="gold-badge purple" style={{ fontSize: '10px' }}>Open Source Contributions</span>
            <h4 style={{ fontWeight: 700, fontSize: '14px', marginTop: '6px' }}>Verified contribution history</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '4px' }}>
              {profile.total_commits} verified commits · {profile.merged_prs} merged pull requests
              {profile.active_projects_count ? ` · ${profile.active_projects_count} active project${profile.active_projects_count === 1 ? '' : 's'}` : ''}.
            </p>
          </div>

          <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
            <span className="gold-badge blue" style={{ fontSize: '10px' }}>College</span>
            <h4 style={{ fontWeight: 700, fontSize: '14px', marginTop: '6px' }}>{profile.college_name}</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '4px' }}>
              {profile.department} · Year {profile.year_of_study}
              {profile.location ? ` · ${profile.location}` : ''}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
