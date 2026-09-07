import React from 'react';
import { collegeMockData } from '@/data/collegeMockData';

export const PlaceholderComponent: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{description}</p>
    </div>
    <div className="gold-card">
      <div className="gold-card-body" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        This module is currently using a placeholder component. Mock data mapping to come.
      </div>
    </div>
  </div>
);

export const CollegeHackathons = () => <PlaceholderComponent title="Hackathons" description="Manage college and ecosystem hackathons" />;
export const CollegeMentors = () => <PlaceholderComponent title="Mentorship" description="Assign mentors to projects and track sessions" />;
export const CollegeInternships = () => <PlaceholderComponent title="Internships" description="Manage internal and external internships" />;
export const CollegePlacements = () => <PlaceholderComponent title="Placement Evidence" description="Track verified placements and industry connections" />;
export const CollegeCertificates = () => <PlaceholderComponent title="Certificates" description="Issue and verify digital credentials" />;
export const CollegeAnalytics = () => <PlaceholderComponent title="College Analytics" description="Deep dive into participation metrics" />;
export const CollegeDepartments = () => <PlaceholderComponent title="Departments" description="Department-wise activity tracking" />;
