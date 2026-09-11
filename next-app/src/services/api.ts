export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

export function getWebSocketBaseUrl(): string {
  const restOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  const wsProto = restOrigin.startsWith('https') ? 'wss' : 'ws';
  return `${wsProto}://${restOrigin.replace(/^https?:\/\//, '')}`;
}

const TOKEN_STORAGE_KEY = 'poos_access_token';
const USER_ID_STORAGE_KEY = 'poos_current_user_id';
let authToken: string | null = null;

export function setAuthToken(token: string | null, userId?: number | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    if (userId) {
      window.localStorage.setItem(USER_ID_STORAGE_KEY, String(userId));
    }
  }
}

export function clearAuthSession() {
  authToken = null;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_ID_STORAGE_KEY);
  }
}

export function getAuthToken(): string | null {
  if (!authToken && typeof window !== 'undefined') {
    authToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return authToken;
}

export function getCurrentUserId(): number | null {
  const token = getAuthToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const id = Number(payload.sub);
      if (Number.isFinite(id) && id > 0) return id;
    } catch {
      /* fall through to stored user id */
    }
  }
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  const id = stored ? Number(stored) : null;
  return id && Number.isFinite(id) ? id : null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function safeFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new ApiError(`API request failed for ${url} with status ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  // OAuth-Only Auth & Sessions
  me: async () => {
    return safeFetch(`${API_BASE_URL}/auth/me`);
  },

  logout: async () => {
    try {
      return await safeFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } finally {
      clearAuthSession();
    }
  },

  completeProfile: async (data: any) => {
    return safeFetch(`${API_BASE_URL}/auth/complete-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Profiles & Verifications
  getStudentProfile: async (userId: number) => {
    return safeFetch(`${API_BASE_URL}/profiles/student/${userId}`);
  },

  getPendingStudents: async () => {
    return safeFetch<any[]>(`${API_BASE_URL}/profiles/college/pending-students`);
  },

  getStudents: async () => {
    return safeFetch<any[]>(`${API_BASE_URL}/profiles/students`);
  },

  getCollegeStudentsOverview: async () => {
    return safeFetch<any>(`${API_BASE_URL}/profiles/college/students/overview`);
  },

  verifyStudent: async (studentId: number) => {
    return safeFetch(`${API_BASE_URL}/profiles/college/verify-student/${studentId}`, {
      method: 'POST'
    });
  },

  rejectStudent: async (studentId: number) => {
    return safeFetch(`${API_BASE_URL}/profiles/college/reject-student/${studentId}`, {
      method: 'POST'
    });
  },

  requestVerification: async () => {
    return safeFetch(`${API_BASE_URL}/profiles/student/request-verification`, {
      method: 'POST'
    });
  },

getCollegeProfile: async (userId: number) => {
    return safeFetch(`${API_BASE_URL}/profiles/college/${userId}`);
  },

  getMentorProfile: async (userId: number) => {
    return safeFetch(`${API_BASE_URL}/profiles/mentor/${userId}`);
  },

  getCompanyProfile: async (userId: number) => {
    return safeFetch(`${API_BASE_URL}/profiles/company/${userId}`);
  },

  // Mentor Sessions
  bookMentorSession: async (data: any) => {
    return safeFetch(`${API_BASE_URL}/mentor/sessions/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  getMentorSessions: async (role?: string) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    const qs = params.toString();
    return safeFetch<any[]>(`${API_BASE_URL}/mentor/sessions${qs ? `?${qs}` : ''}`);
  },

  updateMentorSessionStatus: async (sessionId: number, status: string) => {
    return safeFetch(`${API_BASE_URL}/mentor/sessions/${sessionId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  // Projects
  getProjects: async (type?: string) => {
    const url = type ? `${API_BASE_URL}/projects?project_type=${type}` : `${API_BASE_URL}/projects`;
    return safeFetch<any[]>(url);
  },

  getProjectDetails: async (id: number) => {
    return safeFetch(`${API_BASE_URL}/projects/${id}`);
  },

  createProject: async (data: any) => {
    return safeFetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  getCollegeProjectsOverview: async () => {
    return safeFetch<any>(`${API_BASE_URL}/projects/college/overview`);
  },

  createCollegeProject: async (data: any) => {
    return safeFetch(`${API_BASE_URL}/projects/college`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  joinProject: async (projectId: number) => {
    return safeFetch(`${API_BASE_URL}/projects/${projectId}/join`, { method: 'POST' });
  },

  approveProjectMember: async (projectId: number, memberId: number) => {
    return safeFetch(`${API_BASE_URL}/projects/${projectId}/members/${memberId}/approve`, { method: 'POST' });
  },

  rejectProjectMember: async (projectId: number, memberId: number) => {
    return safeFetch(`${API_BASE_URL}/projects/${projectId}/members/${memberId}/reject`, { method: 'POST' });
  },

  updateProject: async (projectId: number, data: any) => {
    return safeFetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  getProjectTasks: async (projectId: number) => {
    return safeFetch<any[]>(`${API_BASE_URL}/projects/${projectId}/tasks`);
  },

  createProjectTask: async (projectId: number, data: any) => {
    return safeFetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  getProjectIssues: async (projectId: number) => {
    return safeFetch<any[]>(`${API_BASE_URL}/projects/${projectId}/issues`);
  },

  createProjectIssue: async (projectId: number, data: any) => {
    return safeFetch(`${API_BASE_URL}/projects/${projectId}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  getProjectContributions: async (projectId: number) => {
    return safeFetch<any[]>(`${API_BASE_URL}/projects/${projectId}/contributions`);
  },

  logContribution: async (projectId: number, data: any) => {
    return safeFetch(`${API_BASE_URL}/projects/${projectId}/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Talent Discovery
  searchITTalent: async () => {
    return safeFetch<any[]>(`${API_BASE_URL}/talent/it-search`);
  },

  searchNonITTalent: async () => {
    return safeFetch<any[]>(`${API_BASE_URL}/talent/non-it-search`);
  },

  shortlistCandidate: async (studentId: number, category: string, notes: string) => {
    return safeFetch(`${API_BASE_URL}/talent/shortlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, category, notes })
    });
  },

  sendContactRequest: async (studentId: number, opportunityType: string, message: string) => {
    return safeFetch(`${API_BASE_URL}/talent/contact-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, opportunity_type: opportunityType, message })
    });
  },

  searchTalentWithJD: async (data: { job_description?: string; skills?: string; domain_expertise?: string; college?: string; company_type?: string }) => {
    return safeFetch(`${API_BASE_URL}/talent/search-jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Recognition & Events
  getStudentLeaderboard: async () => {
    return safeFetch<any[]>(`${API_BASE_URL}/recognition/leaderboards/students`);
  },

  getCollegeLeaderboard: async () => {
    return safeFetch<any[]>(`${API_BASE_URL}/recognition/leaderboards/colleges`);
  },

  getCertificates: async (recipientId: number) => {
    return safeFetch<any[]>(`${API_BASE_URL}/recognition/certificates?recipient_id=${recipientId}`);
  },

  getEvents: async () => {
    return safeFetch<any[]>(`${API_BASE_URL}/events`);
  },

  getCollegeEventsOverview: async () => {
    return safeFetch<any>(`${API_BASE_URL}/events/college/overview`);
  },

  createEvent: async (data: any) => {
    return safeFetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  registerForEvent: async (eventId: number) => {
    return safeFetch(`${API_BASE_URL}/events/${eventId}/register`, { method: 'POST' });
  },

  cancelEventRegistration: async (eventId: number) => {
    return safeFetch(`${API_BASE_URL}/events/${eventId}/register`, { method: 'DELETE' });
  },

  updateEvent: async (eventId: number, data: any) => {
    return safeFetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // GitHub & Google OAuth (OAuth-only login)
  getGitHubAuthUrl: async (role?: string) => {
    const qs = role ? `?role=${encodeURIComponent(role)}` : '';
    return safeFetch(`${API_BASE_URL}/auth/github/url${qs}`);
  },

  getGitHubCallback: async (code: string, state?: string | null) => {
    const params = new URLSearchParams({ code });
    if (state) params.set('state', state);
    return safeFetch(`${API_BASE_URL}/auth/github/callback?${params.toString()}`);
  },

  getGitHubStatus: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/status`);
  },

  getGitHubProfile: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/profile`);
  },

  getGitHubRepositories: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/repositories`);
  },

  getGitHubLanguages: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/languages`);
  },

  getGitHubContributions: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/contributions`);
  },

  getGitHubStatistics: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/statistics`);
  },

  getGitHubActivity: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/activity`);
  },

  postGitHubSync: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/sync`, { method: 'POST' });
  },

  deleteGitHubConnection: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/connection`, { method: 'DELETE' });
  },

  deleteGitHubDisconnect: async () => {
    return safeFetch<any>(`${API_BASE_URL}/github/disconnect`, { method: 'DELETE' });
  },

  getGoogleAuthUrl: async (role?: string) => {
    const qs = role ? `?role=${encodeURIComponent(role)}` : '';
    return safeFetch(`${API_BASE_URL}/auth/google/url${qs}`);
  },

  getGoogleCallback: async (code: string, state?: string | null) => {
    const params = new URLSearchParams({ code });
    if (state) params.set('state', state);
    return safeFetch(`${API_BASE_URL}/auth/google/callback?${params.toString()}`);
  },

  // AI Intelligence Engine Methods
  matchCandidateWithAI: async (requirements: string) => {
    return safeFetch(`${API_BASE_URL}/ai/match-candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirements })
    });
  },

  summarizePRWithAI: async (prTitle: string, prNumber: number) => {
    return safeFetch(`${API_BASE_URL}/ai/summarize-pr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pr_title: prTitle, pr_number: prNumber })
    });
  },

  askAIAssistant: async (projectId: number, question: string) => {
    return safeFetch(`${API_BASE_URL}/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, question })
    });
  },

  // Notifications & Messages
  getNotifications: async () => {
    return safeFetch<any[]>(`${API_BASE_URL}/notifications`);
  },

  markNotificationsRead: async () => {
    return safeFetch(`${API_BASE_URL}/notifications/mark-read`, { method: 'POST' });
  },

  getMessageThread: async (otherUserId: number) => {
    return safeFetch<any[]>(`${API_BASE_URL}/messages/thread/${otherUserId}`);
  },

  sendMessage: async (data: any) => {
    return safeFetch(`${API_BASE_URL}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
},
};



