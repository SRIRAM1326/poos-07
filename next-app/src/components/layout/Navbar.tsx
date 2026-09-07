'use client';

import React from 'react';
import { User } from '@/types';
import { Award, Code, MessageSquare, Search, ShieldCheck, UserCheck, LogOut } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface NavbarProps {
  onOpenCertificates: () => void;
  onOpenLeaderboard: () => void;
  onOpenEvents: () => void;
  onOpenAuth: () => void;
  onOpenMessages: () => void;
  onOpenProfileSetup?: () => void;
  onLogout?: () => void;
  currentUser?: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCertificates,
  onOpenLeaderboard,
  onOpenEvents,
  onOpenAuth,
  onOpenMessages,
  onOpenProfileSetup,
  onLogout,
  currentUser
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '68px',
      background: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-gold)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--gold-bg)',
          border: '1px solid var(--gold-border)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <Code size={20} color="var(--gold-primary)" />
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '16px',
            color: 'var(--text-main)',
            letterSpacing: '-0.02em'
          }}>
            PoOS <span style={{ color: 'var(--gold-dark)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>NEXT.JS 14</span>
          </span>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.2'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
            Project & Open-source Opportunity System
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Next.js App Router · Supabase PostgreSQL
          </span>
        </div>
      </div>

      {/* Global Search */}
      <div style={{
        position: 'relative',
        width: '320px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
        <input
          type="text"
          placeholder="Search projects, skills, contributors..."
          style={{
            width: '100%',
            padding: '8px 12px 8px 36px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-subtle)',
            fontSize: '13px',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-main)',
            transition: 'all 0.2s ease'
          }}
        />
      </div>

      {/* Actions & Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onOpenProfileSetup && (
          <button
            onClick={onOpenProfileSetup}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--gold-border)',
              background: 'linear-gradient(135deg, #fffbe6 0%, #fef08a 100%)',
              color: 'var(--gold-dark)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✨ Complete Profile
          </button>
        )}

        <button
          onClick={onOpenLeaderboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-soft)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <UserCheck size={15} color="var(--gold-primary)" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={onOpenCertificates}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-gold)',
            background: 'var(--gold-bg)',
            color: 'var(--gold-dark)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Award size={15} color="var(--gold-dark)" />
          <span>Certificates</span>
        </button>

        <button
          onClick={onOpenEvents}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-soft)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ShieldCheck size={15} color="var(--green-primary)" />
          <span>Sprint Events</span>
        </button>

        <button
          onClick={onOpenMessages}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-soft)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={15} color="var(--blue-primary)" />
          <span>Messages</span>
        </button>

        <NotificationDropdown />

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onOpenProfileSetup ?? onOpenAuth}
              title="Edit my profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gold-border)',
                background: 'linear-gradient(135deg, var(--gold-primary) 0%, #e5b82e 100%)',
                color: '#0a0f1d',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt=""
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : null}
              <span>{currentUser.full_name}</span>
            </button>
            <button
              onClick={onLogout}
              title="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-soft)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--gold-primary) 0%, #e5b82e 100%)',
              color: '#0a0f1d',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

