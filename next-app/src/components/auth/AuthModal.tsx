'use client';

import React, { useState } from 'react';
import { X, GraduationCap, ShieldCheck, Building, Briefcase, Factory, LucideIcon } from 'lucide-react';
import { UserRole } from '@/types';
import { api } from '@/services/api';

interface AuthModalProps {
  onClose: () => void;
}

interface RoleOption {
  key: UserRole;
  label: string;
  description: string;
  provider: 'github' | 'google';
  icon: LucideIcon;
}

const ROLES: RoleOption[] = [
  { key: 'STUDENT', label: 'Student', description: 'Build skills & get discovered', provider: 'github', icon: GraduationCap },
  { key: 'MENTOR', label: 'Mentor / Professional', description: 'Guide the next generation', provider: 'github', icon: ShieldCheck },
  { key: 'COLLEGE_ADMIN', label: 'College Admin', description: 'Verify & showcase your campus', provider: 'google', icon: Building },
  { key: 'IT_COMPANY', label: 'IT Company', description: 'Find top technical talent', provider: 'google', icon: Briefcase },
  { key: 'NON_IT_COMPANY', label: 'Non-IT Company', description: 'Hire for ops & domain roles', provider: 'google', icon: Factory },
];

export function AuthModal({ onClose }: AuthModalProps) {
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = ROLES.find(r => r.key === role) || ROLES[0];

  const continueWithOAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const res =
        selected.provider === 'github'
          ? await api.getGitHubAuthUrl(role)
          : await api.getGoogleAuthUrl(role);
      if (res.auth_url) {
        window.location.href = res.auth_url;
      } else {
        setError('OAuth configuration is unavailable. Please contact the administrator.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth is unavailable right now. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Sign in to PoOS Platform
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              OAuth-only login — sign in with your provider, no email/password fields.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              SELECT ACCOUNT ROLE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '10px 4px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--accent-green)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(0, 245, 212, 0.08)' : 'var(--bg-subtle)',
                      color: isSelected ? 'var(--accent-green)' : 'var(--text-muted)',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      gap: '4px'
                    }}
                  >
                    <Icon size={16} />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid var(--gold-border)',
            background: 'var(--gold-bg)',
            marginBottom: '18px',
            fontSize: '12px',
            color: 'var(--gold-dark)'
          }}>
            Continue as <strong>{selected.label}</strong> —{' '}
            {selected.provider === 'github' ? 'sign in with GitHub' : 'sign in with Google'}.
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={continueWithOAuth}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: selected.provider === 'github' ? '#1b1f24' : 'var(--bg-subtle)',
              color: selected.provider === 'github' ? '#ffffff' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {selected.provider === 'github' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            {loading ? 'Redirecting to provider...' : `Continue with ${selected.provider === 'github' ? 'GitHub' : 'Google'}`}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Students & Mentors sign in with GitHub · College Admins & Companies sign in with Google
          </p>
        </div>
      </div>
    </div>
  );
}