import * as local from './storage.js';
import { api, isApiMode, getToken, setToken, initApi, checkApiHealth } from './api.js';

let cachedState = null;

export async function bootstrap() {
  await checkApiHealth();
  if (isApiMode() && getToken()) {
    try {
      cachedState = await api.me();
      syncToLocalStorage(cachedState);
    } catch {
      setToken(null);
    }
  }
  return isApiMode();
}

function syncToLocalStorage(state) {
  if (!state) return;
  local.saveState({
    user: state.user,
    profile: state.profile,
    subscription: state.subscription,
    subscriptionDetails: state.subscriptionDetails || null,
    progress: state.progress,
    completedSessions: state.completedSessions,
    completedExercises: state.completedExercises,
    achievements: state.achievements,
    activeChallenges: state.activeChallenges,
    challengeProgress: state.challengeProgress,
    weeklyPlan: state.weeklyPlan,
    coachFeedback: state.coachFeedback || [],
  });
}

export function loadState() {
  if (cachedState) return cachedState;
  return local.loadState();
}

export function saveState(state) {
  cachedState = state;
  local.saveState(state);
}

export async function register(formData) {
  if (isApiMode()) {
    const result = await api.register({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      role: formData.role || 'player',
      plan: formData.plan || 'player',
      profile: formData.role === 'player' ? {
        age: parseInt(formData.age) || 14,
        position: formData.position || 'midfielder',
        skillLevel: formData.skillLevel || 'intermediate',
        goals: formData.goals || [],
        improvementAreas: formData.improvementAreas || [],
        trainingDays: parseInt(formData.trainingDays) || 5,
        equipment: formData.equipment || ['ball'],
      } : undefined,
    });
    setToken(result.token);
    cachedState = result.user;
    syncToLocalStorage(result.user);
    return result.user;
  }

  return localRegister(formData);
}

function localRegister(formData) {
  const user = { name: formData.name, email: formData.email, role: formData.role || 'player' };
  local.login(user);
  if (formData.role === 'player') {
    local.saveProfile({
      age: parseInt(formData.age) || 14,
      position: formData.position || 'midfielder',
      skillLevel: formData.skillLevel || 'intermediate',
      goals: formData.goals || [],
      improvementAreas: formData.improvementAreas || [],
      trainingDays: parseInt(formData.trainingDays) || 5,
      equipment: formData.equipment || ['ball'],
    });
  }
  if (formData.plan) local.saveSubscription(formData.plan);
  return local.loadState();
}

export async function loginWithCredentials(email, password) {
  if (isApiMode()) {
    const result = await api.login({ email, password });
    setToken(result.token);
    cachedState = result.user;
    syncToLocalStorage(result.user);
    return result.user;
  }
  throw new Error('API not available — use demo signup instead');
}

export function logout() {
  setToken(null);
  cachedState = null;
  return local.logout();
}

export async function completeSessionRemote(sessionId, exercises, totalXp, minutes) {
  if (isApiMode()) {
    cachedState = await api.completeSession({ sessionId, exercises, totalXp, minutes });
    syncToLocalStorage(cachedState);
    return cachedState;
  }
  return local.completeSession(sessionId, exercises, totalXp, minutes);
}

export async function joinChallengeRemote(challengeId) {
  if (isApiMode()) {
    cachedState = await api.joinChallenge(challengeId);
    syncToLocalStorage(cachedState);
    return cachedState;
  }
  return local.joinChallenge(challengeId);
}

export async function updateChallengeProgressRemote(challengeId, increment = 1) {
  if (isApiMode()) {
    const result = await api.logChallengeProgress(challengeId, increment);
    cachedState = result;
    syncToLocalStorage(result);
    return result;
  }
  const state = local.loadState();
  const progress = (state.challengeProgress[challengeId] || 0) + increment;
  return local.updateChallengeProgress(challengeId, progress);
}

export async function regeneratePlanRemote(profile) {
  if (isApiMode()) {
    const plan = await api.regeneratePlan();
    cachedState = { ...cachedState, weeklyPlan: plan };
    local.saveWeeklyPlan(plan);
    return plan;
  }
  return null;
}

export async function getCoachTeamRemote() {
  if (isApiMode()) {
    try {
      const data = await api.getCoachTeam();
      return data.players?.length ? data.players : null;
    } catch {
      return null;
    }
  }
  return null;
}

const LOCAL_ASSIGNMENTS_KEY = 'coach_assignments';

function loadLocalAssignments() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ASSIGNMENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function getAssignmentsRemote() {
  if (isApiMode()) {
    try {
      return await api.getAssignments();
    } catch {
      return [];
    }
  }
  return loadLocalAssignments();
}

export async function createAssignmentRemote({ title, category, dueDate, notes, assignTo = 'all' }) {
  const payload = { title, category, dueDate, notes, assignTo };
  if (isApiMode()) {
    return api.createAssignment(payload);
  }
  const assignments = loadLocalAssignments();
  const entry = { ...payload, id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
  assignments.unshift(entry);
  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  return entry;
}

export async function submitFeedbackRemote({ playerId, playerName, feedback, rating }) {
  if (isApiMode()) {
    return api.submitFeedback({ playerId, feedback, rating });
  }
  return local.addCoachFeedback({ player: playerName || playerId, feedback, rating });
}

export async function createCheckout(plan) {
  if (isApiMode()) return api.createCheckout(plan);
  return { demo: true, url: '/subscription/success.html?plan=' + plan };
}

export async function openBillingPortal() {
  if (isApiMode()) return api.createPortal();
  throw new Error('Billing portal requires API connection');
}

export async function getSubscriptionStatus() {
  if (isApiMode()) return api.getSubscriptionStatus();
  const state = local.loadState();
  return { plan: state.subscription || 'player', status: 'trialing', stripeConfigured: false };
}

export async function verifyCheckoutSession(sessionId) {
  if (isApiMode()) {
    cachedState = await api.verifyCheckout(sessionId);
    syncToLocalStorage(cachedState);
    return cachedState;
  }
  return null;
}

export async function getStripeConfig() {
  if (isApiMode()) return api.getStripeConfig();
  return { configured: false, publishableKey: null, plans: [] };
}

export { local, isApiMode, initApi, getToken, setToken };
export const getToday = local.getToday;
export const getDayName = local.getDayName;
export const isLoggedIn = local.isLoggedIn;
export const getCurrentUser = local.getCurrentUser;
export const saveProfile = local.saveProfile;
export const saveSubscription = local.saveSubscription;
export const completeExercise = local.completeExercise;
export const unlockAchievement = local.unlockAchievement;
export const saveWeeklyPlan = local.saveWeeklyPlan;
export const addCoachFeedback = local.addCoachFeedback;
export const updateState = local.updateState;
