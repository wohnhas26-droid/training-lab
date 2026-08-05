import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, getUserState, toJson } from '../lib/prisma.js';
import { signToken, authRequired } from '../middleware/auth.js';
import { generatePersonalizedPlan } from '../services/trainingPlanner.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'player', profile, plan = 'player' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        profile: profile ? {
          create: {
            age: profile.age,
            position: profile.position,
            skillLevel: profile.skillLevel || 'intermediate',
            goals: toJson(profile.goals),
            improvementAreas: toJson(profile.improvementAreas),
            trainingDays: profile.trainingDays || 5,
            equipment: toJson(profile.equipment),
          },
        } : undefined,
        subscription: { create: { plan, status: 'trialing' } },
        progress: { create: {} },
      },
    });

    if (profile) {
      const weeklyPlan = generatePersonalizedPlan(profile);
      await prisma.weeklyPlan.create({
        data: { userId: user.id, plan: toJson(weeklyPlan), active: true },
      });
    }

    const token = signToken(user);
    const state = await getUserState(user.id);

    res.status(201).json({ token, user: state });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    const state = await getUserState(user.id);
    res.json({ token, user: state });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const state = await getUserState(req.userId);
  if (!state) return res.status(404).json({ error: 'User not found' });
  res.json(state);
});

export default router;
