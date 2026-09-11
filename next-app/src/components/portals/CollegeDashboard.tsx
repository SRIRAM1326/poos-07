'use client';

import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, ShieldCheck, Building2,
  FolderGit2, Calendar, Users2, UserPlus,
  Award, FileBadge, LineChart, Trophy, Globe, Settings, Briefcase
} from 'lucide-react';
import { CollegeOverview } from './college/CollegeOverview';
import { CollegeStudents } from './college/CollegeStudents';
import { CollegeProjects } from './college/CollegeProjects';
import { CollegeProfileView } from './college/CollegeProfile';
import { useLiveNotifications } from '@/hooks/useLiveNotifications';
import { api, getCurrentUserId } from '@/services/api';
import { LiveToast } from '@/components/ui/LiveToast';
import { CollegeEvents } from './college/CollegeEvents';
import {
  CollegeHackathons, CollegeMentors,
  CollegeInternships, CollegePlacements, CollegeCertificates,
  CollegeAnalytics, CollegeDepartments
} from './college/CollegePlaceholders';

interface CollegeDashboardProps {
  activeTab?: string;
  onSelectProject?: (id: number) => void;
  currentUser?: any;
}

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'events', label: 'Events & Hackathons', icon: Calendar },
  { id: 'profile', label: 'College Profile', icon: Globe },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const CollegeDashboard: React.FC<CollegeDashboardProps> = ({ activeTab = 'overview', currentUser }) => {
  const [currentView, setCurrentView] = useState(activeTab);
  const userId = currentUser?.id || getCurrentUserId();
  const { latestNotification } = useLiveNotifications(userId);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  // College Admin verification status (Google OAuth identity + completed profile).
  // After successful login the admin lands only on this dashboard; the header
  // reflects whether the institution is verified or still pending.
  useEffect(() => {
    let cancelled = false;
    async function loadVerification() {
      if (!userId) return;
      try {
        const data = await api.getCollegeProfile(userId);
        if (!cancelled) setIsVerified(!!data?.is_verified);
      } catch {
        if (!cancelled) setIsVerified(null);
      }
    }
    loadVerification();
    return () => { cancelled = true; };
  }, [userId]);

  const renderContent = () => {
    switch (currentView) {
      case 'overview': return <CollegeOverview />;
      case 'students': return <CollegeStudents />;
      case 'verification': return <CollegeStudents />; // Currently sharing view, can be split later
      case 'departments': return <CollegeDepartments />;
      case 'projects': return <CollegeProjects />;
      case 'events': return <CollegeEvents />;
      case 'mentorship': return <CollegeMentors />;
      case 'participation': return <CollegeAnalytics />;
      case 'internships': return <CollegeInternships />;
      case 'certificates': return <CollegeCertificates />;
      case 'placement': return <CollegePlacements />;
      case 'analytics': return <CollegeAnalytics />;
      case 'leaderboard': return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No leaderboard data to display.</div>;
      case 'profile': return <CollegeProfileView userId={userId} />;
      case 'settings': return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No settings data to display.</div>;
      default: return <CollegeOverview />;
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 72px)', background: 'var(--bg-main)', margin: '-40px' }}>

      {/* Sidebar Navigation */}
      <div style={{
        width: '260px',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>College Portal</h2>
          <div style={{ fontSize: '12px', color: isVerified ? 'var(--purple-primary)' : 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
            {isVerified === null ? 'Google Verified Sign-in' : isVerified ? 'Verified Institution' : 'Pending Verification'}
          </div>
        </div>

        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 16px', borderRadius: '6px', border: 'none',
                  background: isActive ? 'var(--purple-bg)' : 'transparent',
                  color: isActive ? 'var(--purple-primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '14px', cursor: 'pointer',
                  transition: 'all 0.2s', textAlign: 'left'
                }}
              >
                <Icon size={18} color={isActive ? 'var(--purple-primary)' : 'var(--text-muted)'} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: 'var(--bg-main)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {renderContent()}
        </div>
      </div>

      <LiveToast notification={latestNotification} onDismiss={() => { }} />
    </div>
  );
};
