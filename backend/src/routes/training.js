import { Router } from 'express';
import { prisma, getUserState, toJson, parseJson } from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import { generatePersonalizedPlan, getTodaySession, generateEvaluation } from '../services/trainingPlanner.js';

const router = Router();

function getToday() {
  return new Date().toISOString().split('T')[0];
}

router.get('/today', authRequired, async (req, res) => {
  const state = await getUserState(req.userId);
  const session = getTodaySession(state.weeklyPlan);
  res.json(session);
});

router.get('/plan', authRequired, async (req, res) => {
  const state = await getUserState(req.userId);
  res.json(state.weeklyPlan);
});

router.post('/plan/regenerate', authRequired, async (req, res) => {
  const state = await getUserState(req.userId);
  if (!state.profile) return res.status(400).json({ error: 'Profile required' });

  const plan = generatePersonalizedPlan(state.profile);

  await prisma.weeklyPlan.updateMany({ where: { userId: req.userId, active: true }, data: { active: false } });
  await prisma.weeklyPlan.create({ data: { userId: req.userId, plan: toJson(plan), active: true } });

  res.json(plan);
});

router.post('/session/complete', authRequired, async (req, res) => {
  const { sessionId, exercises, totalXp, minutes } = req.body;
  if (!sessionId || !exercises?.length) {
    return res.status(400).json({ error: 'Session data required' });
  }

  const today = getToday();
  const progress = await prisma.progress.findUnique({ where: { userId: req.userId } });

  let streak = progress?.streak || 0;
  const lastDate = progress?.lastTrainingDate;

  if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    streak = lastDate === yesterday ? streak + 1 : 1;
  }

  await prisma.completedSession.create({
    data: {
      userId: req.userId,
      sessionId,
      date: today,
      exercises: toJson(exercises),
      xp: totalXp || 0,
      minutes: minutes || 0,
    },
  });

  for (const exerciseId of exercises) {
    await prisma.completedExercise.upsert({
      where: { userId_exerciseId: { userId: req.userId, exerciseId } },
      create: { userId: req.userId, exerciseId },
      update: {},
    });
  }

  await prisma.progress.upsert({
    where: { userId: req.userId },
    create: {
      userId: req.userId,
      xp: totalXp || 0,
      streak,
      lastTrainingDate: today,
      minutesTrained: minutes || 0,
      skillsCompleted: exercises.length,
    },
    update: {
      xp: { increment: totalXp || 0 },
      streak,
      lastTrainingDate: today,
      minutesTrained: { increment: minutes || 0 },
      skillsCompleted: { increment: exercises.length },
    },
  });

  const state = await getUserState(req.userId);
  res.json(state);
});

router.put('/profile', authRequired, async (req, res) => {
  const { age, position, skillLevel, goals, improvementAreas, trainingDays, equipment } = req.body;

  await prisma.profile.upsert({
    where: { userId: req.userId },
    create: {
      userId: req.userId,
      age, position, skillLevel,
      goals: toJson(goals),
      improvementAreas: toJson(improvementAreas),
      trainingDays,
      equipment: toJson(equipment),
    },
    update: {
      age, position, skillLevel,
      goals: toJson(goals),
      improvementAreas: toJson(improvementAreas),
      trainingDays,
      equipment: toJson(equipment),
    },
  });

  const state = await getUserState(req.userId);
  res.json(state);
});

router.get('/evaluation', authRequired, async (req, res) => {
  const state = await getUserState(req.userId);
  if (state.subscription !== 'elite') {
    return res.status(403).json({ error: 'Elite subscription required' });
  }
  res.json(generateEvaluation(state.profile || {}, state.progress));
});

export default router;
