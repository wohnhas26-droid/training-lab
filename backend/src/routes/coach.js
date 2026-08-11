import { Router } from 'express';
import { prisma, getUserState, parseJson } from '../lib/prisma.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authRequired, requireRole('coach', 'admin'));

router.get('/team', async (req, res) => {
  const team = await prisma.team.findFirst({
    where: { coachId: req.userId },
    include: {
      members: {
        include: {
          user: {
            include: { progress: true, profile: true },
          },
        },
      },
    },
  });

  if (!team) {
    return res.json({ team: null, players: [] });
  }

  const players = team.members.map(m => ({
    id: m.user.id,
    name: m.user.name,
    position: m.user.profile?.position || 'Player',
    xp: m.user.progress?.xp || 0,
    streak: m.user.progress?.streak || 0,
    completion: Math.min(100, Math.round(((m.user.progress?.skillsCompleted || 0) / 50) * 100)),
    lastActive: m.user.progress?.lastTrainingDate === new Date().toISOString().split('T')[0] ? 'Today' : 'Recently',
  })).sort((a, b) => b.xp - a.xp);

  res.json({ team, players });
});

router.post('/assignments', async (req, res) => {
  const { title, category, dueDate, notes, assignTo = 'all' } = req.body;

  let team = await prisma.team.findFirst({ where: { coachId: req.userId } });
  if (!team) {
    team = await prisma.team.create({
      data: { name: 'My Team', coachId: req.userId },
    });
  }

  const assignment = await prisma.assignment.create({
    data: { teamId: team.id, coachId: req.userId, title, category, dueDate, notes, assignTo },
  });

  res.status(201).json(assignment);
});

router.get('/assignments', async (req, res) => {
  const team = await prisma.team.findFirst({ where: { coachId: req.userId } });
  if (!team) return res.json([]);

  const assignments = await prisma.assignment.findMany({
    where: { teamId: team.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(assignments);
});

router.post('/feedback', async (req, res) => {
  const { playerId, feedback, rating } = req.body;
  if (!playerId || !feedback) {
    return res.status(400).json({ error: 'Player and feedback required' });
  }

  const entry = await prisma.coachFeedback.create({
    data: {
      coachId: req.userId,
      playerId,
      feedback,
      rating: rating || 7,
      date: new Date().toISOString().split('T')[0],
    },
  });

  res.status(201).json(entry);
});

router.get('/videos', async (req, res) => {
  const team = await prisma.team.findFirst({
    where: { coachId: req.userId },
    include: { members: true },
  });

  if (!team) return res.json([]);

  const playerIds = team.members.map(m => m.userId);
  const videos = await prisma.videoSubmission.findMany({
    where: { playerId: { in: playerIds } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { player: { select: { name: true } } },
  });

  res.json(videos.map(v => ({
    id: v.id,
    playerId: v.playerId,
    playerName: v.player?.name || 'Player',
    skill: v.skill,
    url: v.url,
    status: v.status,
    createdAt: v.createdAt,
  })));
});

export default router;
