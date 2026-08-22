const STORAGE_KEY = 'training_lab_app';

const DEFAULT_STATE = {
  user: null,
  profile: null,
  subscription: null,
  progress: {
    xp: 0,
    streak: 0,
    lastTrainingDate: null,
    minutesTrained: 0,
    skillsCompleted: 0,
    weeklyConsistency: 0,
    personalBests: {},
  },
  completedSessions: [],
  completedExercises: [],
  achievements: [],
  activeChallenges: [],
  challengeProgress: {},
  completedChallenges: [],
  weeklyPlan: null,
  teamAssignments: [],
  coachFeedback: [],
  children: [],
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function updateState(partial) {
  const state = loadState();
  const updated = { ...state, ...partial };
  saveState(updated);
  return updated;
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_STATE };
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getDayName() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

export function isLoggedIn() {
  return loadState().user !== null;
}

export function getCurrentUser() {
  return loadState().user;
}

export function login(user) {
  return updateState({ user });
}

export function logout() {
  const state = loadState();
  saveState({ ...DEFAULT_STATE, completedSessions: state.completedSessions });
  return loadState();
}

export function saveProfile(profile) {
  return updateState({ profile });
}

export function saveSubscription(planId) {
  return updateState({ subscription: planId });
}

export function completeExercise(exerciseId, xp) {
  const state = loadState();
  if (state.completedExercises.includes(exerciseId)) return state;

  const today = getToday();
  const lastDate = state.progress.lastTrainingDate;
  let streak = state.progress.streak;

  if (lastDate === today) {
    // same day, no streak change
  } else if (lastDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
    streak += 1;
  } else {
    streak = 1;
  }

  const exercise = state.completedExercises.includes(exerciseId)
    ? state.completedExercises
    : [...state.completedExercises, exerciseId];

  const progress = {
    ...state.progress,
    xp: state.progress.xp + xp,
    streak,
    lastTrainingDate: today,
    skillsCompleted: state.progress.skillsCompleted + 1,
  };

  return updateState({ completedExercises: exercise, progress });
}

export function completeSession(sessionId, exercises, totalXp, minutes) {
  const state = loadState();
  const today = getToday();
  const lastDate = state.progress.lastTrainingDate;
  let streak = state.progress.streak;

  if (lastDate !== today) {
    if (lastDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      streak += 1;
    } else if (lastDate !== today) {
      streak = lastDate ? 1 : 1;
    }
  }

  const progress = {
    ...state.progress,
    xp: state.progress.xp + totalXp,
    streak,
    lastTrainingDate: today,
    minutesTrained: state.progress.minutesTrained + minutes,
    skillsCompleted: state.progress.skillsCompleted + exercises.length,
  };

  const completedExercises = [...new Set([...state.completedExercises, ...exercises])];
  const completedSessions = [...state.completedSessions, { id: sessionId, date: today, exercises, xp: totalXp }];

  return updateState({ progress, completedExercises, completedSessions });
}

export function unlockAchievement(achievementId) {
  const state = loadState();
  if (state.achievements.includes(achievementId)) return state;
  return updateState({ achievements: [...state.achievements, achievementId] });
}

export function joinChallenge(challengeId) {
  const state = loadState();
  if ((state.completedChallenges || []).includes(challengeId)) return state;
  if (state.activeChallenges.includes(challengeId)) return state;
  return updateState({
    activeChallenges: [...state.activeChallenges, challengeId],
    challengeProgress: { ...state.challengeProgress, [challengeId]: 0 },
  });
}

export function updateChallengeProgress(challengeId, progress) {
  const state = loadState();
  return updateState({
    challengeProgress: { ...state.challengeProgress, [challengeId]: progress },
  });
}

export function saveWeeklyPlan(plan) {
  return updateState({ weeklyPlan: plan });
}

export function addCoachFeedback(feedback) {
  const state = loadState();
  return updateState({
    coachFeedback: [...state.coachFeedback, { ...feedback, date: getToday() }],
  });
}
