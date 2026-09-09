export type UserRole = 'STUDENT' | 'COLLEGE_ADMIN' | 'MENTOR' | 'IT_COMPANY' | 'NON_IT_COMPANY';

export interface User {
  id: number;
  email?: string;
  username?: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  oauth_provider?: string;
  profile_completed?: boolean;
}

export interface EvidenceSkill {
  name: string;
  level: string; // e.g. Expert, Advanced, Intermediate
  category: 'Technical' | 'Business/Domain' | 'Tools';
  verified: boolean;
  evidence_project?: string;
  evidence_link?: string;
  evidence_summary?: string;
}

export interface ActivityTimelineItem {
  id: number;
  type: 'COMMIT' | 'PULL_REQUEST' | 'PR_MERGED' | 'ISSUE_SOLVED' | 'CODE_REVIEW' | 'TASK_COMPLETED';
  title: string;
  project_name: string;
  details?: string;
  timestamp: string; // e.g. "Today", "Yesterday", "2 days ago"
  lines_added?: number;
  lines_deleted?: number;
}

export interface RecommendedProjectItem {
  id: number;
  title: string;
  description: string;
  match_percentage: number;
  domain: string;
  required_skills: string[];
  owner_name: string;
  stars_count: number;
}

export interface RecommendedMentorItem {
  id: number;
  name: string;
  title: string;
  company: string;
  match_percentage: number;
  domain: string;
  skills: string[];
  experience_years: number;
  hourly_rate: number;
  rating: number;
  avatar_url?: string;
}

export interface NotificationItem {
  id: number;
  category: 'INVITATION' | 'APPROVAL' | 'PR_MERGED' | 'MENTOR_REQUEST' | 'COMPANY_CONTACT' | 'BADGE_EARNED' | 'EVENT';
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}

export interface SuperProfileAnalytics {
  profile_views_month: number;
  project_views_month: number;
  company_views_month: number;
  mentor_connections: number;
  profile_strength_pct: number;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  roll_number?: string;
  college_name: string;
  department: string;
  course?: string;
  year_of_study: string;
  academic_year?: string;
  location?: string;
  headline?: string;
  bio?: string;
  github_handle?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  personal_website_url?: string;
  reputation_score: number;
  verified_by_college: boolean;

  // Overview KPI Stats
  profile_completion_pct: number;
  contribution_score: number;
  active_projects_count: number;
  total_commits: number;
  total_prs: number;
  merged_prs: number;
  issues_solved: number;
  code_reviews: number;
  tasks_completed: number;
  streak_days: number;

  // Rankings Cards
  college_rank: number;
  college_total_students: number;
  global_rank: number;
  global_total_devs: number;
  dept_rank: number;
  dept_total_students: number;

  // Evidence-backed Skills
  skills_json: EvidenceSkill[];

  // Timeline / Recent Contributions
  activity_timeline?: ActivityTimelineItem[];

  // Achievements & Recognition
  badges?: { id: number; title: string; category: string; icon?: string }[];
  certificates_count?: number;

  // AI Recommendations
  recommended_projects?: RecommendedProjectItem[];
  recommended_mentors?: RecommendedMentorItem[];

  // Notifications
  notifications?: NotificationItem[];

  // Analytics
  analytics?: SuperProfileAnalytics;
}

export interface CollegeProjectItem {
  id: number;
  title: string;
  tagline: string;
  description?: string;
  project_type: string;
  scope: string;
  status: string;
  stars_count: number;
  contributors_count: number;
  tech_stack_json: string[];
}

export interface CollegeEventItem {
  id: number;
  title: string;
  description: string;
  event_type: 'HACKATHON' | 'COMPETITION' | 'WORKSHOP' | 'CHALLENGE';
  scope: 'COLLEGE_ONLY' | 'PUBLIC' | 'INVITE_ONLY';
  event_date: string;
  registrations_count: number;
  max_seats: number;
  status: string;
  location: string;
  organizer_name?: string;
}

export interface DepartmentDetail {
  name: string;
  code: string;
  students: number;
  verified: number;
  active_developers: number;
  projects: number;
  contribution_score: number;
}

export interface CollegeStudentRanking {
  rank: number;
  student_id: number;
  full_name: string;
  roll_number: string;
  department: string;
  reputation_score: number;
  merged_prs: number;
  avatar_url?: string;
}

export interface CollegeProfile {
  id: number;
  user_id: number;
  college_name: string;
  college_code: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
  is_verified: boolean;
  
