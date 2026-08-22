import * as local from './storage.js';
import { api, isApiMode, getToken, setToken, initApi, checkApiHealth } from './api.js';
import { getChallengeById } from '../data/challenges.js';
import { isNativeApp } from '../config/appConfig.js';
import { pendingAchievements, checkAchievements } from './progressTracker.js';

function checkoutClient() {
  return isNativeApp() ? 'native' : 'web';
}

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
    completedChallenges: state.completedChallenges || [],
    challengeProgress: state.challengeProgress,
    weeklyPlan: state.weeklyPlan,
    coachFeedback: state.coachFeedback || [],
    children: state.children || [],
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
      childEmail: formData.childEmail || undefined,
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
  if ((state.completedChallenges || []).includes(challengeId)) return state;
  const challenge = getChallengeById(challengeId);
  const current = state.challengeProgress[challengeId] || 0;
  const next = challenge ? Math.min(challenge.targetCount, current + increment) : current + increment;
  let updated = local.updateChallengeProgress(challengeId, next);
  if (challenge && next >= challenge.targetCount) {
    updated = local.updateState({
      activeChallenges: (updated.activeChallenges || []).filter((id) => id !== challengeId),
      completedChallenges: [...new Set([...(updated.completedChallenges || []), challengeId])],
      progress: {
        ...updated.progress,
        xp: (updated.progress?.xp || 0) + challenge.xpReward,
      },
    });
  }
  return updated;
}

export async function updateProfileRemote(profile) {
  if (isApiMode()) {
    cachedState = await api.updateProfile(profile);
    syncToLocalStorage(cachedState);
    return cachedState;
  }
  local.saveProfile(profile);
  return local.loadState();
}

export async function regeneratePlanRemote() {
  if (isApiMode()) {
    const plan = await api.regeneratePlan();
    cachedState = { ...(cachedState || local.loadState()), weeklyPlan: plan };
    local.saveWeeklyPlan(plan);
    return plan;
  }
  const { generatePersonalizedPlan } = await import('../services/trainingPlanner.js');
  const state = local.loadState();
  const plan = generatePersonalizedPlan(state.profile || {});
  local.saveWeeklyPlan(plan);
  cachedState = { ...state, weeklyPlan: plan };
  return plan;
}

export async function getTodayTrainingRemote() {
  if (isApiMode()) {
    try {
      return await api.getTodayTraining();
    } catch {
      // Fall through to the cached weekly plan.
    }
  }
  const { getTodaySession } = await import('../services/trainingPlanner.js');
  return getTodaySession((cachedState || local.loadState()).weeklyPlan);
}

export async function addTeamPlayerRemote(email) {
  if (!isApiMode()) {
    throw new Error('Adding players requires an internet connection');
  }
  const data = await api.addTeamPlayer(email);
  return data.players || [];
}

export async function removeTeamPlayerRemote(userId) {
  if (!isApiMode()) {
    throw new Error('Removing players requires an internet connection');
  }
  const data = await api.removeTeamPlayer(userId);
  return data.players || [];
}

export function emptyCoachTeamSnapshot() {
  return {
    players: [],
    activity: [],
    stats: { playerCount: 0, activeToday: 0, avgCompletion: 0, topStreak: 0 },
  };
}

export async function getCoachTeamRemote() {
  if (isApiMode()) {
    try {
      const data = await api.getCoachTeam();
      return {
        players: Array.isArray(data.players) ? data.players : [],
        activity: Array.isArray(data.activity) ? data.activity : [],
        stats: data.stats || emptyCoachTeamSnapshot().stats,
      };
    } catch {
      return null;
    }
  }
  return null;
}

export async function checkAchievementsRemote(state) {
  const pending = pendingAchievements(state);
  if (!pending.length) return [];

  if (isApiMode()) {
    let latest = null;
    for (const achievement of pending) {
      latest = await api.unlockAchievement(achievement.id);
    }
    if (latest) {
      cachedState = latest;
      syncToLocalStorage(latest);
    }
    return pending;
  }

  return checkAchievements(state);
}

export async function getProgressSummaryRemote() {
  if (isApiMode()) {
    try {
      return await api.getProgressSummary();
    } catch {
      return null;
    }
  }
  return null;
}

export async function getCoachPlayerRemote(userId) {
  if (!isApiMode()) {
    throw new Error('Player reports require an internet connection');
  }
  return api.getCoachPlayer(userId);
}

const LOCAL_ASSIGNMENTS_KEY = 'coach_assignments';

