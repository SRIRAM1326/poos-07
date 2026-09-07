export const mentorMockData = {
  overview: {
    activeProjects: 4,
    mentees: 12,
    upcomingSessions: 3,
    contributions: 156,
    codeReviews: 24,
    eventRole: 'Hackathon Judge'
  },
  projects: [
    { id: 101, title: 'AI Trading Dashboard', role: 'Project Owner', teamSize: 5, status: 'Active', prsToReview: 4, type: 'Open Source' },
    { id: 102, title: 'Decentralized Identity', role: 'Technical Reviewer', teamSize: 8, status: 'Active', prsToReview: 1, type: 'College Initiative' },
    { id: 103, title: 'Rust Vector Engine', role: 'Contributor', teamSize: 3, status: 'Completed', prsToReview: 0, type: 'Ecosystem' }
  ],
  students: [
    { id: 1, name: 'Aarav Sharma', college: 'IIT Madras', focus: 'Backend Systems', progress: 85, nextSession: 'Tomorrow, 4PM' },
    { id: 2, name: 'Priya Patel', college: 'NIT Trichy', focus: 'Frontend UI/UX', progress: 60, nextSession: 'Sep 10, 2PM' }
  ],
  mentorship: {
    sessions: [
      { id: 1, student: 'Aarav Sharma', topic: 'System Design Interview Prep', date: 'Tomorrow, 4PM', status: 'Scheduled' },
      { id: 2, student: 'Team Alpha', topic: 'Architecture Code Review', date: 'Sep 12, 10AM', status: 'Scheduled' }
    ],
    requests: [
      { id: 3, student: 'Sneha Gupta', topic: 'Machine Learning Guidance', status: 'Pending Approval' }
    ]
  },
  events: [
    { id: 201, title: 'National CodeFest 2026', role: 'Lead Organizer & Judge', date: 'Nov 01, 2026', participants: 450, scope: 'Entire PoOS Ecosystem' },
    { id: 202, title: 'FastAPI Masterclass', role: 'Speaker', date: 'Sep 25, 2026', participants: 120, scope: 'Selected Colleges' }
  ]
};
