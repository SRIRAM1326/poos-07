'use client';

import React from 'react';
import { UserRole } from '@/types';
import { 
  Briefcase, 
  Building2, 
  CheckSquare, 
  Code2, 
  Compass, 
  FileCode, 
  FolderGit2, 
  GraduationCap, 
  LayoutDashboard, 
  Award, 
  Users, 
  Zap, 
  Search,
  MessageSquare,
  BarChart3,
  Bell,
  UserCheck,
  Settings,
  Bot,
  Calendar,
  Sparkles,
  Brain,
  Rocket
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, activeTab, onTabChange }) => {
  const getNavItems = () => {
    switch (currentRole) {
      case 'STUDENT':
        return [
          { id: 'dashboard', label: '🏠 Dashboard Overview', icon: LayoutDashboard },
          { id: 'projects', label: '🚀 My & Discover Projects', icon: Rocket },
          { id: 'contributions', label: '💻 Contributions Feed', icon: Code2 },
          { id: 'skills', label: '🧠 Evidence Skills', icon: Brain },
          { id: 'achievements', label: '🏆 Achievements & Badges', icon: Award },
          { id: 'recommendations', label: '🤖 AI Recommendations', icon: Bot },
          { id: 'events', label: '📅 Hackathons & Events', icon: Calendar },
          { id: 'notifications', label: '🔔 Notifications Inbox', icon: Bell },
          { id: 'super_profile', label: '👤 My Super Profile', icon: UserCheck },
          { id: 'settings', label: '⚙️ Account Settings', icon: Settings }
        ];
      case 'COLLEGE_ADMIN':
        return [
          { id: 'dashboard', label: 'College Admin Overview', icon: GraduationCap },
          { id: 'verification', label: 'Student Verification Queue', icon: CheckSquare },
          { id: 'departments', label: 'Department Analytics', icon: Building2 },
          { id: 'projects', label: 'College Project Registry', icon: FolderGit2 },
          { id: 'analytics', label: 'Placement Evidence Reports', icon: BarChart3 }
        ];
      case 'MENTOR':
        return [
          { id: 'dashboard', label: 'Mentor Dashboard', icon: Users },
          { id: 'sessions', label: 'Mentorship Sessions', icon: MessageSquare },
          { id: 'reviews', label: 'Code Review Requests', icon: FileCode },
          { id: 'projects', label: 'Guided Projects', icon: FolderGit2 }
        ];
      case 'IT_COMPANY':
        return [
          { id: 'dashboard', label: 'Technical Talent Discovery', icon: Search },
          { id: 'shortlist', label: 'Candidate Shortlists', icon: CheckSquare },
          { id: 'outreach', label: 'Direct Outreach Inbox', icon: MessageSquare },
          { id: 'projects', label: 'Browse Technical Repos', icon: FolderGit2 }
        ];
      case 'NON_IT_COMPANY':
        return [
          { id: 'dashboard', label: 'Industry Talent Discovery', icon: Compass },
          { id: 'domain_projects', label: 'Domain & Operations Repos', icon: Briefcase },
          { id: 'shortlist', label: 'Candidate Shortlists', icon: CheckSquare },
          { id: 'outreach', label: 'Direct Consultation Inbox', icon: MessageSquare }
        ];
    }
  };

  const items = getNavItems();

  return (
    <aside style={{
      width: '280px',
      flexShrink: 0,
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-gold)',
      minHeight: 'calc(100vh - 68px)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--gold-dark)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '6px 12px 12px 12px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '12px'
      }}>
        Next.js Portal Menu
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: isActive ? '1px solid var(--border-gold)' : '1px solid transparent',
              background: isActive ? 'var(--gold-bg)' : 'transparent',
              color: isActive ? 'var(--gold-dark)' : 'var(--text-soft)',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon size={18} color={isActive ? 'var(--gold-primary)' : 'var(--text-muted)'} />
            <span>{item.label}</span>
          </button>
        );
      })}

      <div style={{
        marginTop: 'auto',
        padding: '16px',
        background: 'var(--gold-bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--gold-border)',
        fontSize: '12px',
        color: 'var(--gold-dark)'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} color="var(--gold-primary)" />
          NO JOB PORTAL Model
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-soft)', lineHeight: '1.4' }}>
          Contribution-driven talent ecosystem. Opportunities are created by demonstrated work.
        </p>
      </div>
    </aside>
  );
};
