'use client';

import React, { useState } from 'react';
import { User, UserRole } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StudentDashboard } from '@/components/portals/StudentDashboard';
import { CollegeDashboard } from '@/components/portals/CollegeDashboard';
import { MentorDashboard } from '@/components/portals/mentor/MentorDashboard';
import { ITCompanyDashboard } from '@/components/portals/ITCompanyDashboard';
import { NonITCompanyDashboard } from '@/components/portals/NonITCompanyDashboard';
import { ProjectWorkspace } from '@/components/workspace/ProjectWorkspace';
import { LeaderboardsView } from '@/components/recognition/LeaderboardsView';
import { CertificatesModal } from '@/components/recognition/CertificatesModal';
import { EventsView } from '@/components/recognition/EventsView';
import { AuthModal } from '@/components/auth/AuthModal';
import { DirectMessagesModal } from '@/components/messaging/DirectMessagesModal';
import { ProfileSetupModal } from '@/components/auth/ProfileSetupModal';
import { api, setAuthToken, clearAuthSession, getAuthToken } from '@/services/api';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole>('STUDENT');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Auth & User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [authError, setAuthError] = useState('');

  // Modals
  const [showLeaderboards, setShowLeaderboards] = useState(false);
  const [showCertificates, setShowCertificates] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  const applySessionUser = (user: User, isRestore: boolean) => {
    setCurrentUser(user);
    if (user?.role) {
      setCurrentRole(user.role as UserRole);
      setActiveTab('dashboard');
      setSelectedProjectId(null);
    }
    if (!isRestore && user && !user.profile_completed) {
      setShowProfileSetup(true);
    }
  };

  // Restore an active session on load, or complete an in-flight OAuth callback.
  React.useEffect(() => {
    let cancelled = false;
    async function initialize() {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const githubCode = params.get('code');
      const githubState = params.get('state');
      const isGithub = params.get('github_auth') === 'success';
      const isGoogle = params.get('google_auth') === 'success';

      try {
        if (isGithub || isGoogle) {
          if (!githubCode || !githubState) {
            setAuthError('OAuth login failed: the authorization code is missing.');
            clearAuthSession();
          } else if (isGithub) {
            const res = await api.getGitHubCallback(githubCode, githubState);
            if (res.access_token) {
              setAuthToken(res.access_token, res.user?.id);
              applySessionUser(res.user, false);
            } else {
              setAuthError('GitHub login failed. Please try again.');
            }
          } else if (isGoogle) {
            const res = await api.getGoogleCallback(githubCode, githubState);
            if (res.access_token) {
              setAuthToken(res.access_token, res.user?.id);
              applySessionUser(res.user, false);
            } else {
              setAuthError('Google login failed. Please try again.');
            }
          }
        } else {
          const token = getAuthToken();
          if (token) {
            try {
              const res = await api.me();
              if (!cancelled && res.user) {
                applySessionUser(res.user, true);
              }
            } catch {
              clearAuthSession();
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setAuthError(err instanceof Error ? err.message : 'Authentication failed. Please try signing in again.');
          clearAuthSession();
        }
      } finally {
        if (!cancelled) {
          setBootstrapped(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
    initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    setAuthError('');
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthSession();
      setCurrentUser(null);
      setCurrentRole('STUDENT');
      setActiveTab('dashboard');
      setSelectedProjectId(null);
      setShowProfileSetup(false);
      setShowMessages(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'certificates') {
      setShowCertificates(true);
    } else if (tab === 'events') {
      setShowEvents(true);
    } else if (tab === 'outreach') {
      setShowMessages(true);
    } else if (tab === 'domain_projects' || tab === 'reviews') {
      setSelectedProjectId(1);
    } else {
      setSelectedProjectId(null);
    }
  };

  const renderActivePortal = () => {
    if (selectedProjectId !== null) {
      return <ProjectWorkspace projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />;
    }

    switch (currentRole) {
      case 'STUDENT':
        return (
          <StudentDashboard
            activeTab={activeTab}
            currentUser={currentUser}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onOpenCertificates={() => setShowCertificates(true)}
          />
        );
      case 'COLLEGE_ADMIN':
        return <CollegeDashboard activeTab={activeTab} currentUser={currentUser} onSelectProject={(id) => setSelectedProjectId(id)} />;
      case 'MENTOR':
        return <MentorDashboard activeTab={activeTab} currentUser={currentUser} onSelectProject={(id) => setSelectedProjectId(id)} />;
      case 'IT_COMPANY':
        return <ITCompanyDashboard activeTab={activeTab} currentUser={currentUser} onSelectProject={(id) => setSelectedProjectId(id)} />;
      case 'NON_IT_COMPANY':
        return <NonITCompanyDashboard activeTab={activeTab} currentUser={currentUser} onSelectProject={(id) => setSelectedProjectId(id)} />;
      default:
        return (
          <StudentDashboard
            activeTab={activeTab}
            currentUser={currentUser}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onOpenCertificates={() => setShowCertificates(true)}
          />
        );
    }
  };

  const SELF_CONTAINED_PORTALS = ['COLLEGE_ADMIN', 'MENTOR'];
  const hasGlobalSidebar = !SELF_CONTAINED_PORTALS.includes(currentRole);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <Navbar
        onOpenCertificates={() => setShowCertificates(true)}
        onOpenLeaderboard={() => setShowLeaderboards(true)}
        onOpenEvents={() => setShowEvents(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenMessages={() => setShowMessages(true)}
        onOpenProfileSetup={() => setShowProfileSetup(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        {hasGlobalSidebar && currentUser && (
          <Sidebar
            currentRole={currentRole}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}

        <main style={{ flex: 1, padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {!bootstrapped ? null : !currentUser ? (
            <div style={{ textAlign: 'center', padding: '80px 0', maxWidth: 520, margin: '0 auto' }}>
              <h1 style={{ fontSize: 24, marginBottom: 12, color: 'var(--text-primary)' }}>Welcome to PoOS</h1>
              <p style={{ color: 'var(--text-soft)', marginBottom: 24 }}>
                Sign in with GitHub or Google to access your student, college, mentor and company portals.
              </p>
              {authError && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  {authError}
                </div>
              )}
              <button
                onClick={() => { setAuthError(''); setShowAuthModal(true); }}
                style={{
                  padding: '12px 28px', borderRadius: 'var(--radius-md)', border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-green), var(--gold-primary))',
                  color: '#0a0a0a', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </div>
          ) : renderActivePortal()}
        </main>
      </div>

      {/* Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showProfileSetup && <ProfileSetupModal currentUser={currentUser} onClose={() => setShowProfileSetup(false)} onSuccess={(updated) => setCurrentUser(updated)} />}
      {showMessages && <DirectMessagesModal onClose={() => setShowMessages(false)} />}
      {showLeaderboards && <LeaderboardsView onClose={() => setShowLeaderboards(false)} />}
      {showCertificates && <CertificatesModal onClose={() => setShowCertificates(false)} />}
      {showEvents && <EventsView onClose={() => setShowEvents(false)} />}
    </div>
  );
}