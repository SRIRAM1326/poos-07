'use client';

import React, { useEffect, useState } from 'react';
import { api, getCurrentUserId } from '@/services/api';
import { Briefcase, CheckCircle, MessageSquare, ShieldCheck } from 'lucide-react';

interface NonITCompanyDashboardProps {
  activeTab?: string;
  onSelectProject?: (id: number) => void;
  currentUser?: any;
}

export const NonITCompanyDashboard: React.FC<NonITCompanyDashboardProps> = ({ activeTab = 'dashboard', onSelectProject, currentUser }) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [outreachMessage, setOutreachMessage] = useState('');
  const [opportunityType, setOpportunityType] = useState('CONSULTING');
  const [successToast, setSuccessToast] = useState('');

  const [jdText, setJdText] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [aiMatching, setAiMatching] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any | null>(null);

  const handleJDSearch = async () => {
    setAiMatching(true);
    try {
      const res = await api.searchTalentWithJD({
        job_description: jdText,
        skills: skillFilter,
        domain_expertise: domainFilter,
        company_type: 'NON_IT'
      });
      setCandidates(res.rankings || []);
      setSuccessToast(`Intelligently matched & ranked ${res.total_ranked} industry & operations candidates!`);
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
        const data = await api.searchNonITTalent();
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
        console.error('Failed loading non-IT talent:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleShortlist = async (studentId: number) => {
    try {
      await api.shortlistCandidate(studentId, 'Industry Operations Candidate', 'Shortlisted for logistics & supply chain data analytics project');
      setSuccessToast('Candidate added to Non-IT Industry Shortlist!');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.error('Failed shortlisting candidate:', err);
    }
  };

  const handleSendOutreach = async () => {
    if (!selectedStudent || !outreachMessage) return;
    try {
      await api.sendContactRequest(selectedStudent.user_id, opportunityType, outreachMessage);
      setSuccessToast(`Consultation request sent to ${selectedStudent.full_name}!`);
      setSelectedStudent(null);
      setOutreachMessage('');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error('Failed sending contact request:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Toast */}
      {successToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--gold-dark)',
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

      {/* Non-IT Banner */}
      <div className="gold-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #ffffff 0%, #fffbe6 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800 }}>
                {companyProfile?.company_name || 'Industry Company'}
              </h1>
              <span className="gold-badge amber" style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#ffedd5' }}>
                <ShieldCheck size={12} /> Verified Non-IT Enterprise
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold-dark)', marginTop: '4px' }}>
              {companyProfile?.industry || 'Industry'} · {companyProfile?.location || 'Bengaluru / Hybrid'}
            </p>
          </div>
        </div>
      </div>

      {/* Non-IT Candidate Search & JD Matcher */}
      <div className="gold-card" style={{ padding: '24px', background: 'var(--bg-surface)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={18} color="var(--gold-dark)" />
          Operations & Industry Project Candidate Search (JD & Domain)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              PROJECT / CONSULTING JOB DESCRIPTION (JD)
            </label>
            <textarea
              rows={2}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="e.g. 'Seeking candidate with expertise in real-time supply chain simulation, PyTorch route analytics, and SQL data warehousing...'"
              style={{
                width: '100%',
                padding: '10px',
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
                DOMAIN / OPERATIONS FOCUS
              </label>
              <input
                type="text"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                placeholder="e.g. Supply Chain Analytics, FinTech"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                TECHNICAL & ANALYTICS SKILLS
              </label>
              <input
                type="text"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="e.g. Python Analytics, SQL, Simulation"
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
                background: 'var(--gold-dark)',
                color: '#ffffff',
                fontWeight: 700
              }}
            >
              <Briefcase size={16} />
              {aiMatching ? 'Computing Candidate Rationale...' : 'Match & Rank Industry Candidates'}
            </button>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {candidates.map((cand) => (
          <div key={cand.id} className="gold-card" style={{ padding: '24px' }}>
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
                    <span className="gold-badge blue">{cand.domain_focus}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {cand.department} · {cand.college_name}
                  </p>

                  {/* Candidate Social & Portfolio Verification Links */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px', fontSize: '12px' }}>
                    <a
                      href={cand.linkedin_url || `https://linkedin.com/in/${cand.full_name.toLowerCase().replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0a66c2', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      💼 LinkedIn Profile ↗
                    </a>
                    <a
                      href={cand.portfolio_url || `https://${cand.full_name.toLowerCase().replace(/\s+/g, '')}.dev`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--gold-dark)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      🌐 Portfolio ↗
                    </a>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {(cand.skills || []).map((s: any, i: number) => (
                      <span key={i} className="gold-badge" style={{ fontSize: '11px' }}>
                        <Briefcase size={10} /> {s.name}
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
                    Shortlist Candidate
                  </button>
                  <button
                    onClick={() => setSelectedStudent(cand)}
                    className="gold-btn"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <MessageSquare size={14} /> Direct Consultation
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Outreach Modal */}
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
              Contact {selectedStudent.full_name} for Industry Project
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Direct outreach for logistics optimization, analytics automation, or supply chain consulting.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Opportunity Type</label>
                <select
                  value={opportunityType}
                  onChange={(e) => setOpportunityType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                >
                  <option value="CONSULTING">Supply Chain Consultation</option>
                  <option value="FREELANCE">Data Analytics Automation Contract</option>
                  <option value="INTERNSHIP">Operations Technology Internship</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Message</label>
                <textarea
                  rows={4}
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                  placeholder="Hi Aarav, we saw your SmartGrid Logistics simulation repo and would like to hire you for a consultation..."
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button onClick={() => setSelectedStudent(null)} className="gold-btn-outline" style={{ fontSize: '13px' }}>
                  Cancel
                </button>
                <button onClick={handleSendOutreach} className="gold-btn" style={{ fontSize: '13px' }}>
                  Send Contact Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
