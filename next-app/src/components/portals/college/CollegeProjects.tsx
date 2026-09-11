import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import {
  Search, FolderGit2, Activity, BadgeCheck, Globe, Lock, Building2,
  Users, UserCheck, GitBranch, Star, ChevronDown, ChevronUp, X, ExternalLink, ShieldCheck,
} from 'lucide-react';

interface ProjectSummary {
  total_projects: number;
  college_created_projects: number;
  active_projects: number;
  completed_projects: number;
  open_projects: number;
  closed_projects: number;
  total_contributors: number;
  external_contributors: number;
  college_student_contributors: number;
  projects_with_github_repo: number;
  by_domain: { domain: string; count: number }[];
  by_technology: { technology: string; count: number }[];
}

interface EnrichedProject {
  id: number;
  title: string;
  tagline?: string | null;
  description?: string | null;
  created_by?: string | null;
  owner_id?: number | null;
  college?: string | null;
  college_created?: boolean;
  college_verified?: boolean;
  project_type?: string | null;
  domain?: string | null;
  technologies?: string[];
  required_skills?: string[];
  difficulty_level?: string | null;
  project_status?: string | null;
  is_open?: boolean;
  start_date?: string | null;
  expected_completion?: string | null;
  repo_url?: string | null;
  has_github_repo?: boolean;
  mentor?: string | null;
  visibility?: string;
  scope?: string | null;
  stars_count?: number;
  forks_count?: number;
  contributors?: { id: number; user_id: number; name: string; role: string; status: string }[];
  pending_requests?: { id: number; user_id: number; name: string; role: string; status: string }[];
  contributor_count?: number;
  college_students_contributing?: number;
  college_student_names?: string[];
  external_contributing?: number;
  external_names?: string[];
  contribution_stats?: { commits: number; pull_requests: number; merged_prs: number; contributors_with_activity: number };
  issues?: { id: number; title: string; status: string; label: string }[];
  issue_count?: number;
  recent_activity?: { id: number; commit_message: string; pr_number?: number | null; contributor_name: string; timestamp?: string | null }[];
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
  background: 'var(--bg-subtle)', fontSize: '13px', color: 'var(--text-main)',
};

function visibilityLabel(v?: string): string {
  if (v === 'COLLEGE_ONLY') return 'College Only';
  if (v === 'INVITE_ONLY') return 'Invite Only';
  return 'Public';
}

function VisibilityBadge({ visibility }: { visibility?: string }) {
  const label = visibilityLabel(visibility);
  const icon = visibility === 'COLLEGE_ONLY'
    ? <Building2 size={12} /> : visibility === 'INVITE_ONLY' ? <Lock size={12} /> : <Globe size={12} />;
  const cls = visibility === 'COLLEGE_ONLY' ? 'orange' : visibility === 'INVITE_ONLY' ? 'purple' : 'green';
  const hint = label === 'Public'
    ? 'Anyone on POOS can discover and contribute'
    : label === 'College Only'
      ? 'Only verified students from this college can participate'
      : 'Only selected users can participate';
  return <span className={`gold-badge ${cls}`} style={{ fontSize: '11px' }} title={hint}>{icon} {label}</span>;
}

const EMPTY_FORM = {
  title: '', tagline: '', description: '', domain: '', technologies: '', required_skills: '',
  difficulty_level: 'Intermediate', project_status: 'ACTIVE', visibility: 'PUBLIC',
  start_date: '', expected_completion: '', repo_url: '', mentor: '',
};

