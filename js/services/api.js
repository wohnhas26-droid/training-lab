import { resolveApiBase } from '../config/appConfig.js';

const API_BASE = resolveApiBase();
const TOKEN_KEY = 'training_lab_token';

let apiAvailable = null;

export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    apiAvailable = res.ok;
    return apiAvailable;
  } catch {
    apiAvailable = false;
    return false;
  }
}

export function isApiMode() {
  return apiAvailable === true;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    throw new Error('Session expired');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request('/health'),

  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  getTodayTraining: () => request('/training/today'),
  getPlan: () => request('/training/plan'),
  regeneratePlan: () => request('/training/plan/regenerate', { method: 'POST' }),
  completeSession: (body) => request('/training/session/complete', { method: 'POST', body: JSON.stringify(body) }),
  updateProfile: (body) => request('/training/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getEvaluation: () => request('/training/evaluation'),

  getProgressSummary: () => request('/progress/summary'),
  unlockAchievement: (id) => request(`/progress/achievements/${id}`, { method: 'POST' }),

  getChallenges: () => request('/challenges'),
  joinChallenge: (id) => request(`/challenges/${id}/join`, { method: 'POST' }),
  logChallengeProgress: (id, increment = 1) => request(`/challenges/${id}/progress`, { method: 'POST', body: JSON.stringify({ increment }) }),

  getCoachTeam: () => request('/coach/team'),
  addTeamPlayer: (email) => request('/coach/team/players', { method: 'POST', body: JSON.stringify({ email }) }),
  removeTeamPlayer: (userId) => request(`/coach/team/players/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  createAssignment: (body) => request('/coach/assignments', { method: 'POST', body: JSON.stringify(body) }),
  getAssignments: () => request('/coach/assignments'),
  submitFeedback: (body) => request('/coach/feedback', { method: 'POST', body: JSON.stringify(body) }),
  getCoachVideos: () => request('/coach/videos'),

  getStripeConfig: () => request('/subscriptions/config'),
  getSubscriptionStatus: () => request('/subscriptions/status'),
  createCheckout: (plan) => request('/subscriptions/checkout', { method: 'POST', body: JSON.stringify({ plan }) }),
  createPortal: () => request('/subscriptions/portal', { method: 'POST' }),
  verifyCheckout: (sessionId) => request(`/subscriptions/verify?session_id=${encodeURIComponent(sessionId)}`),

  getParentReport: (childId) => request(`/catalog/parent/${childId}`),
  getParentReports: (childId) => request(`/catalog/parent/${childId}/reports`),

  getExercises: () => request('/catalog/exercises'),
  getCategories: () => request('/catalog/categories'),

  getMyVideos: () => request('/videos'),
  submitVideo: (body) => request('/videos', { method: 'POST', body: JSON.stringify(body) }),
};

export async function initApi() {
  const available = await checkApiHealth();
  if (available) {
    const token = getToken();
    if (token) {
      try {
        return await api.me();
      } catch {
        setToken(null);
      }
    }
  }
  return null;
}
