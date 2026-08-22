import { Router } from 'express';
import { prisma, getUserState, toJson, parseJson } from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import { generatePersonalizedPlan, getTodaySession, generateEvaluation } from '../services/trainingPlanner.js';
import { loadAssignmentViews, playerCanSeeAssignment } from '../services/assignments.js';

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

router.get('/assignments', authRequired, async (req, res) => {
  const memberships = await prisma.teamMember.findMany({
    where: { userId: req.userId },
    select: { teamId: true },
  });
  const teamIds = memberships.map((m) => m.teamId);
  if (!teamIds.length) return res.json([]);

  const assignments = await prisma.assignment.findMany({
    where: {
      teamId: { in: teamIds },
      OR: [{ assignTo: 'all' }, { assignTo: req.userId }],
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  res.json(await loadAssignmentViews(prisma, assignments, { playerId: req.userId }));
});

router.post('/assignments/:id/complete', authRequired, async (req, res) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const onTeam = await prisma.teamMember.findFirst({
    where: { teamId: assignment.teamId, userId: req.userId },
    select: { id: true },
  });
  if (!onTeam || !playerCanSeeAssignment(assignment.assignTo, req.userId)) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  await prisma.assignmentCompletion.upsert({
    where: { assignmentId_playerId: { assignmentId: assignment.id, playerId: req.userId } },
    create: { assignmentId: assignment.id, playerId: req.userId },
    update: {},
  });

  const [view] = await loadAssignmentViews(prisma, [assignment], { playerId: req.userId });
  res.json(view);
});

router.get('/evaluation', authRequired, async (req, res) => {
  const state = await getUserState(req.userId);
  if (state.subscription !== 'elite') {
    return res.status(403).json({ error: 'Elite subscription required' });
  }
  res.json(generateEvaluation(state.profile || {}, state.progress));
});

export default router;