export const CollegeProjects: React.FC = () => {
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState('ALL');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [originFilter, setOriginFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      const data = await api.getCollegeProjectsOverview();
      setProjects(data?.projects || []);
      setSummary(data?.summary || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getCollegeProjectsOverview();
        if (!cancelled) {
          setProjects(data?.projects || []);
          setSummary(data?.summary || null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load projects.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return projects.filter(p => {
      if (statusFilter === 'ACTIVE' && !['ACTIVE', 'IN_PROGRESS', 'ONGOING', 'IN REVIEW', 'CODE_REVIEW'].includes((p.project_status || '').toUpperCase())) return false;
      if (statusFilter === 'COMPLETED' && !['COMPLETED', 'DONE', 'CLOSED', 'RESOLVED'].includes((p.project_status || '').toUpperCase())) return false;
      if (visibilityFilter !== 'ALL' && (p.visibility || 'PUBLIC') !== visibilityFilter) return false;
      if (domainFilter !== 'ALL' && (p.domain || 'Unspecified') !== domainFilter) return false;
      if (originFilter === 'COLLEGE' && !p.college_created) return false;
      if (originFilter === 'ECOSYSTEM' && p.college_created) return false;
      if (!term) return true;
      const hay = [p.title, p.description || '', p.college || '', p.domain || '', (p.technologies || []).join(' '), (p.required_skills || []).join(' ')].join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [projects, searchTerm, statusFilter, visibilityFilter, domainFilter, originFilter]);

  const patchProjectInState = (id: number, patch: Partial<EnrichedProject>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const handleApprove = async (project: EnrichedProject, memberId: number) => {
    try {
      await api.approveProjectMember(project.id, memberId);
      const contributors = (project.contributors || []).map(m => m.id === memberId ? { ...m, status: 'APPROVED' } : m);
      patchProjectInState(project.id, {
        contributors,
        pending_requests: contributors.filter(m => m.status === 'PENDING'),
        contributor_count: (project.contributor_count ?? 0) + 1,
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to approve member.');
    }
  };

  const handleReject = async (project: EnrichedProject, memberId: number) => {
    try {
      await api.rejectProjectMember(project.id, memberId);
      const contributors = (project.contributors || []).map(m => m.id === memberId ? { ...m, status: 'REJECTED' } : m);
      patchProjectInState(project.id, {
        contributors,
        pending_requests: contributors.filter(m => m.status === 'PENDING'),
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to reject member.');
    }
  };

  const handleToggleOpen = async (project: EnrichedProject) => {
    try {
      const res = await api.updateProject(project.id, { is_open: !project.is_open });
      patchProjectInState(project.id, { is_open: res?.is_open ?? !project.is_open });
      const data = await api.getCollegeProjectsOverview();
      setProjects(data?.projects || []);
      setSummary(data?.summary || null);
    } catch (err: any) {
      alert(err?.message || 'Failed to update project.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');
    try {
      const payload = {
        title: form.title.trim(),
        tagline: form.tagline.trim() || undefined,
        description: form.description.trim() || undefined,
        project_type: 'COLLEGE_PROJECT',
        domain: form.domain.trim() || undefined,
        tech_stack_json: form.technologies.split(',').map(s => s.trim()).filter(Boolean),
        required_skills: form.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        difficulty_level: form.difficulty_level,
        status: undefined,
        visibility: form.visibility,
        start_date: form.start_date || undefined,
        expected_completion: form.expected_completion || undefined,
        repo_url: form.repo_url.trim() || undefined,
        mentor_name: form.mentor.trim() || undefined,
        is_open: true,
      };
      await api.createCollegeProject(payload);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setLoading(true);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-soft)' }}>Syncing with PoOS Ecosystem...</div>;

  const statCards = summary ? [
    { icon: <FolderGit2 size={20} color="var(--purple-primary)" />, accent: 'var(--purple-primary)', value: summary.total_projects, label: 'Total Projects', hint: 'All projects in the ecosystem' },
    { icon: <Building2 size={20} color="var(--purple-primary)" />, accent: 'var(--purple-primary)', value: summary.college_created_projects, label: 'College-Created Projects', hint: 'Created by this college' },
    { icon: <Activity size={20} color="var(--green-primary)" />, accent: 'var(--green-primary)', value: summary.active_projects, label: 'Active Projects', hint: 'Currently in development' },
    { icon: <BadgeCheck size={20} color="var(--green-primary)" />, accent: 'var(--green-primary)', value: summary.completed_projects, label: 'Completed Projects', hint: 'Successfully completed' },
    { icon: <Globe size={20} color="var(--blue-primary)" />, accent: 'var(--blue-primary)', value: summary.open_projects, label: 'Open Projects', hint: 'Accepting contributions' },
    { icon: <Lock size={20} color="var(--text-muted)" />, accent: 'var(--text-muted)', value: summary.closed_projects, label: 'Closed Projects', hint: 'No longer accepting contributions' },
    { icon: <Users size={20} color="var(--purple-primary)" />, accent: 'var(--purple-primary)', value: summary.total_contributors, label: 'Total Contributors', hint: 'Across all projects' },
    { icon: <UserCheck size={20} color="var(--blue-primary)" />, accent: 'var(--blue-primary)', value: summary.external_contributors, label: 'External Contributors', hint: 'POOS users outside the college' },
    { icon: <Users size={20} color="var(--green-primary)" />, accent: 'var(--green-primary)', value: summary.college_student_contributors, label: 'College Student Contributors', hint: 'Contributing college students' },
    { icon: <GitBranch size={20} color="var(--orange-primary)" />, accent: 'var(--orange-primary)', value: summary.projects_with_github_repo, label: 'Projects with GitHub Repository', hint: 'Connected with actual commits' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Projects — College-Created &amp; Open Projects</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0', maxWidth: '720px' }}>
            Create real-world projects and open them to the POOS community — students, developers and mentors collaborate, with GitHub activity tracked.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="gold-btn" style={{ background: 'var(--purple-primary)', whiteSpace: 'nowrap' }}>
          + Create Open Project
        </button>
      </div>

      <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-main)' }}>Contribution flow:</strong> College creates project → available on POOS → users discover → apply / join → approve if required → contribute → GitHub activity tracked.
      </div>

      {error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load projects: {error}</div>
      ) : (
        <>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
              Project Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {statCards.map(card => (
                <div key={card.label} className="stat-box" style={{ borderLeftColor: card.accent }}>
                  <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{card.icon} {card.value}</div>
                  <div className="lbl">{card.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{card.hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="gold-card">
              <div className="gold-card-header"><h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Projects by Domain</h3></div>
              <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {(summary?.by_domain || []).length === 0 ? <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No data yet.</span> :
                  (summary?.by_domain || []).map(d => (
                    <div key={d.domain} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>{d.domain}</span><span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{d.count}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="gold-card">
              <div className="gold-card-header"><h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Projects by Technology</h3></div>
              <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {(summary?.by_technology || []).length === 0 ? <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No data yet.</span> :
                  (summary?.by_technology || []).slice(0, 15).map(t => (
                    <div key={t.technology} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>{t.technology}</span><span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{t.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="gold-card">
            <div className="gold-card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input type="text" placeholder="Search by name, domain, or technology..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }} />
              </div>
              <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">All Origins</option>
                <option value="COLLEGE">College-Created</option>
                <option value="ECOSYSTEM">Ecosystem</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">Visibility: All</option>
                <option value="PUBLIC">Public</option>
                <option value="COLLEGE_ONLY">College Only</option>
                <option value="INVITE_ONLY">Invite Only</option>
              </select>
              <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">All Domains</option>
                {(summary?.by_domain || []).map(d => <option key={d.domain} value={d.domain}>{d.domain} ({d.count})</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {projects.length === 0 ? 'No projects created yet. Create your first open project for the POOS ecosystem.' : 'No projects match your filters.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {filtered.map(proj => {
                const expanded = expandedId === proj.id;
                return (
                  <div key={proj.id} className="gold-card">
                    <div className="gold-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{proj.title}</h4>
                        <span className={`gold-badge ${['ACTIVE', 'IN_PROGRESS'].includes((proj.project_status || '').toUpperCase()) ? 'green' : ''}`} style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {proj.project_status || '—'}
                        </span>
                      </div>
                      {proj.tagline && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>{proj.tagline}</p>}

                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <VisibilityBadge visibility={proj.visibility} />
                        {proj.college_created && <span className="gold-badge blue" style={{ fontSize: '11px' }}>College-Created</span>}
                        {proj.college_verified && (
                          <span className="gold-badge green" style={{ fontSize: '11px' }} title="This project belongs to a verified college on POOS">
                            <ShieldCheck size={12} /> College Verified
                          </span>
                        )}
                        <span className="gold-badge" style={{ fontSize: '11px' }}>{proj.is_open ? 'Open' : 'Closed'}</span>
                        {proj.difficulty_level && <span className="gold-badge" style={{ fontSize: '11px' }}>{proj.difficulty_level}</span>}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {(proj.technologies || []).map((t) => (
                          <span key={t} style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{t}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} color="var(--text-soft)" /> {proj.contributor_count ?? 0} Contributors
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Star size={14} color="var(--text-soft)" /> {proj.stars_count ?? 0} Stars
                        </span>
                        {(proj.pending_requests || []).length > 0 && (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--orange-primary)' }}>
                            {(proj.pending_requests || []).length} pending request(s)
                          </span>
                        )}
                        <button onClick={() => setExpandedId(expanded ? null : proj.id)}
                          style={{ marginLeft: 'auto', padding: '6px 12px', background: 'transparent', color: 'var(--purple-primary)', border: '1px solid var(--purple-primary)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {expanded ? <>Hide <ChevronUp size={12} /></> : <>Details <ChevronDown size={12} /></>}
                        </button>
                      </div>

                      {expanded && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Project Information</div>
                            <div><strong>Project name:</strong> {proj.title}</div>
                            {proj.description && <div style={{ marginTop: '4px' }}><strong>Description:</strong> {proj.description}</div>}
                            <div><strong>Created by:</strong> {proj.created_by || '—'}{proj.college ? ` · ${proj.college}` : ''}</div>
                            <div><strong>Domain:</strong> {proj.domain || '—'}</div>
                            <div><strong>Technologies:</strong> {(proj.technologies || []).join(', ') || '—'}</div>
                            <div><strong>Required skills:</strong> {(proj.required_skills || []).join(', ') || '—'}</div>
                            <div><strong>Difficulty level:</strong> {proj.difficulty_level || '—'}</div>
                            <div><strong>Project status:</strong> {proj.project_status || '—'} · {proj.is_open ? 'Open for contributions' : 'Closed'}</div>
                            <div><strong>Start date:</strong> {proj.start_date || '—'} · <strong>Expected completion:</strong> {proj.expected_completion || '—'}</div>
                            <div>
                              <strong>GitHub repository:</strong>{' '}
                              {proj.repo_url ? <a href={proj.repo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--purple-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Open <ExternalLink size={12} /></a> : '—'}
                            </div>
                            <div><strong>Mentor:</strong> {proj.mentor || '—'}</div>
                          </div>

                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                              Contributors ({proj.contributor_count ?? 0})
                            </div>
                            <div><strong>College students contributing ({proj.college_students_contributing ?? 0}):</strong> {(proj.college_student_names || []).join(', ') || '—'}</div>
                            <div><strong>External POOS users contributing ({proj.external_contributing ?? 0}):</strong> {(proj.external_names || []).join(', ') || '—'}</div>
                          </div>

                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Contribution Statistics</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                              <span>Issues: <strong>{proj.issue_count ?? 0}</strong></span>
                              <span>Pull requests: <strong>{proj.contribution_stats?.pull_requests ?? 0}</strong></span>
                              <span>Commits: <strong>{proj.contribution_stats?.commits ?? 0}</strong></span>
                              <span>Contributors with activity: <strong>{proj.contribution_stats?.contributors_with_activity ?? 0}</strong></span>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Project Activity</div>
                            {(proj.recent_activity || []).length === 0 ? (
                              <div style={{ color: 'var(--text-muted)' }}>No activity recorded yet.</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {(proj.recent_activity || []).map(a => (
                                  <div key={a.id} style={{ padding: '8px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    <span style={{ fontWeight: 600 }}>{a.commit_message}</span>
                                    <span style={{ color: 'var(--text-muted)' }}> · {a.contributor_name}{a.pr_number ? ` · PR #${a.pr_number}` : ''}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {(proj.pending_requests || []).length > 0 && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Pending Join Requests</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(proj.pending_requests || []).map(r => (
                                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                                    <span style={{ display: 'flex', gap: '8px' }}>
                                      <button onClick={() => handleApprove(proj, r.id)} style={{ padding: '4px 10px', background: 'var(--purple-primary)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Approve</button>
                                      <button onClick={() => handleReject(proj, r.id)} style={{ padding: '4px 10px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Reject</button>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleToggleOpen(proj)} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--purple-primary)', border: '1px solid var(--purple-primary)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                              {proj.is_open ? 'Close Project' : 'Reopen Project'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Create Open Project</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>The project becomes available on POOS per its visibility setting.</p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', fontSize: '13px' }}>{formError}</div>}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PROJECT NAME *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AI-Based Campus Attendance System" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DESCRIPTION *</label>
                <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will contributors build?" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DOMAIN</label>
                  <input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="e.g. Artificial Intelligence" style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DIFFICULTY LEVEL</label>
                  <select value={form.difficulty_level} onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TECHNOLOGIES (COMMA SEPARATED)</label>
                <input value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="e.g. Python, FastAPI, React, PostgreSQL" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>REQUIRED SKILLS (COMMA SEPARATED)</label>
                <input value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} placeholder="e.g. REST APIs, SQL, React Hooks" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>START DATE</label>
                  <input value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} placeholder="e.g. 2026-10-01" style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>EXPECTED COMPLETION</label>
                  <input value={form.expected_completion} onChange={(e) => setForm({ ...form, expected_completion: e.target.value })} placeholder="e.g. 2027-01-31" style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>GITHUB REPOSITORY</label>
                <input type="url" value={form.repo_url} onChange={(e) => setForm({ ...form, repo_url: e.target.value })} placeholder="https://github.com/org/repo" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>MENTOR (OPTIONAL)</label>
                <input value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })} placeholder="e.g. Dr. Rajesh Kumar" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PROJECT VISIBILITY *</label>
                <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                  <option value="PUBLIC">Public — Anyone on POOS can discover and contribute</option>
                  <option value="COLLEGE_ONLY">College Only — Only verified students from this college</option>
                  <option value="INVITE_ONLY">Invite Only — Only selected users</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="gold-btn-outline" style={{ fontSize: '13px' }}>Cancel</button>
                <button type="submit" disabled={creating} className="gold-btn" style={{ fontSize: '13px', background: 'var(--purple-primary)', color: '#fff' }}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