function loadLocalAssignments() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ASSIGNMENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function decorateLocalAssignment(assignment, userId) {
  const completedBy = assignment.completedBy || [];
  const completed = userId ? completedBy.includes(userId) : completedBy.length > 0;
  return {
    ...assignment,
    notes: assignment.notes || '',
    completedBy,
    completedCount: completedBy.length,
    assigneeCount: assignment.assignTo === 'all' ? 1 : 1,
    completed,
    overdue: false,
    completions: [],
  };
}

export async function getAssignmentsRemote() {
  if (isApiMode()) {
    try {
      return await api.getAssignments();
    } catch {
      return [];
    }
  }
  return loadLocalAssignments().map((a) => decorateLocalAssignment(a));
}

export async function getMyAssignmentsRemote() {
  if (isApiMode()) {
    try {
      return await api.getMyAssignments();
    } catch {
      return [];
    }
  }
  const user = local.getCurrentUser();
  return loadLocalAssignments()
    .filter((a) => a.assignTo === 'all' || String(a.assignTo) === String(user?.id))
    .map((a) => decorateLocalAssignment(a, user?.id));
}

export async function createAssignmentRemote({ title, category, dueDate, notes, assignTo = 'all' }) {
  const payload = { title, category, dueDate, notes, assignTo };
  if (isApiMode()) {
    return api.createAssignment(payload);
  }
  const assignments = loadLocalAssignments();
  const entry = decorateLocalAssignment({
    ...payload,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
    completedBy: [],
  });
  assignments.unshift(entry);
  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  return entry;
}

export async function completeAssignmentRemote(id) {
  if (isApiMode()) {
    return api.completeAssignment(id);
  }
  const user = local.getCurrentUser();
  if (!user?.id) throw new Error('Not signed in');
  const assignments = loadLocalAssignments();
  const idx = assignments.findIndex((a) => String(a.id) === String(id));
  if (idx < 0) throw new Error('Assignment not found');
  const completedBy = [...new Set([...(assignments[idx].completedBy || []), user.id])];
  assignments[idx] = { ...assignments[idx], completedBy };
  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  return decorateLocalAssignment(assignments[idx], user.id);
}

export async function submitFeedbackRemote({ playerId, playerName, feedback, rating, videoId }) {
  if (isApiMode()) {
    return api.submitFeedback({ playerId, feedback, rating, videoId });
  }
  return local.addCoachFeedback({ player: playerName || playerId, feedback, rating });
}

export async function getCoachVideosRemote() {
  if (isApiMode()) {
    try {
      return await api.getCoachVideos();
    } catch {
      return [];
    }
  }
  // Offline coaches have no team submissions. Do not invent teammates.
  return [];
}

export async function addChildRemote(email) {
  if (!isApiMode()) {
    throw new Error('Linking a player requires an internet connection');
  }
  cachedState = await api.addChild(email);
  syncToLocalStorage(cachedState);
  return cachedState;
}

export async function removeChildRemote(userId) {
  if (!isApiMode()) {
    throw new Error('Unlinking a player requires an internet connection');
  }
  cachedState = await api.removeChild(userId);
  syncToLocalStorage(cachedState);
  return cachedState;
}

export async function getChildReportRemote(childId) {
  if (isApiMode() && childId) {
    return api.getParentReport(childId);
  }
  return null;
}

export async function getChildReportsRemote(childId) {
  if (isApiMode() && childId) {
    try {
      return await api.getParentReports(childId);
    } catch {
      return null;
    }
  }
  return null;
}

const LOCAL_VIDEOS_KEY = 'player_video_submissions';

function loadLocalVideos() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_VIDEOS_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function getCatalogRemote() {
  if (isApiMode()) {
    try {
      const [exercises, categories] = await Promise.all([
        api.getExercises(),
        api.getCategories(),
      ]);
      return {
        exercises: Array.isArray(exercises) ? exercises : [],
        categories,
      };
    } catch {
      return null;
    }
  }
  return null;
}

export async function getMyVideosRemote() {
  if (isApiMode()) {
    try {
      return await api.getMyVideos();
    } catch {
      return [];
    }
  }
  return loadLocalVideos();
}

export async function submitVideoRemote({ skill, url }) {
  if (isApiMode()) {
    return api.submitVideo({ skill, url });
  }
  const videos = loadLocalVideos();
  const entry = { id: `local-${Date.now()}`, skill, url: url || null, status: 'pending', createdAt: new Date().toISOString() };
  videos.unshift(entry);
  localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(videos));
  return entry;
}

export async function createCheckout(plan) {
  if (isApiMode()) return api.createCheckout(plan, checkoutClient());
  return { demo: true, url: '/subscription/success.html?plan=' + plan };
}

export async function openBillingPortal() {
  if (isApiMode()) return api.createPortal(checkoutClient());
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
