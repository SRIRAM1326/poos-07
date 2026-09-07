'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, UserCircle, FolderGit2, Users, 
  UserCheck, MessageSquare, Calendar, GitPullRequest, 
  Award, Compass, LineChart, Settings
} from 'lucide-react';
import { MentorOverview } from './components/MentorOverview';
import { MentorProjects } from './components/MentorProjects';
import { MentorStudents } from './components/MentorStudents';
import { 
  MentorMentorship, MentorEvents, MentorTeams, 
  MentorContributions, MentorCertificates, MentorDiscover, 
  MentorAnalytics, MentorSettings, MentorSuperProfile 
} from './components/MentorPlaceholders';
import { useLiveNotifications } from '@/hooks/useLiveNotifications';
import { LiveToast } from '@/components/ui/LiveToast';

interface MentorDashboardProps {
  activeTab?: string;
  onSelectProject?: (id: number) => void;
  currentUser?: any;
}

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'My Super Profile', icon: UserCircle },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'students', label: 'Students / Mentees', icon: UserCheck },
  { id: 'mentorship', label: 'Mentorship', icon: MessageSquare },
  { id: 'events', label: 'Events & Hackathons', icon: Calendar },
  { id: 'contributions', label: 'Contributions', icon: GitPullRequest },
  { id: 'certificates', label: 'Certificates & Achievements', icon: Award },
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ activeTab = 'overview', currentUser }) => {
  const [currentView, setCurrentView] = useState(activeTab);
  const { latestNotification } = useLiveNotifications(currentUser?.id || 1);

  const renderContent = () => {
    switch (currentView) {
      case 'overview': return <MentorOverview />;
      case 'profile': return <MentorSuperProfile />;
      case 'projects': return <MentorProjects />;
      case 'teams': return <MentorTeams />;
      case 'students': return <MentorStudents />;
      case 'mentorship': return <MentorMentorship />;
      case 'events': return <MentorEvents />;
      case 'contributions': return <MentorContributions />;
      case 'certificates': return <MentorCertificates />;
      case 'discover': return <MentorDiscover />;
      case 'analytics': return <MentorAnalytics />;
      case 'settings': return <MentorSettings />;
      default: return <MentorOverview />;
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
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Professional Portal</h2>
          <div style={{ fontSize: '12px', color: 'var(--purple-primary)', fontWeight: 600, marginTop: '4px' }}>Ecosystem Mentor & Reviewer</div>
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
