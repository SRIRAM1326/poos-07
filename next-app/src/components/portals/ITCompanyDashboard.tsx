'use client';

import React, { useEffect, useState } from 'react';
import { api, getCurrentUserId } from '@/services/api';
import { CheckCircle, Code, MessageSquare, Search, ShieldCheck, Sparkles } from 'lucide-react';

interface ITCompanyDashboardProps {
  activeTab?: string;
  onSelectProject?: (id: number) => void;
  currentUser?: any;
}

export const ITCompanyDashboard: React.FC<ITCompanyDashboardProps> = ({ activeTab = 'dashboard', onSelectProject, currentUser }) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [outreachMessage, setOutreachMessage] = useState('');
  const [opportunityType, setOpportunityType] = useState('INTERNSHIP');
  const [successToast, setSuccessToast] = useState('');
  const [aiMatching, setAiMatching] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [jdText, setJdText] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [companyProfile, setCompanyProfile] = useState<any | null>(null);

  const handleJDSearch = async () => {
    setAiMatching(true);
    try {
      const res = await api.searchTalentWithJD({
        job_description: jdText,
        skills: skillFilter,
        domain_expertise: domainFilter,
        college: collegeFilter,
        company_type: 'IT'
      });
      setCandidates(res.rankings || []);
      setSuccessToast(`Intelligently matched & ranked ${res.total_ranked} candidate profiles based on skills, projects & JD!`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error('Failed candidate search:', err);
    } finally {
      setAiMatching(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const userId = getCurrentUserId();
        if (!userId) return;
        const data = await api.searchITTalent();
        setCandidates(data);
        if (userId) {
          try {
            const company = await api.getCompanyProfile(userId);
            setCompanyProfile(company);
          } catch (err) {
            console.error('Failed loading company profile:', err);
          }
        }
      } catch (err) {
        console.error('Failed loading IT talent:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAIMatch = async () => {
    setAiMatching(true);
    try {
      const res = await api.matchCandidateWithAI(aiQuery || "FastAPI Python Vector Search Distributed Systems");
      setCandidates(Array.isArray(res?.rankings) ? res.rankings : []);
      setSuccessToast(`AI Engine ranked ${res?.total_ranked ?? 0} candidate profiles with 0-hallucination Supabase verification!`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error('Failed AI match:', err);
      setSuccessToast('AI match failed. Please try again.');
      setTimeout(() => setSuccessToast(''), 4000);
    } finally {
      setAiMatching(false);
    }
  };


  const handleShortlist = async (studentId: number) => {
    try {
      await api.shortlistCandidate(studentId, 'High Potential IT Engineer', 'Shortlisted via technical repository evidence');
      setSuccessToast('Candidate added to IT Talent Shortlist!');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.error('Failed shortlisting candidate:', err);
    }
  };

  const handleSendOutreach = async () => {
    if (!selectedStudent || !outreachMessage) return;
    try {
      await api.sendContactRequest(selectedStudent.user_id, opportunityType, outreachMessage);
      setSuccessToast(`Direct contact request sent to ${selectedStudent.full_name}!`);
      setSelectedStudent(null);
      setOutreachMessage('');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error('Failed sending contact request:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--green-primary)',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={18} />
          {successToast}
        </div>
      )}

      {/* IT Banner */}
      <div className="gold-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800 }}>
                {companyProfile?.company_name || 'IT Company'}
              </h1>
              <span className="gold-badge green">
                <ShieldCheck size={12} /> Verified IT Company
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--green-primary)', marginTop: '4px' }}>
              {companyProfile?.industry || 'Enterprise Software'} · {companyProfile?.location || 'Bengaluru / Hybrid'}
            </p>
          </div>
        </div>
      </div>

      {/* Intelligent Candidate Search & JD Match Panel */}
      <div className="gold-card" style={{ padding: '24px', background: 'var(--bg-surface)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--green-primary)" />
          Intelligent Candidate Search & Job Description (JD) Matcher
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              JOB DESCRIPTION / INTERNSHIP REQUIREMENTS (JD)
            </label>
            <textarea
              rows={3}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste Job Description (e.g., 'Looking for a Backend Developer skilled in FastAPI, PostgreSQL pgvector, Rust WebAssembly, and Docker microservices...')"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                background: 'var(--bg-base)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                REQUIRED SKILLS
              </label>
              <input
                type="text"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="e.g. Rust, PyTorch, Next.js"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                DOMAIN EXPERTISE
              </label>
              <input
                type="text"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                placeholder="e.g. Distributed Systems, AI/ML"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                COLLEGE / INSTITUTION
              </label>
              <input
                type="text"
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                placeholder="e.g. IIT Madras, NIT Trichy"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              onClick={handleJDSearch}
              disabled={aiMatching}
              className="gold-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, var(--green-primary) 0%, #00c4a7 100%)',
                color: '#0a0f1d',
                fontWeight: 700
              }}
            >
              <Sparkles size={16} />
              {aiMatching ? 'Computing Match Rankings...' : 'Match & Rank Candidates'}
            </button>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {candidates.map((cand) => (
          <div key={cand.id || cand.student_id} className="gold-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <img
                  src={cand.avatar_url}
                  alt={cand.full_name}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-primary)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800 }}>
                      {cand.full_name}
                    </h3>
                    <span className="gold-badge green">✓ Verified Developer</span>
                    {cand.match_score && (
                      <span className="gold-badge blue" style={{ fontWeight: 800 }}>
                        {cand.match_score}% AI Match Score
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {cand.department} · {cand.college_name}
                  </p>

                  {/* Work Evidence Badges */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <span className="gold-badge green" style={{ fontSize: '11px' }}>
                      ⚡ {cand.contributions_count ?? 0} Merged PRs Evidence
                    </span>
                    <span className="gold-badge blue" style={{ fontSize: '11px' }}>
                      📁 {cand.projects_count ?? 0} Active Workspaces
                    </span>
                    <span className="gold-badge purple" style={{ fontSize: '11px' }}>
                      ⚙️ Domain: {cand.project_domain || 'General'}
                    </span>
                  </div>

                  {cand.reasoning_bullets && cand.reasoning_bullets.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '6px', borderLeft: '3px solid var(--accent-green)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>AI Grounded Rationale:</div>
                      {cand.reasoning_bullets.map((b: string, i: number) => (
                        <div key={i} style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '2px' }}>• {b}</div>
                      ))}
                    </div>
                  )}


                  {/* Candidate Social & Portfolio Verification Links */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px', fontSize: '12px' }}>
                    {cand.linkedin_url && (
                      <a
                        href={cand.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#0a66c2', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        💼 LinkedIn Profile ↗
                      </a>
                    )}
                    {cand.portfolio_url && (
                      <a
                        href={cand.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--gold-dark)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        🌐 Portfolio ↗
                      </a>
                    )}
                    {cand.github_handle && (
                      <a
                        href={`https://github.com/${cand.github_handle}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--text-main)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        🐙 GitHub ↗
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {(cand.skills || []).map((s: any, i: number) => (
                      <span key={i} className="gold-badge" style={{ fontSize: '11px' }}>
                        <Code size={10} /> {s.name} ({s.level})
                      </span>
                    ))}
                  </div>
                </div>
              </div>


              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--gold-dark)' }}>
                  Reputation: {cand.reputation_score} pts
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleShortlist(cand.user_id)}
                    className="gold-btn-outline"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => setSelectedStudent(cand)}
                    className="gold-btn"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <MessageSquare size={14} /> Direct Outreach
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Outreach Modal */}
      {selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="gold-card" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
              Direct Outreach to {selectedStudent.full_name}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Connect directly regarding internships, projects, or contract engineering roles based on demonstrated work.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Opportunity Type</label>
                <select
                  value={opportunityType}
                  onChange={(e) => setOpportunityType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                >
                  <option value="INTERNSHIP">Software Engineering Internship</option>
                  <option value="EMPLOYMENT">Full-time Technical Role</option>
                  <option value="CONTRACT">Open-source Contract Task</option>
                  <option value="FREELANCE">Freelance Architecture Consultation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Outreach Message</label>
                <textarea
                  rows={4}
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                  placeholder="Hi Aarav, we reviewed your merged PRs in HyperVector engine and would like to discuss an opportunity..."
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button onClick={() => setSelectedStudent(null)} className="gold-btn-outline" style={{ fontSize: '13px' }}>
                  Cancel
                </button>
                <button onClick={handleSendOutreach} className="gold-btn" style={{ fontSize: '13px' }}>
                  Send Direct Contact Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
