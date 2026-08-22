import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

// A player's own video submissions, newest first.
router.get('/', requireRole('player'), async (req, res) => {
  const videos = await prisma.videoSubmission.findMany({
    where: { playerId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(videos);
});

// A player submits a skill video for coach review.
router.post('/', requireRole('player'), async (req, res) => {
  const { skill, url } = req.body;
  if (!skill || !String(skill).trim()) {
    return res.status(400).json({ error: 'Skill is required' });
  }

  const video = await prisma.videoSubmission.create({
    data: {
      playerId: req.userId,
      skill: String(skill).trim(),
      url: url ? String(url).trim() : null,
      status: 'pending',
    },
  });
  res.status(201).json(video);
});

export default router;
