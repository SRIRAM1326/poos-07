'use client';

import React, { useState } from 'react';
import { X, Globe, Code2, Briefcase, GraduationCap, Sparkles, CheckCircle } from 'lucide-react';
import { UserRole } from '@/types';
import { api } from '@/services/api';

interface ProfileSetupModalProps {
  currentUser: any;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
}

export function ProfileSetupModal({ currentUser, onClose, onSuccess }: ProfileSetupModalProps) {
  const role: UserRole = currentUser?.role || 'STUDENT';

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [linkedinUrl, setLinkedinUrl] = useState(currentUser?.linkedin_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(currentUser?.portfolio_url || '');
  const [githubUrl, setGithubUrl] = useState(currentUser?.github_url || '');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [projectsText, setProjectsText] = useState('');
  const [bio, setBio] = useState('');
  const [collegeName, setCollegeName] = useState('Indian Institute of Technology, Madras');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Enterprise Software & AI');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        github_url: githubUrl,
        website_url: websiteUrl,
        skills: skillsText ? skillsText.split(',').map(s => s.trim()) : [],
        projects: projectsText ? projectsText.split(',').map(p => p.trim()) : [],
        bio,
        college_name: collegeName,
        company_name: companyName,
        industry,
        description
      };

      const res = await api.completeProfile(payload);
      if (res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.detail || 'Failed updating profile.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during profile setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-gold)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, #fffbe6 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="gold-badge green">
                <Sparkles size={12} /> CREATE YOUR PoOS PROFILE
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 0 0', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              Complete Your Discoverability Profile
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-soft)', margin: '4px 0 0 0' }}>
              Add your LinkedIn, portfolio, GitHub, skills, projects, and achievements to increase your recruiter visibility.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Student & Mentor Profile Fields */}
          {(role === 'STUDENT' || role === 'MENTOR') && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>FULL NAME</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: 'var(--bg-subtle)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  LINKEDIN PROFILE URL (OPTIONAL)
                </label>
                <div style={{ position: 'relative' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a66c2" style={{ position: 'absolute', left: '12px', top: '12px' }}>
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z"/>
                  </svg>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  PORTFOLIO WEBSITE URL (OPTIONAL)
                </label>
                <div style={{ position: 'relative' }}>
                  <Globe size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--gold-dark)' }} />
                  <input
                    type="url"
                    placeholder="https://yourportfolio.dev"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  GITHUB PROFILE URL / HANDLE (OPTIONAL)
                </label>
                <div style={{ position: 'relative' }}>
                  <Code2 size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-main)' }} />
                  <input
                    type="text"
                    placeholder="https://github.com/yourhandle or @yourhandle"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CORE SKILLS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  placeholder="e.g. Rust, FastAPI, React, PostgreSQL pgvector, Docker"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TECHNICAL BIO / INTERESTS</label>
                <textarea
                  rows={3}
                  placeholder="Tell maintainers and recruiters about your engineering focus..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>
            </>
          )}

          {/* College Profile Fields */}
          {role === 'COLLEGE_ADMIN' && (
            <>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>INSTITUTION NAME</label>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COLLEGE WEBSITE URL</label>
                <input
                  type="url"
                  placeholder="https://www.institution.edu"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>LINKEDIN PAGE URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/school/institution"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>
            </>
          )}

          {/* Company Profile Fields (IT & Non-IT) */}
          {(role === 'IT_COMPANY' || role === 'NON_IT_COMPANY') && (
            <>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COMPANY NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme AI Labs"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  COMPANY WEBSITE URL (STRONGLY RECOMMENDED)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://acmetech.io"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  LINKEDIN COMPANY PAGE URL (STRONGLY RECOMMENDED)
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/company/acmetech"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>INDUSTRY & DOMAIN FOCUS</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Software, AI Infrastructure, Supply Chain"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COMPANY DESCRIPTION</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of engineering or operations domain..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="gold-btn-outline" style={{ fontSize: '13px' }}>
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gold-btn"
              style={{
                fontSize: '13px',
                padding: '10px 24px',
                background: 'linear-gradient(135deg, var(--gold-dark) 0%, #b8860b 100%)',
                color: '#ffffff',
                fontWeight: 700
              }}
            >
              {loading ? 'Saving Profile...' : 'Complete PoOS Profile ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
