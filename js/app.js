import {
  loadState, saveState, logout, saveProfile, saveSubscription,
  completeSessionRemote, joinChallengeRemote, updateChallengeProgressRemote,
  register, loginWithCredentials, regeneratePlanRemote, updateProfileRemote,   getCoachTeamRemote,
  addTeamPlayerRemote, removeTeamPlayerRemote, getCoachPlayerRemote,
  getAssignmentsRemote, createAssignmentRemote, getMyAssignmentsRemote, completeAssignmentRemote, submitFeedbackRemote,
  getCoachVideosRemote, getChildReportRemote, getChildReportsRemote, addChildRemote, removeChildRemote,
  getMyVideosRemote, submitVideoRemote,
  createCheckout, openBillingPortal, getSubscriptionStatus, verifyCheckoutSession,
  getStripeConfig, bootstrap, isApiMode,
} from './services/dataStore.js';
import { generatePersonalizedPlan, getTodaySession, generateEvaluation } from './services/trainingPlanner.js';
import { checkAchievements, getProgressSummary, getCoachTeamData, getParentReport } from './services/progressTracker.js';
import { showToast } from './components/ui.js';
import { SUBSCRIPTION_PLANS } from './data/subscriptions.js';
import { TRAINING_CATEGORIES, EXERCISES } from './data/exercises.js';
import { CHALLENGES } from './data/challenges.js';
import { ACHIEVEMENTS, getLevelForXp } from './data/levels.js';
import { saveWeeklyPlan } from './services/storage.js';
import { openUrl } from './utils/openUrl.js';
import { startCheckoutReturnListener } from './utils/listenCheckoutReturn.js';

let apiReady = false;

async function init() {
  apiReady = await bootstrap();
  if (apiReady) {
    console.log('Connected to Futbol Training Lab API');
  } else {
    console.log('Running in offline/demo mode (localStorage)');
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
  saveState,
  loginWithCredentials,
  logout: () => {
    logout();
    showToast('Logged out successfully');
    setTimeout(() => window.location.href = '/index.html', 500);
  },
  saveProfile,
  updateProfile: updateProfileRemote,
  saveSubscription,
  completeSession: completeSessionRemote,
  joinChallenge: joinChallengeRemote,
  updateChallengeProgress: updateChallengeProgressRemote,
  createCheckout,
  openBillingPortal,
  getSubscriptionStatus,
  verifyCheckoutSession,
  getStripeConfig,
  generatePersonalizedPlan,
  getTodaySession,
  generateEvaluation,
  checkAchievements,
  getProgressSummary,
  getCoachTeamData: async () => {
    const remote = await getCoachTeamRemote();
    return remote || getCoachTeamData();
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
  getParentReport,
  showToast,
  SUBSCRIPTION_PLANS,
  TRAINING_CATEGORIES,
  EXERCISES,
  CHALLENGES,
  ACHIEVEMENTS,
  getLevelForXp,

  async initOnboarding(formData) {
    await initPromise;

    if (isApiMode()) {
      await register(formData);

      if (formData.plan) {
        try {
          const checkout = await createCheckout(formData.plan);
          if (checkout.url) {
            await openUrl(checkout.url);
            return;
          }
        } catch (err) {
          console.warn('Checkout redirect failed:', err.message);
        }
      }

      showToast('Welcome to Futbol Training Lab!');
      const routes = { player: '/player/dashboard.html', coach: '/coach/dashboard.html', parent: '/parent/dashboard.html' };
      setTimeout(() => window.location.href = routes[formData.role || 'player'] || routes.player, 800);
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

export default window.TrainingLab;