  // KPI Metrics
  student_count: number;
  verified_students_count: number;
  active_students_count: number;
  active_developers_count: number;
  active_projects_count: number;
  certificates_issued_count: number;
  events_count: number;
  college_rank: number;
  college_total_rank: number;

  total_contributions: {
    commits: number;
    prs: number;
    merged_prs: number;
    issues_solved: number;
  };

  // Workspaces
  departments_json: DepartmentDetail[];
  college_projects?: CollegeProjectItem[];
  college_events?: CollegeEventItem[];
  student_rankings?: CollegeStudentRanking[];
  notifications?: NotificationItem[];
  recent_activity?: ActivityTimelineItem[];
}

export interface MentorProfile {
  id: number;
  user_id: number;
  title: string;
  company: string;
  experience_years: number;
  domain_expertise: string;
  hourly_rate: number;
  bio?: string;
  rating: number;
  total_sessions: number;
  skills_json: string[];
  linkedin_url?: string;
  portfolio_url?: string;
}

export interface CompanyProfile {
  id: number;
  user_id: number;
  company_name: string;
  company_type: 'IT' | 'NON_IT';
  industry: string;
  company_size: string;
  location: string;
  website?: string;
  website_url?: string;
  linkedin_url?: string;
  description?: string;
  tech_stack_json: string[];
  domains_json: string[];
}

export interface Project {
  id: number;
  title: string;
  tagline?: string;
  description?: string;
  project_type: 'OPEN_SOURCE' | 'COLLEGE_PROJECT' | 'INDUSTRY_PROJECT' | 'PROPRIETARY';
  owner_id?: number;
  owner_name?: string;
  college_name?: string;
  company_name?: string;
  repo_url?: string;
  rights_tag: string;
  status: string;
  stars_count: number;
  forks_count: number;
  tech_stack_json: string[];
  created_at: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'CODE_REVIEW' | 'DONE';
  priority: string;
  assignee_name?: string;
  created_at: string;
}

export interface ProjectIssue {
  id: number;
  project_id: number;
  title: string;
  body?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  label: 'BUG' | 'FEATURE' | 'DOCUMENTATION' | 'GOOD_FIRST_ISSUE';
  author_name: string;
  assignee_name?: string;
  created_at: string;
}

export interface Contribution {
  id: number;
  project_id: number;
  contributor_id: number;
  contributor_name: string;
  commit_hash: string;
  commit_message: string;
  pr_number?: number;
  pr_title?: string;
  status: string;
  lines_added: number;
  lines_deleted: number;
  created_at: string;
}

export interface Certificate {
  id: number;
  cert_hash: string;
  recipient_name: string;
  issuer_name: string;
  title: string;
  description?: string;
  issue_date: string;
  verification_url?: string;
}

export interface EventItem {
  id: number;
  title: string;
  organizer_name: string;
  event_type: string;
  description?: string;
  location: string;
  event_date: string;
  participant_count: number;
}

// ----------------------------- GitHub Integration -----------------------------

export interface GitHubProfile {
  id: number;
  github_id: number;
  login: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  html_url?: string;
  company?: string;
  location?: string;
  blog?: string;
  followers: number;
  following: number;
  public_repos: number;
  account_created_at?: string;
  last_sync_at?: string;
  last_sync_error?: string;
}

export interface GitHubLanguageStat {
  name: string;
  bytes: number;
  percentage: number;
}

export interface GitHubRepositoryItem {
  github_repo_id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url?: string;
  default_branch?: string;
  visibility?: string;
  owner_login?: string;
  primary_language?: string;
  size: number;
  open_issues_count: number;
  license_name?: string;
  archived: boolean;
  languages: Record<string, number>;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  is_fork: boolean;
  created_at?: string;
  updated_at?: string;
  pushed_at?: string;
  statistics: Record<string, any>;
}

export interface GitHubContributionsSummary {
  contribution_score: number;
  score_weights: Record<string, number>;
  active_projects: number;
  total_commits: number;
  total_prs: number;
  merged_prs: number;
  open_prs: number;
  closed_prs: number;
  issues_solved: number;
  open_issues: number;
  code_reviews: number;
  reviews_approved: number;
  reviews_changes_requested: number;
  additions: number;
  deletions: number;
  total_repos: number;
  last_sync_at?: string;
}

export interface GitHubActivityItem {
  id: string;
  type: string;
  repo_name?: string;
  repo_url?: string;
  action?: string;
  created_at?: string;
}
