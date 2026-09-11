import React, { useEffect, useState } from 'react';
import { api, getCurrentUserId } from '@/services/api';
import {
  ShieldCheck, Clock, XCircle, Globe, MapPin, Phone, User,
  Briefcase, Mail, Building2, Calendar, Camera, Play, Link2,
} from 'lucide-react';

interface VerificationBlock {
  status?: string | null;
  verified_by?: string | null;
  verification_date?: string | null;
}

interface CollegeProfileData {
  college_name?: string | null;
  college_code?: string | null;
  official_email?: string | null;
  email?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin_url?: string | null;
  logo_url?: string | null;
  description?: string | null;
  contact_number?: string | null;
  accreditation?: string | null;
  affiliation?: string | null;
  established_year?: string | null;
  college_type?: string | null;
  official_contact_email?: string | null;
  address?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  other_links?: string[];
  departments_json?: any[];
  admin_name?: string | null;
  admin_designation?: string | null;
  admin_official_email?: string | null;
  admin_contact_number?: string | null;
  admin_role?: string | null;
  profile_photo?: string | null;
  account_status?: string | null;
  is_verified?: boolean | null;
  verification?: VerificationBlock | null;
}

function Field({ label, value, link }: { label: string; value?: string | null; link?: boolean }) {
  if (!value) {
    return (
      <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ display: 'block', fontSize: '14px', marginTop: '2px', color: 'var(--text-muted)' }}>—</span>
      </div>
    );
  }
  return (
    <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginTop: '2px', color: 'var(--purple-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</a>
      ) : (
        <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{value}</span>
      )}
    </div>
  );
}

export const CollegeProfileView: React.FC<{ userId?: number | null }> = ({ userId }) => {
  const [profile, setProfile] = useState<CollegeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const id = userId || getCurrentUserId();
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getCollegeProfile(id);
        if (!cancelled) setProfile(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load college profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading college profile...</div>;
  }

  if (error || !profile) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{error || 'No college profile data to display.'}</div>;
  }

  const verificationStatus = profile.verification?.status || (profile.is_verified ? 'VERIFIED' : 'NOT_VERIFIED');
  const verificationBadge = verificationStatus === 'VERIFIED'
    ? { cls: 'green', dot: '🟢', label: 'Verified', icon: <ShieldCheck size={12} /> }
    : verificationStatus === 'PENDING'
      ? { cls: 'orange', dot: '🟡', label: 'Pending', icon: <Clock size={12} /> }
      : { cls: 'red', dot: '🔴', label: 'Not Verified', icon: <XCircle size={12} /> };

  const departments = (profile.departments_json || [])
    .map(d => typeof d === 'string' ? d : d?.name)
    .filter(Boolean);
  const otherLinks = profile.other_links || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>College Profile</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>Verified identity from Google OAuth and completed college details</p>
      </div>

      <div className="gold-card">
        <div className="gold-card-body" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {profile.logo_url ? (
            <img src={profile.logo_url} alt="College logo" style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#fff' }} />
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: 'var(--purple-primary)' }}>
              {(profile.college_name || 'C').charAt(0)}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{profile.college_name || 'Unnamed College'}</h3>
              <span className={`gold-badge ${verificationBadge.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                {verificationBadge.icon} {verificationBadge.dot} College {verificationBadge.label}
              </span>
            </div>
            {(profile.official_email || profile.email) && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{profile.official_email || profile.email}</div>}
            {profile.college_code && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Code: {profile.college_code}</div>}
            {profile.description && <p style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '12px', lineHeight: 1.6 }}>{profile.description}</p>}
          </div>
        </div>
      </div>

      <div className="gold-card">
        <div className="gold-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, margin: 0 }}>
            <Building2 size={18} color="var(--purple-primary)" /> College Information
          </h3>
        </div>
        <div className="gold-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <Field label="College Name" value={profile.college_name} />
          <Field label="College Website" value={profile.website} link />
          <Field label="Location" value={profile.location} />
          <Field label="Affiliation / University" value={profile.affiliation} />
          <Field label="Accreditation" value={profile.accreditation} />
          <Field label="Established Year" value={profile.established_year} />
          <Field label="College Type" value={profile.college_type} />
          <Field label="Official Contact Email" value={profile.official_contact_email || profile.official_email || profile.email} />
          <Field label="Official Contact Number" value={profile.contact_number} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="College Address" value={profile.address} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="College Description" value={profile.description} />
          </div>
          <div style={{ gridColumn: '1 / -1', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Departments</span>
            {(departments.length === 0) ? (
              <span style={{ display: 'block', fontSize: '14px', marginTop: '2px', color: 'var(--text-muted)' }}>—</span>
            ) : (
              <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {departments.map(d => (
                  <span key={d} style={{ fontSize: '12px', padding: '2px 8px', background: 'var(--bg-main)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{d}</span>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="gold-card">
        <div className="gold-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, margin: 0 }}>
            <Link2 size={18} color="var(--purple-primary)" /> Social Links
          </h3>
        </div>
        <div className="gold-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}><Briefcase size={12} /> LinkedIn</span>
            {profile.linkedin_url ? <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--purple-primary)' }}>Official page</a> : <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>—</span>}
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}><Camera size={12} /> Instagram</span>
            {profile.instagram_url ? <a href={profile.instagram_url} target="_blank" rel="noreferrer" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--purple-primary)' }}>Official profile</a> : <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>—</span>}
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}><Play size={12} /> YouTube</span>
            {profile.youtube_url ? <a href={profile.youtube_url} target="_blank" rel="noreferrer" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--purple-primary)' }}>Official channel</a> : <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>—</span>}
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}><Globe size={12} /> Other Official Profiles</span>
            {otherLinks.length === 0 ? <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>—</span> : (
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                {otherLinks.map(l => <a key={l} href={l} target="_blank" rel="noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--purple-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}</a>)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="gold-card">
        <div className="gold-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, margin: 0 }}>
            <User size={18} color="var(--purple-primary)" /> Admin Information
          </h3>
        </div>
        <div className="gold-card-body" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {profile.profile_photo ? (
            <img src={profile.profile_photo} alt="Admin profile photo" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-color)' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color="var(--text-muted)" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: '240px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <Field label="Admin Name" value={profile.admin_name} />
            <Field label="Designation" value={profile.admin_designation} />
            <Field label="Official College Email" value={profile.admin_official_email || profile.official_email || profile.email} />
            <Field label="Contact Number" value={profile.admin_contact_number} />
            <Field label="Admin Role" value={profile.admin_role} />
            <Field label="Account Status" value={profile.account_status || 'ACTIVE'} />
          </div>
        </div>
      </div>

      <div className="gold-card">
        <div className="gold-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, margin: 0 }}>
            <ShieldCheck size={18} color="var(--purple-primary)" /> College Verification
          </h3>
        </div>
        <div className="gold-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verification Status</span>
            <span className={`gold-badge ${verificationBadge.cls}`} style={{ marginTop: '6px', fontSize: '12px' }}>
              {verificationBadge.icon} {verificationBadge.dot} {verificationBadge.label}
            </span>
          </div>
          <Field label="Verified By" value={profile.verification?.verified_by} />
          <Field label="Verification Date" value={profile.verification?.verification_date} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <MapPin size={12} /> {profile.address || profile.location || 'Address not provided'}
        <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {profile.contact_number || '—'}</span>
        <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {profile.official_contact_email || profile.official_email || profile.email || '—'}</span>
        {profile.established_year && <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> Est. {profile.established_year}</span>}
        {profile.college_type && <span style={{ marginLeft: '12px' }}>{profile.college_type}</span>}
      </div>
    </div>
  );
};
