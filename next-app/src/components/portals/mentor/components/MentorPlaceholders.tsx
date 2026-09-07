import React from 'react';

export const PlaceholderComponent: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{description}</p>
    </div>
    <div className="gold-card">
      <div className="gold-card-body" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        This module is currently using a placeholder component.
      </div>
    </div>
  </div>
);

export const MentorMentorship = () => <PlaceholderComponent title="Mentorship Sessions" description="Manage 1-on-1 sessions, Q&A, and technical reviews" />;
export const MentorEvents = () => <PlaceholderComponent title="Events & Hackathons" description="Create and organize ecosystem workshops and hackathons" />;
export const MentorTeams = () => <PlaceholderComponent title="Teams" description="Manage project teams, roles, and collaboration" />;
export const MentorContributions = () => <PlaceholderComponent title="Contributions" description="Track PRs, commits, issues, and code reviews" />;
export const MentorCertificates = () => <PlaceholderComponent title="Certificates & Achievements" description="Issue and verify digital credentials" />;
export const MentorDiscover = () => <PlaceholderComponent title="Discover" description="Find top talent, projects, and ecosystem events" />;
export const MentorAnalytics = () => <PlaceholderComponent title="Analytics" description="Insights into team velocity, mentee growth, and event reach" />;
export const MentorSettings = () => <PlaceholderComponent title="Settings" description="Manage your professional account preferences" />;
export const MentorSuperProfile = () => <PlaceholderComponent title="My Super Profile" description="Your professional ecosystem identity" />;
