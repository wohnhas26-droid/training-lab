import {
  loadState, logout, saveProfile, saveSubscription,
  completeSessionRemote, joinChallengeRemote, updateChallengeProgressRemote,
  register, loginWithCredentials, regeneratePlanRemote, getTodayTrainingRemote, updateProfileRemote,
  getCoachTeamRemote, emptyCoachTeamSnapshot, getProgressSummaryRemote, checkAchievementsRemote,
  addTeamPlayerRemote, removeTeamPlayerRemote, getCoachPlayerRemote,
  getAssignmentsRemote, createAssignmentRemote, getMyAssignmentsRemote, completeAssignmentRemote, submitFeedbackRemote,
  getCoachVideosRemote, getChildReportRemote, getChildReportsRemote, addChildRemote, removeChildRemote,
  getMyVideosRemote, submitVideoRemote, getCatalogRemote, getChallengesRemote, getEvaluationRemote, getAchievementsRemote,
  getLevelsRemote, getCatalogAchievementsRemote,
  createCheckout, openBillingPortal, getSubscriptionStatus, verifyCheckoutSession,
  getStripeConfig, bootstrap, isApiMode,
} from './services/dataStore.js';
import { generatePersonalizedPlan, getTodaySession, generateEvaluation } from './services/trainingPlanner.js';
import { checkAchievements, getProgressSummary as getLocalProgressSummary, getCoachTeamData } from './services/progressTracker.js';
import { showToast } from './components/ui.js';
import { onboardingNextStep } from './components/onboardingCheckout.js';
import { TRAINING_CATEGORIES, EXERCISES } from './data/exercises.js';
import { CHALLENGES } from './data/challenges.js';
import { hydrateChallenges } from './components/challenges.js';
import { ACHIEVEMENTS, PROGRESSION_LEVELS } from './data/levels.js';
import { saveWeeklyPlan } from './services/storage.js';
import { openUrl } from './utils/openUrl.js';
import { startCheckoutReturnListener } from './utils/listenCheckoutReturn.js';
import { isProtectedPath } from './utils/protectedPath.js';

let apiReady = false;

async function init() {
  apiReady = await bootstrap();
  if (apiReady) {
    console.log('Connected to Futbol Training Lab API');
  } else {
    console.log('Running in offline/demo mode (localStorage)');
  }
  if (isProtectedPath(window.location.pathname) && !loadState().user) {
    window.location.replace('/login.html');
    return;
  }
  await startCheckoutReturnListener({
    verifyCheckoutSession,
    showToast,
  });
}

const initPromise = init();

