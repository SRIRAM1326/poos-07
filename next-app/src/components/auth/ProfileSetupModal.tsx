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
  const [collegeName, setCollegeName] = useState(currentUser?.college_name || '');
  const [officialEmail] = useState(currentUser?.email || '');
  const [collegeWebsite, setCollegeWebsite] = useState('');
  const [collegeLogoUrl, setCollegeLogoUrl] = useState('');
  const [collegeLocation, setCollegeLocation] = useState('');
  const [collegeDescription, setCollegeDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [accreditation, setAccreditation] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [collegeType, setCollegeType] = useState('');
  const [officialContactEmail, setOfficialContactEmail] = useState(currentUser?.email || '');
  const [collegeAddress, setCollegeAddress] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [otherLinks, setOtherLinks] = useState('');
  const [adminContactNumber, setAdminContactNumber] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [adminName, setAdminName] = useState(currentUser?.full_name || '');
  const [adminDesignation, setAdminDesignation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: Record<string, any> = role === 'COLLEGE_ADMIN'
        ? {
            college_name: collegeName,
            college_website: collegeWebsite,
            website_url: collegeWebsite,
            college_logo_url: collegeLogoUrl,
            location: collegeLocation,
            description: collegeDescription,
            contact_number: contactNumber,
            accreditation,
            admin_name: adminName,
            admin_designation: adminDesignation,
            affiliation,
            established_year: establishedYear,
            college_type: collegeType,
            official_contact_email: officialContactEmail,
            address: collegeAddress,
            instagram_url: instagramUrl,
            youtube_url: youtubeUrl,
            other_links: otherLinks ? otherLinks.split(',').map(s => s.trim()).filter(Boolean) : [],
            admin_contact_number: adminContactNumber,
            admin_role: adminRole,
          }
        : {
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
              {role === 'COLLEGE_ADMIN' ? 'Complete Your College Verification Profile' : 'Complete Your Discoverability Profile'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-soft)', margin: '4px 0 0 0' }}>
              {role === 'COLLEGE_ADMIN'
                ? 'Add your official college details and admin contact so your institution can be verified on PoOS.'
                : 'Add your LinkedIn, portfolio, GitHub, skills, projects, and achievements to increase your recruiter visibility.'}
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

          {/* College Admin Profile Fields (first-login completion after Google OAuth) */}
          {role === 'COLLEGE_ADMIN' && (
            <>
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--purple-bg, #f3e8ff)', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-main)' }}>
                Signed in with Google as <strong>{officialEmail || email || 'your official college email'}</strong>. Complete your college verification profile to access the College Admin dashboard.
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COLLEGE NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indian Institute of Technology, Madras"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OFFICIAL COLLEGE EMAIL</label>
                <input
                  type="email"
                  disabled
                  value={officialEmail || email}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: 'var(--bg-subtle)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COLLEGE WEBSITE *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.institution.edu"
                    value={collegeWebsite}
                    onChange={(e) => setCollegeWebsite(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COLLEGE LOGO (URL)</label>
                  <input
                    type="url"
                    placeholder="https://www.institution.edu/logo.png"
                    value={collegeLogoUrl}
                    onChange={(e) => setCollegeLogoUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>LOCATION *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai, Tamil Nadu"
                    value={collegeLocation}
                    onChange={(e) => setCollegeLocation(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CONTACT NUMBER *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 44 2257 8000"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COLLEGE DESCRIPTION *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Brief overview of your institution, programs, and campus..."
                  value={collegeDescription}
                  onChange={(e) => setCollegeDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ACCREDITATION / AFFILIATION DETAILS *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NAAC A++, NBA Accredited, Affiliated to Anna University"
                  value={accreditation}
                  onChange={(e) => setAccreditation(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ADMIN NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Raman"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ADMIN DESIGNATION *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dean of Student Affairs"
                    value={adminDesignation}
                    onChange={(e) => setAdminDesignation(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>AFFILIATION / UNIVERSITY</label>
                  <input
                    type="text"
                    placeholder="e.g. Affiliated to Anna University"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ESTABLISHED YEAR</label>
                  <input
                    type="text"
                    placeholder="e.g. 1959"
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COLLEGE TYPE</label>
                <select
                  value={collegeType}
                  onChange={(e) => setCollegeType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: 'var(--bg-main)' }}
                >
                  <option value="">Select college type...</option>
                  <option value="Government">Government</option>
                  <option value="Private">Private</option>
                  <option value="Autonomous">Autonomous</option>
                  <option value="Deemed University">Deemed University</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OFFICIAL CONTACT EMAIL</label>
                  <input
                    type="email"
                    placeholder="e.g. info@institution.edu"
                    value={officialContactEmail}
                    onChange={(e) => setOfficialContactEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ADMIN CONTACT NUMBER</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98400 12345"
                    value={adminContactNumber}
                    onChange={(e) => setAdminContactNumber(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COLLEGE ADDRESS</label>
                <textarea
                  rows={2}
                  placeholder="Official campus address..."
                  value={collegeAddress}
                  onChange={(e) => setCollegeAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>INSTAGRAM URL</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/institution"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>YOUTUBE URL</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@institution"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OTHER OFFICIAL PROFILES (COMMA SEPARATED URLS)</label>
                <input
                  type="text"
                  placeholder="e.g. https://x.com/institution, https://facebook.com/institution"
                  value={otherLinks}
                  onChange={(e) => setOtherLinks(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ADMIN ROLE</label>
                <input
                  type="text"
                  placeholder="e.g. Placement Officer, HOD CSE, Faculty Coordinator"
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
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
