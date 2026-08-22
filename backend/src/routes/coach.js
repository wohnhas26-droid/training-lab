import { Router } from 'express';
import { prisma, getUserState } from '../lib/prisma.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { monthlyReports } from '../services/reports.js';
import { loadAssignmentViews } from '../services/assignments.js';
import {
  serializeTeamPlayer,
  computeTeamStats,
  buildTeamActivity,
} from '../services/coachTeam.js';

const router = Router();

router.use(authRequired, requireRole('coach', 'admin'));

async function loadTeamActivity(playerIds, now) {
  if (!playerIds.length) return [];

  const [sessions, videos, completions] = await Promise.all([
    prisma.completedSession.findMany({
      where: { userId: { in: playerIds } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.videoSubmission.findMany({
      where: { playerId: { in: playerIds } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { player: { select: { id: true, name: true } } },
    }),
    prisma.assignmentCompletion.findMany({
      where: { playerId: { in: playerIds } },
      orderBy: { completedAt: 'desc' },
      take: 20,
      include: {
        player: { select: { id: true, name: true } },
        assignment: { select: { title: true } },
      },
    }),
  ]);

  return buildTeamActivity({ sessions, videos, completions }, now).slice(0, 8);
}

async function getTeamWithRoster(coachId) {
  const now = new Date();
  const team = await prisma.team.findFirst({
    where: { coachId },
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
    return { team: null, players: [], activity: [], stats: computeTeamStats([]) };
  }

  const players = team.members
    .map((m) => serializeTeamPlayer(m, now))
    .sort((a, b) => b.xp - a.xp);
  const activity = await loadTeamActivity(players.map((p) => p.id).filter(Boolean), now);

  return { team, players, activity, stats: computeTeamStats(players) };
}

async function playerOnCoachTeam(coachId, playerId) {
  const membership = await prisma.teamMember.findFirst({
    where: { userId: playerId, team: { coachId } },
    select: { id: true },
  });
  return Boolean(membership);
}

router.get('/team', async (req, res) => {
  res.json(await getTeamWithRoster(req.userId));
});

router.get('/players/:userId', async (req, res) => {
  const onTeam = await playerOnCoachTeam(req.userId, req.params.userId);
  if (!onTeam) return res.status(404).json({ error: 'Player not on your team' });

  const state = await getUserState(req.params.userId);
  if (!state || state.user.role !== 'player') {
    return res.status(404).json({ error: 'Player not on your team' });
  }

  const videos = await prisma.videoSubmission.findMany({
    where: { playerId: req.params.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const weeklySessions = (state.completedSessions || []).filter(s => s.date >= weekAgo);

  res.json({
    user: state.user,
    profile: state.profile,
    progress: state.progress,
    coachFeedback: state.coachFeedback,
    reports: monthlyReports(state.completedSessions, { months: 4 }),
    weeklySessions: weeklySessions.length,
    weeklyMinutes: weeklySessions.reduce((sum, s) => sum + (s.minutes || 0), 0),
    videos: videos.map(v => ({
      id: v.id,
      skill: v.skill,
      url: v.url,
      status: v.status,
      createdAt: v.createdAt,
    })),
  });
});

router.post('/team/players', async (req, res) => {
  const email = String(req.body.email || '').trim();
  if (!email) return res.status(400).json({ error: 'Player email is required' });

  const player = await prisma.user.findUnique({ where: { email } });
  if (!player) return res.status(404).json({ error: 'No account found with that email' });
  if (player.role !== 'player') return res.status(400).json({ error: 'That account is not a player' });
  if (player.id === req.userId) return res.status(400).json({ error: 'You cannot add yourself' });

  let team = await prisma.team.findFirst({ where: { coachId: req.userId } });
  if (!team) {
    team = await prisma.team.create({ data: { name: 'My Team', coachId: req.userId } });
  }

  // Idempotent: adding an existing member is not an error.
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: player.id } },
    update: {},
    create: { teamId: team.id, userId: player.id },
  });

  res.status(201).json(await getTeamWithRoster(req.userId));
});

router.delete('/team/players/:userId', async (req, res) => {
  const team = await prisma.team.findFirst({ where: { coachId: req.userId } });
  if (team) {
    // Idempotent: removing a non-member is not an error.
    await prisma.teamMember.deleteMany({ where: { teamId: team.id, userId: req.params.userId } });
  }
  res.json(await getTeamWithRoster(req.userId));
});

router.post('/assignments', async (req, res) => {
  const title = String(req.body.title || '').trim();
  const category = String(req.body.category || '').trim();
  const dueDate = String(req.body.dueDate || '').trim();
  const notes = String(req.body.notes || '').trim() || null;
  const assignTo = String(req.body.assignTo || 'all').trim() || 'all';

  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (!dueDate) return res.status(400).json({ error: 'Due date is required' });

  let team = await prisma.team.findFirst({ where: { coachId: req.userId } });
  if (!team) {
    team = await prisma.team.create({
      data: { name: 'My Team', coachId: req.userId },
    });
  }

  if (assignTo !== 'all') {
    const onTeam = await playerOnCoachTeam(req.userId, assignTo);
    if (!onTeam) return res.status(404).json({ error: 'Player not on your team' });
  }

  const assignment = await prisma.assignment.create({
    data: { teamId: team.id, coachId: req.userId, title, category, dueDate, notes, assignTo },
  });

  const [view] = await loadAssignmentViews(prisma, [assignment]);
  res.status(201).json(view);
});

router.get('/assignments', async (req, res) => {
  const team = await prisma.team.findFirst({ where: { coachId: req.userId } });
  if (!team) return res.json([]);

  const assignments = await prisma.assignment.findMany({
    where: { teamId: team.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(await loadAssignmentViews(prisma, assignments));
});

router.post('/feedback', async (req, res) => {
  const { playerId, feedback, rating, videoId } = req.body;
  if (!playerId || !feedback) {
    return res.status(400).json({ error: 'Player and feedback required' });
  }

  const onTeam = await playerOnCoachTeam(req.userId, playerId);
  if (!onTeam) return res.status(404).json({ error: 'Player not on your team' });

  const entry = await prisma.coachFeedback.create({
    data: {
      coachId: req.userId,
      playerId,
      feedback,
      rating: rating || 7,
      date: new Date().toISOString().split('T')[0],
    },
  });

  if (videoId) {
    await prisma.videoSubmission.updateMany({
      where: { id: String(videoId), playerId },
      data: { status: 'reviewed' },
    });
  }

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
