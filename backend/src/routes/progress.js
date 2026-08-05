import { Router } from 'express';
import { prisma, getUserState } from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import { ACHIEVEMENTS, PROGRESSION_LEVELS } from '../data/index.js';

const router = Router();

function getLevelForXp(xp) {
  let current = PROGRESSION_LEVELS[0];
  for (const level of PROGRESSION_LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  const nextIndex = PROGRESSION_LEVELS.indexOf(current) + 1;
  const next = PROGRESSION_LEVELS[nextIndex] || null;
  const progress = next ? ((xp - current.minXp) / (next.minXp - current.minXp)) * 100 : 100;
  return { current, next, progress: Math.min(progress, 100), xp };
}

router.get('/summary', authRequired, async (req, res) => {
  const state = await getUserState(req.userId);
  const levelInfo = getLevelForXp(state.progress.xp);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const weeklySessions = state.completedSessions.filter(s => s.date >= weekAgo);

  res.json({
    xp: state.progress.xp,
    level: levelInfo.current,
    nextLevel: levelInfo.next,
    levelProgress: levelInfo.progress,
    streak: state.progress.streak,
    minutesTrained: state.progress.minutesTrained,
    skillsCompleted: state.progress.skillsCompleted,
    achievementsUnlocked: state.achievements.length,
    totalAchievements: ACHIEVEMENTS.length,
    weeklySessions: weeklySessions.length,
    weeklyMinutes: weeklySessions.reduce((s, sess) => s + (sess.minutes || 0), 0),
  });
});

router.post('/achievements/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId: req.userId, achievementId: id } },
    create: { userId: req.userId, achievementId: id },
    update: {},
  });
  const state = await getUserState(req.userId);
  res.json(state);
});

router.get('/achievements', authRequired, async (req, res) => {
  const state = await getUserState(req.userId);
  res.json({
    unlocked: state.achievements,
    all: ACHIEVEMENTS,
  });
});

export default router;
