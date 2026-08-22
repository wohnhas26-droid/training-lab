import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import { prisma, getUserState } from '../lib/prisma.js';
import { validatePlayerForLink } from '../services/parentLinks.js';

const router = Router();

router.use(authRequired, requireRole('parent', 'admin'));

async function findPlayerByEmail(email) {
  const trimmed = String(email || '').trim();
  if (!trimmed) return null;
  const exact = await prisma.user.findUnique({ where: { email: trimmed } });
  if (exact) return exact;
  return prisma.user.findUnique({ where: { email: trimmed.toLowerCase() } });
}

router.post('/children', async (req, res) => {
  const email = String(req.body.email || '').trim();
  if (!email) return res.status(400).json({ error: 'Player email is required' });

  const player = await findPlayerByEmail(email);
  const issue = validatePlayerForLink(player, req.userId);
  if (issue) return res.status(issue.status).json({ error: issue.error });

  await prisma.parentLink.upsert({
    where: { parentId_childId: { parentId: req.userId, childId: player.id } },
    update: {},
    create: { parentId: req.userId, childId: player.id },
  });

  res.status(201).json(await getUserState(req.userId));
});

router.delete('/children/:userId', async (req, res) => {
  await prisma.parentLink.deleteMany({
    where: { parentId: req.userId, childId: req.params.userId },
  });
  res.json(await getUserState(req.userId));
});

export default router;
