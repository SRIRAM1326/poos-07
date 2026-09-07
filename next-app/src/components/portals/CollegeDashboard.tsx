'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, ShieldCheck, Building2, 
  FolderGit2, Calendar, Users2, UserPlus, 
  Award, FileBadge, LineChart, Trophy, Globe, Settings, Briefcase
} from 'lucide-react';
import { CollegeOverview } from './college/CollegeOverview';
import { CollegeStudents } from './college/CollegeStudents';
import { CollegeProjects } from './college/CollegeProjects';
import { useLiveNotifications } from '@/hooks/useLiveNotifications';
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
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'events', label: 'Events & Hackathons', icon: Calendar },
  { id: 'mentorship', label: 'Mentorship', icon: Users2 },
  { id: 'participation', label: 'Participation', icon: UserPlus },
  { id: 'internships', label: 'Internships', icon: Briefcase },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'placement', label: 'Placement Evidence', icon: FileBadge },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'profile', label: 'College Profile', icon: Globe },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const CollegeDashboard: React.FC<CollegeDashboardProps> = ({ activeTab = 'overview', currentUser }) => {
  const [currentView, setCurrentView] = useState(activeTab);
  const { latestNotification } = useLiveNotifications(currentUser?.id || 1);

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
      case 'leaderboard': return <div style={{ padding: '40px', textAlign: 'center' }}>Leaderboard Mock</div>;
      case 'profile': return <div style={{ padding: '40px', textAlign: 'center' }}>Profile Mock</div>;
      case 'settings': return <div style={{ padding: '40px', textAlign: 'center' }}>Settings Mock</div>;
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
          <div style={{ fontSize: '12px', color: 'var(--purple-primary)', fontWeight: 600, marginTop: '4px' }}>Verified Institution</div>
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

      <LiveToast notification={latestNotification} onDismiss={() => {}} />
    </div>
  );
};
