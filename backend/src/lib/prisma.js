import { PrismaClient } from '@prisma/client';
import { serializeCoachFeedback } from './feedback.js';

export const prisma = new PrismaClient();

export function parseJson(str, fallback = []) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function toJson(val) {
  return JSON.stringify(val ?? []);
}

export async function getUserState(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      subscription: true,
      progress: true,
      completedSessions: { orderBy: { createdAt: 'desc' }, take: 100 },
      completedExercises: true,
      achievements: true,
      challengeEnrollments: true,
      weeklyPlans: { where: { active: true }, orderBy: { generatedAt: 'desc' }, take: 1 },
      feedbackReceived: {
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 20,
        include: { coach: { select: { name: true } } },
      },
      parentLinks: { include: { child: { select: { id: true, name: true } } } },
    },
  });

  if (!user) return null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    profile: user.profile ? {
      age: user.profile.age,
      position: user.profile.position,
      skillLevel: user.profile.skillLevel,
      goals: parseJson(user.profile.goals),
      improvementAreas: parseJson(user.profile.improvementAreas),
      trainingDays: user.profile.trainingDays,
      equipment: parseJson(user.profile.equipment),
    } : null,
    subscription: user.subscription?.plan || null,
    subscriptionDetails: user.subscription ? {
      plan: user.subscription.plan,
      status: user.subscription.status,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      hasBillingAccount: Boolean(user.subscription.stripeCustomerId),
    } : null,
    progress: user.progress ? {
      xp: user.progress.xp,
      streak: user.progress.streak,
      lastTrainingDate: user.progress.lastTrainingDate,
      minutesTrained: user.progress.minutesTrained,
      skillsCompleted: user.progress.skillsCompleted,
      weeklyConsistency: user.progress.weeklyConsistency,
      personalBests: parseJson(user.progress.personalBests, {}),
    } : { xp: 0, streak: 0, lastTrainingDate: null, minutesTrained: 0, skillsCompleted: 0, weeklyConsistency: 0, personalBests: {} },
    completedSessions: user.completedSessions.map(s => ({
      id: s.sessionId,
      date: s.date,
      exercises: parseJson(s.exercises),
      xp: s.xp,
      minutes: s.minutes,
    })),
    completedExercises: user.completedExercises.map(e => e.exerciseId),
    achievements: user.achievements.map(a => a.achievementId),
    activeChallenges: user.challengeEnrollments.filter(c => !c.completed).map(c => c.challengeId),
    challengeProgress: Object.fromEntries(user.challengeEnrollments.map(c => [c.challengeId, c.progress])),
    weeklyPlan: user.weeklyPlans[0] ? parseJson(user.weeklyPlans[0].plan, null) : null,
    coachFeedback: user.feedbackReceived.map(serializeCoachFeedback),
    children: user.parentLinks.map(l => ({ id: l.child.id, name: l.child.name })),
  };
}