window.TrainingLab = {
  ready: () => initPromise,
  isApiMode,
  loadState,
  loginWithCredentials,
  logout: () => {
    logout();
    showToast('Logged out successfully');
    setTimeout(() => window.location.href = '/index.html', 500);
  },
  updateProfile: updateProfileRemote,
  completeSession: completeSessionRemote,
  joinChallenge: joinChallengeRemote,
  updateChallengeProgress: updateChallengeProgressRemote,
  createCheckout,
  openBillingPortal,
  getSubscriptionStatus,
  verifyCheckoutSession,
  getStripeConfig,
  regeneratePlan: regeneratePlanRemote,
  getTodayTraining: getTodayTrainingRemote,
  getTodaySession,
  checkAchievements: checkAchievementsRemote,
  getProgressSummary: async () => {
    const remote = await getProgressSummaryRemote();
    if (remote) return remote;
    return isApiMode() ? null : getLocalProgressSummary();
  },
  getCoachTeam: async () => {
    const remote = await getCoachTeamRemote();
    if (remote) return remote;
    return isApiMode() ? null : emptyCoachTeamSnapshot();
  },
  getCoachTeamData: async () => {
    const remote = await getCoachTeamRemote();
    if (remote) return remote.players;
    return isApiMode() ? null : getCoachTeamData();
  },
  addTeamPlayer: addTeamPlayerRemote,
  removeTeamPlayer: removeTeamPlayerRemote,
  getCoachPlayer: getCoachPlayerRemote,
  getAssignments: getAssignmentsRemote,
  createAssignment: createAssignmentRemote,
  getMyAssignments: getMyAssignmentsRemote,
  completeAssignment: completeAssignmentRemote,
  submitFeedback: submitFeedbackRemote,
  getCoachVideos: getCoachVideosRemote,
  getChildReport: getChildReportRemote,
  getChildReports: getChildReportsRemote,
  addChild: addChildRemote,
  removeChild: removeChildRemote,
  getMyVideos: getMyVideosRemote,
  submitVideo: submitVideoRemote,
  getCatalog: async () => {
    const remote = await getCatalogRemote();
    if (remote) return remote;
    return { exercises: EXERCISES, categories: TRAINING_CATEGORIES };
  },
  getChallenges: async () => {
    const remote = await getChallengesRemote();
    if (remote) return hydrateChallenges(remote);
    return hydrateChallenges(CHALLENGES, loadState());
  },
  getEvaluation: async () => {
    const remote = await getEvaluationRemote();
    if (remote) return remote;
    const state = loadState();
    if (state.subscription === 'elite') {
      return generateEvaluation(state.profile || {}, state.progress || {});
    }
    return null;
  },
  getAchievements: async () => {
    const remote = await getAchievementsRemote();
    if (remote && Array.isArray(remote.all)) {
      return {
        all: remote.all,
        unlocked: Array.isArray(remote.unlocked) ? remote.unlocked : [],
      };
    }
    const state = loadState();
    return { all: ACHIEVEMENTS, unlocked: state.achievements || [] };
  },
  getLevels: async () => {
    const remote = await getLevelsRemote();
    if (Array.isArray(remote) && remote.length) return remote;
    return PROGRESSION_LEVELS;
  },
  getCatalogAchievements: async () => {
    const remote = await getCatalogAchievementsRemote();
    if (Array.isArray(remote) && remote.length) return remote;
    return ACHIEVEMENTS;
  },
  showToast,

  async initOnboarding(formData) {
    await initPromise;

    try {
      if (isApiMode()) {
        await register(formData);

        let checkout = null;
        let checkoutError = null;
        if (formData.plan) {
          try {
            checkout = await createCheckout(formData.plan);
          } catch (err) {
            checkoutError = err;
          }
        }

        const next = onboardingNextStep({
          plan: formData.plan,
          checkout,
          error: checkoutError,
          role: formData.role,
        });
        if (next.redirect) {
          await openUrl(next.redirect);
          return;
        }
        showToast(next.toast);
        setTimeout(() => { window.location.href = next.href; }, 1200);
        return;
      }

      const user = { name: formData.name, email: formData.email, role: formData.role || 'player' };
      const { login } = await import('./services/storage.js');
      login(user);

      if (formData.role === 'player') {
        const profile = {
          age: parseInt(formData.age) || 14,
          position: formData.position || 'midfielder',
          skillLevel: formData.skillLevel || 'intermediate',
          goals: formData.goals || [],
          improvementAreas: formData.improvementAreas || [],
          trainingDays: parseInt(formData.trainingDays) || 5,
          equipment: formData.equipment || ['ball'],
        };
        saveProfile(profile);
        const plan = generatePersonalizedPlan(profile);
        saveWeeklyPlan(plan);
      }

      if (formData.plan) saveSubscription(formData.plan);

      showToast('Welcome to Futbol Training Lab!');
      const routes = { player: '/player/dashboard.html', coach: '/coach/dashboard.html', parent: '/parent/dashboard.html' };
      setTimeout(() => window.location.href = routes[user.role] || routes.player, 800);
    } catch (err) {
      showToast(err.message || 'Could not create account');
    }
  },

  requireAuth(role) {
    const state = loadState();
    if (!state.user) {
      window.location.href = '/login.html';
      return null;
    }
    if (role && state.user.role !== role) {
      const routes = { player: '/player/dashboard.html', coach: '/coach/dashboard.html', parent: '/parent/dashboard.html' };
      window.location.href = routes[state.user.role] || '/index.html';
      return null;
    }
    return state;
  },
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-action="logout"]')) return;
  e.preventDefault();
  window.TrainingLab.logout();
});

export default window.TrainingLab;
