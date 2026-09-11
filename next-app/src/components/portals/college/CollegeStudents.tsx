import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import {
  Search, Users, UserCheck, UserX, GitFork, UserMinus,
  GitCommitHorizontal, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';

interface OverviewStudent {
  id: number;
  user_id: number;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  roll_number?: string | null;
  department?: string | null;
  year_of_study?: string | null;
  bio?: string | null;
  github_handle?: string | null;
  github_url?: string | null;
  github_connected?: boolean;
  has_github?: boolean;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  skills?: string[];
  projects?: { id: number; title: string }[];
  project_count?: number;
  reputation_score?: number;
  contribution_score?: number;
  verified_by_college?: boolean;
  verification_status?: string;
  commits?: number;
  pull_requests?: number;
  merged_prs?: number;
  issues?: number;
  open_issues?: number;
  code_reviews?: number;
  repositories?: number;
  contribution_activity?: {
    id: number;
    commit_message: string;
    pr_number?: number | null;
    pr_title?: string | null;
    status?: string | null;
    project_name?: string | null;
    timestamp?: string | null;
  }[];
}

interface StudentsSummary {
  total_students: number;
  active_students: number;
  inactive_students: number;
  students_with_github: number;
  students_without_github: number;
  active_github_contributors: number;
  verification?: { verified: number; pending: number; rejected: number };
  by_department: { department: string; count: number }[];
  by_year: { year: string; count: number }[];
  by_skill: { skill: string; count: number }[];
  by_project: { project_id: number; title: string; student_count: number }[];
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
  background: 'var(--bg-subtle)', fontSize: '13px', color: 'var(--text-main)',
};

function BreakdownPanel({ title, items, labelKey }: { title: string; items: any[]; labelKey: string }) {
  const max = Math.max(1, ...items.map(i => i.count ?? i.student_count ?? 0));
  return (
    <div className="gold-card">
      <div className="gold-card-header">
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{title}</h3>
      </div>
      <div className="gold-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No data yet.</div>
        ) : (
          items.slice(0, 12).map((item, idx) => {
            const count = item.count ?? item.student_count ?? 0;
            return (
              <div key={idx} style={{ fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item[labelKey]}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{count}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '4px', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((count / max) * 100)}%`, height: '100%', background: 'var(--purple-primary)', borderRadius: '4px' }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const CollegeStudents: React.FC = () => {
  const [students, setStudents] = useState<OverviewStudent[]>([]);
  const [summary, setSummary] = useState<StudentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [githubFilter, setGithubFilter] = useState<'ALL' | 'WITH' | 'WITHOUT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getVerificationStatus = (s: OverviewStudent): 'VERIFIED' | 'PENDING' | 'REJECTED' => {
    const raw = (s.verification_status || '').toUpperCase();
    if (raw === 'VERIFIED' || raw === 'PENDING' || raw === 'REJECTED') return raw;
    return s.verified_by_college ? 'VERIFIED' : 'PENDING';
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const data = await api.getCollegeStudentsOverview();
        if (!cancelled) {
          setStudents(data?.students || []);
          setSummary(data?.summary || null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load students.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const departments = useMemo(() => summary?.by_department || [], [summary]);
  const years = useMemo(() => summary?.by_year || [], [summary]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return students.filter(s => {
      if (deptFilter !== 'ALL' && (s.department || 'Unspecified') !== deptFilter) return false;
      if (yearFilter !== 'ALL' && (s.year_of_study || 'Unspecified') !== yearFilter) return false;
      if (githubFilter === 'WITH' && !s.has_github) return false;
      if (githubFilter === 'WITHOUT' && s.has_github) return false;
      if (statusFilter === 'ACTIVE' && !s.verified_by_college) return false;
      if (statusFilter === 'INACTIVE' && s.verified_by_college) return false;
      if (verificationFilter !== 'ALL' && getVerificationStatus(s) !== verificationFilter) return false;
      if (!term) return true;
      const hay = [
        s.full_name || '', s.roll_number || '', s.email || '',
        s.github_handle || '', s.department || '', (s.skills || []).join(' '),
      ].join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [students, searchTerm, deptFilter, yearFilter, githubFilter, statusFilter]);

  const applyVerificationChange = (studentId: number, status: 'VERIFIED' | 'PENDING' | 'REJECTED') => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const prevStatus = getVerificationStatus(s);
      if (prevStatus === status) return s;
      return { ...s, verification_status: status, verified_by_college: status === 'VERIFIED' };
    }));
    setSummary(prev => {
      if (!prev) return prev;
      const current = students.find(s => s.id === studentId);
      const prevStatus = current ? getVerificationStatus(current) : null;
      const verification = {
        verified: prev.verification?.verified ?? 0,
        pending: prev.verification?.pending ?? 0,
        rejected: prev.verification?.rejected ?? 0,
      };
      if (prevStatus && prevStatus !== status) {
        if (prevStatus === 'VERIFIED') verification.verified = Math.max(0, verification.verified - 1);
        if (prevStatus === 'PENDING') verification.pending = Math.max(0, verification.pending - 1);
        if (prevStatus === 'REJECTED') verification.rejected = Math.max(0, verification.rejected - 1);
        if (status === 'VERIFIED') verification.verified += 1;
        if (status === 'REJECTED') verification.rejected += 1;
        if (status === 'PENDING') verification.pending += 1;
      }
      const wasActive = prevStatus === 'VERIFIED';
      const nowActive = status === 'VERIFIED';
      return {
        ...prev,
        verification,
        active_students: prev.active_students + (nowActive && !wasActive ? 1 : (!nowActive && wasActive ? -1 : 0)),
        inactive_students: Math.max(0, prev.inactive_students + (nowActive && !wasActive ? -1 : (!nowActive && wasActive ? 1 : 0))),
      };
    });
  };

  const handleVerify = async (student: OverviewStudent) => {
    try {
      await api.verifyStudent(student.user_id);
      applyVerificationChange(student.id, 'VERIFIED');
    } catch (err: any) {
      alert(err?.message || 'Failed to verify student.');
    }
  };

  const handleReject = async (student: OverviewStudent) => {
    try {
      await api.rejectStudent(student.user_id);
      applyVerificationChange(student.id, 'REJECTED');
    } catch (err: any) {
      alert(err?.message || 'Failed to reject student.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Students — Student Performance &amp; Profiles</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading students...</div>
      </div>
    );
  }

  const statCards = summary ? [
    { icon: <Users size={20} color="var(--purple-primary)" />, accent: 'var(--purple-primary)', value: summary.total_students, label: 'Total Students' },
    { icon: <UserCheck size={20} color="var(--green-primary)" />, accent: 'var(--green-primary)', value: summary.active_students, label: 'Active Students' },
    { icon: <UserX size={20} color="var(--text-muted)" />, accent: 'var(--text-muted)', value: summary.inactive_students, label: 'Inactive Students' },
    { icon: <GitFork size={20} color="var(--text-main)" />, accent: 'var(--text-main)', value: summary.students_with_github, label: 'Students with GitHub' },
    { icon: <UserMinus size={20} color="var(--orange-primary)" />, accent: 'var(--orange-primary)', value: summary.students_without_github, label: 'Students without GitHub' },
    { icon: <GitCommitHorizontal size={20} color="var(--blue-primary)" />, accent: 'var(--blue-primary)', value: summary.active_github_contributors, label: 'Active GitHub Contributors' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Students — Student Performance &amp; Profiles</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
          Understand and manage students — actual technical skills and practical contributions, not just academic information.
        </p>
      </div>

      {error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load students: {error}</div>
      ) : (
        <>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
              Student Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {statCards.map(card => (
                <div key={card.label} className="stat-box" style={{ borderLeftColor: card.accent }}>
                  <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{card.icon} {card.value}</div>
                  <div className="lbl">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
              Verification Status
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Trusted student identity layer — verify that students genuinely belong to your institution.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="stat-box" style={{ borderLeftColor: 'var(--green-primary)' }}>
                <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🟢 {summary?.verification?.verified ?? 0}</div>
                <div className="lbl">Verified</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>College has confirmed the student</div>
              </div>
              <div className="stat-box" style={{ borderLeftColor: 'var(--orange-primary)' }}>
                <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🟡 {summary?.verification?.pending ?? 0}</div>
                <div className="lbl">Pending</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Requested, but not yet reviewed</div>
              </div>
              <div className="stat-box" style={{ borderLeftColor: '#ef4444' }}>
                <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🔴 {summary?.verification?.rejected ?? 0}</div>
                <div className="lbl">Rejected</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>College rejected the request</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <BreakdownPanel title="Students by Department" items={summary?.by_department || []} labelKey="department" />
            <BreakdownPanel title="Students by Year" items={summary?.by_year || []} labelKey="year" />
            <BreakdownPanel title="Students by Skill" items={summary?.by_skill || []} labelKey="skill" />
            <BreakdownPanel title="Students by Project" items={(summary?.by_project || []).map(p => ({ title: p.title, count: p.student_count }))} labelKey="title" />
          </div>

          <div className="gold-card">
            <div className="gold-card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search by name, roll no, or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }}
                />
              </div>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">All Departments</option>
                {departments.map(d => <option key={d.department} value={d.department}>{d.department} ({d.count})</option>)}
              </select>
              <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">All Years</option>
                {years.map(y => <option key={y.year} value={y.year}>{y.year} ({y.count})</option>)}
              </select>
              <select value={githubFilter} onChange={(e) => setGithubFilter(e.target.value as any)} style={inputStyle}>
                <option value="ALL">GitHub: All</option>
                <option value="WITH">With GitHub</option>
                <option value="WITHOUT">Without GitHub</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} style={inputStyle}>
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value as any)} style={inputStyle}>
                <option value="ALL">Verification: All</option>
                <option value="VERIFIED">🟢 Verified</option>
                <option value="PENDING">🟡 Pending</option>
                <option value="REJECTED">🔴 Rejected</option>
              </select>
            </div>
          </div>

          <div className="gold-card">
            <div className="gold-card-body" style={{ padding: 0 }}>
              {filteredStudents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {searchTerm || deptFilter !== 'ALL' || yearFilter !== 'ALL' || githubFilter !== 'ALL' || statusFilter !== 'ALL' || verificationFilter !== 'ALL'
                    ? 'No students match your filters.' : 'No students registered yet.'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      <th style={{ padding: '16px' }}>Student</th>
                      <th style={{ padding: '16px' }}>Department / Year</th>
                      <th style={{ padding: '16px' }}>Skills</th>
                      <th style={{ padding: '16px' }}>Score</th>
                      <th style={{ padding: '16px' }}>Verification Status</th>
                      <th style={{ padding: '16px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const expanded = expandedId === student.id;
                      return (
                        <React.Fragment key={student.id}>
                          <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontWeight: 600 }}>{student.full_name || student.github_handle || `Student #${student.id}`}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.roll_number || student.email || ''}</div>
                            </td>
                            <td style={{ padding: '16px', fontSize: '14px' }}>
                              <div>{student.department || '—'}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.year_of_study || ''}</div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '280px' }}>
                                {(student.skills || []).slice(0, 5).map(skill => (
                                  <span key={skill} style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{skill}</span>
                                ))}
                                {(student.skills || []).length > 5 && (
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{(student.skills || []).length - 5} more</span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '16px', fontWeight: 600 }}>{student.contribution_score ?? student.reputation_score ?? 0}</td>
                            <td style={{ padding: '16px' }}>
                              {(() => {
                                const v = getVerificationStatus(student);
                                const badgeClass = v === 'VERIFIED' ? 'green' : v === 'REJECTED' ? 'red' : 'orange';
                                const dot = v === 'VERIFIED' ? '🟢' : v === 'REJECTED' ? '🔴' : '🟡';
                                const label = v === 'VERIFIED' ? 'Verified' : v === 'REJECTED' ? 'Rejected' : 'Pending';
                                return (
                                  <span className={`gold-badge ${badgeClass}`} style={{ fontSize: '11px' }} title={
                                    v === 'VERIFIED' ? 'College has confirmed the student'
                                      : v === 'REJECTED' ? 'College rejected the verification request'
                                      : 'Student requested verification, but the college hasn\u2019t reviewed it'
                                  }>
                                    {dot} {label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {getVerificationStatus(student) !== 'VERIFIED' && (
                                  <button
                                    onClick={() => handleVerify(student)}
                                    style={{ padding: '6px 12px', background: 'var(--purple-primary)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                                  >
                                    Verify
                                  </button>
                                )}
                                {getVerificationStatus(student) !== 'REJECTED' && (
                                  <button
                                    onClick={() => handleReject(student)}
                                    style={{ padding: '6px 12px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                                  >
                                    Reject
                                  </button>
                                )}
                                <button
                                  onClick={() => setExpandedId(expanded ? null : student.id)}
                                  style={{ padding: '6px 12px', background: 'transparent', color: 'var(--purple-primary)', border: '1px solid var(--purple-primary)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {expanded ? <>Hide <ChevronUp size={12} /></> : <>View Profile <ChevronDown size={12} /></>}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expanded && (
                            <tr style={{ background: 'var(--bg-subtle)' }}>
                              <td colSpan={6} style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13px' }}>
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Profile</div>
                                    <div><strong>Name:</strong> {student.full_name || '—'}</div>
                                    <div><strong>Department:</strong> {student.department || '—'}</div>
                                    <div><strong>Year:</strong> {student.year_of_study || '—'}</div>
                                    <div><strong>Verification:</strong> {(() => {
                                      const v = getVerificationStatus(student);
                                      return v === 'VERIFIED' ? '🟢 Verified — confirmed by college' : v === 'REJECTED' ? '🔴 Rejected — request declined' : '🟡 Pending — awaiting review';
                                    })()}</div>
                                    {student.bio && <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>{student.bio}</div>}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Links</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {student.github_url ? <a href={student.github_url} target="_blank" rel="noreferrer" style={{ color: 'var(--purple-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>GitHub <ExternalLink size={12} /></a> : <span><strong>GitHub:</strong> —</span>}
                                      {student.linkedin_url ? <a href={student.linkedin_url} target="_blank" rel="noreferrer" style={{ color: 'var(--purple-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>LinkedIn <ExternalLink size={12} /></a> : <span><strong>LinkedIn:</strong> —</span>}
                                      {student.portfolio_url ? <a href={student.portfolio_url} target="_blank" rel="noreferrer" style={{ color: 'var(--purple-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Portfolio <ExternalLink size={12} /></a> : <span><strong>Portfolio:</strong> —</span>}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Skills &amp; Projects</div>
                                    <div><strong>Skills:</strong> {(student.skills || []).join(', ') || '—'}</div>
                                    <div style={{ marginTop: '4px' }}><strong>Projects ({student.project_count ?? 0}):</strong> {(student.projects || []).map(p => p.title).join(', ') || '—'}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>GitHub Contribution Evidence</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                                      <span>Score: <strong>{student.contribution_score ?? 0}</strong></span>
                                      <span>Commits: <strong>{student.commits ?? 0}</strong></span>
                                      <span>Pull requests: <strong>{student.pull_requests ?? 0}</strong></span>
                                      <span>Merged PRs: <strong>{student.merged_prs ?? 0}</strong></span>
                                      <span>Issues: <strong>{student.issues ?? 0}</strong></span>
                                      <span>Code reviews: <strong>{student.code_reviews ?? 0}</strong></span>
                                      <span>Repositories: <strong>{student.repositories ?? 0}</strong></span>
                                      <span>GitHub: <strong>{student.has_github ? (student.github_connected ? 'Connected' : 'Linked') : 'Not linked'}</strong></span>
                                    </div>
                                  </div>
                                </div>
                                <div style={{ marginTop: '16px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Contribution Activity</div>
                                  {(student.contribution_activity || []).length === 0 ? (
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No contribution activity recorded yet.</div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {(student.contribution_activity || []).map(a => (
                                        <div key={a.id} style={{ fontSize: '13px', padding: '8px 12px', background: 'var(--bg-main, #fff)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                          <span style={{ fontWeight: 600 }}>{a.commit_message}</span>
                                          {a.pr_number && <span style={{ color: 'var(--text-muted)' }}> · PR #{a.pr_number}{a.pr_title ? ` ${a.pr_title}` : ''}</span>}
                                          {a.project_name && <span style={{ color: 'var(--text-muted)' }}> · {a.project_name}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
