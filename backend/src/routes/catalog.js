import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import { getUserState } from '../lib/prisma.js';
import { prisma } from '../lib/prisma.js';
import { EXERCISES, CHALLENGES, ACHIEVEMENTS, PROGRESSION_LEVELS, TRAINING_CATEGORIES } from '../data/index.js';
import { monthlyReports } from '../services/reports.js';

const router = Router();

router.get('/exercises', (_req, res) => {
  res.json(EXERCISES);
});

router.get('/exercises/:id', (req, res) => {
  const exercise = EXERCISES.find(e => e.id === req.params.id);
  if (!exercise) return res.status(404).json({ error: 'Not found' });
  res.json(exercise);
});

router.get('/categories', (_req, res) => {
  res.json(TRAINING_CATEGORIES);
});

router.get('/challenges', (_req, res) => {
  res.json(CHALLENGES);
});

router.get('/achievements', (_req, res) => {
  res.json(ACHIEVEMENTS);
});

router.get('/levels', (_req, res) => {
  res.json(PROGRESSION_LEVELS);
});

router.get('/parent/:childId', authRequired, requireRole('parent'), async (req, res) => {
  const link = await prisma.parentLink.findUnique({
    where: { parentId_childId: { parentId: req.userId, childId: req.params.childId } },
  });

  if (!link) return res.status(403).json({ error: 'Not linked to this player' });

  const state = await getUserState(req.params.childId);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const weeklySessions = state.completedSessions.filter(s => s.date >= weekAgo);

  res.json({
    weeklyCompletion: `${weeklySessions.length}/7 sessions`,
    consistency: state.progress.streak >= 5 ? 'Excellent' : state.progress.streak >= 3 ? 'Good' : 'Needs improvement',
    streak: state.progress.streak,
    skillProgression: `${state.progress.xp} XP`,
    goalsAchieved: state.achievements.length,
    minutesThisWeek: weeklySessions.reduce((s, sess) => s + (sess.minutes || 0), 0),
    player: state,
  });
});

router.get('/parent/:childId/reports', authRequired, requireRole('parent'), async (req, res) => {
  const link = await prisma.parentLink.findUnique({
    where: { parentId_childId: { parentId: req.userId, childId: req.params.childId } },
  });

  if (!link) return res.status(403).json({ error: 'Not linked to this player' });

  const state = await getUserState(req.params.childId);
  res.json(monthlyReports(state.completedSessions, { months: 4 }));
});

export default router;
