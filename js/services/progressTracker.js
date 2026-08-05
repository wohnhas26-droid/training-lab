import { ACHIEVEMENTS, getLevelForXp } from '../data/levels.js';
import { unlockAchievement, loadState } from './storage.js';

export function checkAchievements(state) {
  const unlocked = [];
  const { progress, completedExercises, achievements, activeChallenges, challengeProgress } = state;

  const checks = [
    { id: 'first_session', condition: progress.skillsCompleted >= 1 },
    { id: 'streak_7', condition: progress.streak >= 7 },
    { id: 'streak_30', condition: progress.streak >= 30 },
    { id: 'ball_master', condition: countCategory(completedExercises, 'bm_') >= 50 },
    { id: 'finisher', condition: countCategory(completedExercises, 'fi_') >= 25 },
    { id: 'weak_foot', condition: (challengeProgress.weak_foot || 0) >= 20 },
    { id: 'speed_demon', condition: (challengeProgress.speed || 0) >= 15 },
    { id: 'juggler', condition: (challengeProgress.juggling || 0) >= 100 },
    { id: 'challenge_hero', condition: countCompletedChallenges(challengeProgress) >= 5 },
    { id: 'elite_graduate', condition: getLevelForXp(progress.xp).current.id === 'elite' || getLevelForXp(progress.xp).current.minXp >= 3500 },
  ];

  for (const check of checks) {
    if (check.condition && !achievements.includes(check.id)) {
      const achievement = ACHIEVEMENTS.find(a => a.id === check.id);
      if (achievement) {
        unlockAchievement(check.id);
        unlocked.push(achievement);
      }
    }
  }

  return unlocked;
}

function countCategory(exerciseIds, prefix) {
  return exerciseIds.filter(id => id.startsWith(prefix)).length;
}

function countCompletedChallenges(challengeProgress) {
  return Object.entries(challengeProgress).filter(([, v]) => v >= 100).length;
}

export function getProgressSummary() {
  const state = loadState();
  const { progress, achievements, completedSessions } = state;
  const levelInfo = getLevelForXp(progress.xp);

  const thisWeek = getWeekSessions(completedSessions);

  return {
    xp: progress.xp,
    level: levelInfo.current,
    nextLevel: levelInfo.next,
    levelProgress: levelInfo.progress,
    streak: progress.streak,
    minutesTrained: progress.minutesTrained,
    skillsCompleted: progress.skillsCompleted,
    achievementsUnlocked: achievements.length,
    totalAchievements: ACHIEVEMENTS.length,
    weeklySessions: thisWeek.length,
    weeklyMinutes: thisWeek.reduce((s, sess) => s + (sess.minutes || 0), 0),
  };
}

function getWeekSessions(sessions) {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  return sessions.filter(s => s.date >= weekAgo);
}

export function getParentReport(playerState) {
  const summary = getProgressSummaryFromState(playerState);
  return {
    weeklyCompletion: `${summary.weeklySessions}/7 sessions`,
    consistency: summary.streak >= 5 ? 'Excellent' : summary.streak >= 3 ? 'Good' : 'Needs improvement',
    streak: summary.streak,
    skillProgression: `${summary.level.name} (${summary.xp} XP)`,
    goalsAchieved: playerState.achievements?.length || 0,
    minutesThisWeek: summary.weeklyMinutes,
  };
}

function getProgressSummaryFromState(state) {
  const { progress, completedSessions } = state;
  const levelInfo = getLevelForXp(progress.xp);
  const thisWeek = getWeekSessions(completedSessions || []);
  return {
    xp: progress.xp,
    level: levelInfo.current,
    streak: progress.streak,
    weeklySessions: thisWeek.length,
    weeklyMinutes: thisWeek.reduce((s, sess) => s + (sess.minutes || 0), 0),
  };
}

export function getCoachTeamData() {
  const demoPlayers = [
    { id: 1, name: 'Alex Rivera', position: 'Midfielder', xp: 2450, streak: 12, completion: 92, lastActive: 'Today' },
    { id: 2, name: 'Jordan Lee', position: 'Striker', xp: 1890, streak: 8, completion: 85, lastActive: 'Today' },
    { id: 3, name: 'Sam Okonkwo', position: 'Defender', xp: 1200, streak: 5, completion: 78, lastActive: 'Yesterday' },
    { id: 4, name: 'Casey Morgan', position: 'Winger', xp: 980, streak: 3, completion: 65, lastActive: '2 days ago' },
    { id: 5, name: 'Taylor Kim', position: 'Goalkeeper', xp: 750, streak: 7, completion: 88, lastActive: 'Today' },
  ];

  const state = loadState();
  if (state.user?.role === 'player') {
    demoPlayers.unshift({
      id: 0,
      name: state.user.name,
      position: state.profile?.position || 'Player',
      xp: state.progress.xp,
      streak: state.progress.streak,
      completion: Math.min(100, Math.round((state.progress.skillsCompleted / 50) * 100)),
      lastActive: 'Today',
    });
  }

  return demoPlayers.sort((a, b) => b.xp - a.xp);
}
