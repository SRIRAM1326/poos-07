export const collegeMockData = {
  overview: {
    totalStudents: 1250,
    activeStudents: 840,
    totalProjects: 45,
    activeProjects: 32,
    studentContributions: 12500,
    projectsCreated: 15,
    projectsJoined: 30,
    facultyMentors: 42,
    certificatesIssued: 3200,
    communityActivityScore: 92,
  },
  students: [
    { id: 1, name: 'Aarav Sharma', department: 'Computer Science', rollNo: '21CS1084', skills: ['Python', 'Rust', 'FastAPI'], status: 'Verified', contributions: 128 },
    { id: 2, name: 'Priya Patel', department: 'Information Technology', rollNo: '21IT2055', skills: ['React', 'Next.js', 'UI/UX'], status: 'Pending Verification', contributions: 45 },
    { id: 3, name: 'Rahul Verma', department: 'Electronics', rollNo: '21EC3012', skills: ['C++', 'IoT', 'Arduino'], status: 'Verified', contributions: 89 },
    { id: 4, name: 'Sneha Gupta', department: 'Computer Science', rollNo: '21CS1092', skills: ['Machine Learning', 'Python'], status: 'Verified', contributions: 210 },
    { id: 5, name: 'Vikram Singh', department: 'Mechanical', rollNo: '21ME4001', skills: ['AutoCAD', 'Robotics'], status: 'Verified', contributions: 12 },
  ],
  departments: [
    { id: 1, name: 'Computer Science & Engineering', students: 450, activeProjects: 22, performanceScore: 95 },
    { id: 2, name: 'Information Technology', students: 320, activeProjects: 15, performanceScore: 88 },
    { id: 3, name: 'Electronics & Communication', students: 280, activeProjects: 8, performanceScore: 82 },
    { id: 4, name: 'Mechanical Engineering', students: 200, activeProjects: 0, performanceScore: 65 },
  ],
  projects: [
    { id: 101, title: 'AI Trading Dashboard', type: 'College Created', skills: ['Python', 'React', 'WebSockets'], scope: 'Open to Entire PoOS', participants: 42, status: 'Active', commits: 156 },
    { id: 102, title: 'Smart Campus IoT', type: 'Student Initiative', skills: ['C++', 'IoT', 'MQTT'], scope: 'College Only', participants: 18, status: 'Active', commits: 89 },
    { id: 103, title: 'Decentralized Voting', type: 'College Created', skills: ['Solidity', 'Next.js'], scope: 'Selected Colleges', participants: 5, status: 'Completed', commits: 34 },
  ],
  events: [
    { id: 201, title: 'AI/ML Workshop Series', type: 'Workshop', date: 'Oct 10, 2026', scope: 'College Only', registered: 120, status: 'Upcoming' },
    { id: 202, title: 'Web3 Builder Meetup', type: 'Meetup', date: 'Sep 15, 2026', scope: 'Open to Entire PoOS', registered: 85, status: 'Completed' },
    { id: 203, title: 'Cloud Computing 101', type: 'Technical Session', date: 'Oct 25, 2026', scope: 'Selected Colleges', registered: 200, status: 'Upcoming' },
  ],
  hackathons: [
    { id: 301, title: 'National CodeFest 2026', date: 'Nov 01, 2026', scope: 'Open to Entire PoOS', participants: 450, prizePool: '$5,000', status: 'Upcoming' },
    { id: 302, title: 'Campus Build-a-thon', date: 'Aug 20, 2026', scope: 'College Only', participants: 150, prizePool: 'Gadgets', status: 'Completed' },
  ],
  mentors: [
    { id: 401, name: 'Dr. Rajesh Kumar', department: 'Computer Science', expertise: ['AI', 'Deep Learning'], assignedProjects: 3, mentoredStudents: 15 },
    { id: 402, name: 'Prof. Anita Desai', department: 'Information Technology', expertise: ['Cloud Computing', 'System Design'], assignedProjects: 2, mentoredStudents: 8 },
  ],
  placements: [
    { id: 601, studentName: 'Aarav Sharma', company: 'Google', role: 'Software Engineer', evidence: 'Verified GitHub Commits in PoOS Engine', status: 'Offered' },
    { id: 602, studentName: 'Sneha Gupta', company: 'Microsoft', role: 'Data Scientist', evidence: 'Top 10 in National CodeFest', status: 'Offered' },
  ],
  analytics: {
    monthlyActivity: [
      { month: 'Jan', commits: 400, prs: 50 },
      { month: 'Feb', commits: 550, prs: 70 },
      { month: 'Mar', commits: 800, prs: 120 },
      { month: 'Apr', commits: 1200, prs: 180 },
    ],
    topContributors: [
      { name: 'Aarav Sharma', score: 980 },
      { name: 'Sneha Gupta', score: 850 },
      { name: 'Rahul Verma', score: 720 },
    ]
  },
  certificates: [
    { id: 701, type: 'Event Participation', name: 'Web3 Builder Meetup', issuedCount: 85, date: 'Sep 15, 2026' },
    { id: 702, type: 'Project Completion', name: 'Decentralized Voting', issuedCount: 5, date: 'Aug 01, 2026' },
  ]
};
