import { Router } from 'express';
import { prisma, getUserState } from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import { CHALLENGES } from '../data/index.js';
import { applyChallengeProgress } from '../services/challenges.js';

const router = Router();

router.get('/', authRequired, async (req, res) => {
  const state = await getUserState(req.userId);
  res.json(CHALLENGES.map(c => ({
    ...c,
    joined: state.activeChallenges.includes(c.id) || state.completedChallenges.includes(c.id),
    completed: state.completedChallenges.includes(c.id),
    progress: state.challengeProgress[c.id] || 0,
  })));
});

router.post('/:id/join', authRequired, async (req, res) => {
  const { id } = req.params;
  const challenge = CHALLENGES.find(c => c.id === id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  await prisma.challengeEnrollment.upsert({
    where: { userId_challengeId: { userId: req.userId, challengeId: id } },
    create: { userId: req.userId, challengeId: id, progress: 0 },
    update: {},
  });

  const state = await getUserState(req.userId);
  res.json(state);
});

router.post('/:id/progress', authRequired, async (req, res) => {
  const { id } = req.params;
  const { increment = 1 } = req.body;
  const challenge = CHALLENGES.find(c => c.id === id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  const enrollment = await prisma.challengeEnrollment.findUnique({
    where: { userId_challengeId: { userId: req.userId, challengeId: id } },
  });

  if (!enrollment) return res.status(400).json({ error: 'Not enrolled in challenge' });

  const { progress, completed, newlyCompleted } = applyChallengeProgress(
    enrollment,
    increment,
    challenge.targetCount,
  );

  await prisma.challengeEnrollment.update({
    where: { id: enrollment.id },
    data: { progress, completed },
  });

  if (newlyCompleted) {
    await prisma.progress.update({
      where: { userId: req.userId },
      data: { xp: { increment: challenge.xpReward } },
    });
  }

  const state = await getUserState(req.userId);
  res.json({ ...state, challengeCompleted: completed, newlyCompleted });
});

export default router;
