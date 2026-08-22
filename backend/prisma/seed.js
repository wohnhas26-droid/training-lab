import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import '../src/loadEnv.js';
import { generatePersonalizedPlan } from '../src/services/trainingPlanner.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('demo1234', 12);

  const coach = await prisma.user.upsert({
    where: { email: 'coach@traininglab.com' },
    update: {},
    create: {
      email: 'coach@traininglab.com',
      passwordHash,
      name: 'Coach Martinez',
      role: 'coach',
      subscription: { create: { plan: 'team', status: 'active' } },
      progress: { create: {} },
    },
  });

  const playerProfile = {
    age: 15,
    position: 'midfielder',
    skillLevel: 'intermediate',
    goals: ['passing', 'first touch'],
    improvementAreas: ['ball_mastery', 'passing'],
    trainingDays: 5,
    equipment: ['ball', 'cones', 'wall'],
  };

  const player = await prisma.user.upsert({
    where: { email: 'player@traininglab.com' },
    update: {},
    create: {
      email: 'player@traininglab.com',
      passwordHash,
      name: 'Alex Rivera',
      role: 'player',
      profile: {
        create: {
          age: playerProfile.age,
          position: playerProfile.position,
          skillLevel: playerProfile.skillLevel,
          goals: JSON.stringify(playerProfile.goals),
          improvementAreas: JSON.stringify(playerProfile.improvementAreas),
          trainingDays: playerProfile.trainingDays,
          equipment: JSON.stringify(playerProfile.equipment),
        },
      },
      subscription: { create: { plan: 'elite', status: 'active' } },
      progress: { create: { xp: 1200, streak: 5, skillsCompleted: 42, minutesTrained: 340, lastTrainingDate: new Date().toISOString().split('T')[0] } },
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: 'parent@traininglab.com' },
    update: {},
    create: {
      email: 'parent@traininglab.com',
      passwordHash,
      name: 'Maria Rivera',
      role: 'parent',
      subscription: { create: { plan: 'player', status: 'active' } },
      progress: { create: {} },
    },
  });

  await prisma.parentLink.upsert({
    where: { parentId_childId: { parentId: parent.id, childId: player.id } },
    update: {},
    create: { parentId: parent.id, childId: player.id },
  });

  const team = await prisma.team.upsert({
    where: { id: 'seed-team' },
    update: {},
    create: { id: 'seed-team', name: 'U16 Elite', coachId: coach.id },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: player.id } },
    update: {},
    create: { teamId: team.id, userId: player.id },
  });

  const plan = generatePersonalizedPlan(playerProfile);
  await prisma.weeklyPlan.create({
    data: { userId: player.id, plan: JSON.stringify(plan), active: true },
  });

  for (const achievementId of ['first_session', 'streak_7']) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: player.id, achievementId } },
      update: {},
      create: { userId: player.id, achievementId },
    });
  }

  const videoSubmissions = [
    { id: 'seed-vid-1', skill: 'First Touch', status: 'pending' },
    { id: 'seed-vid-2', skill: 'Finishing', status: 'reviewed' },
  ];
  for (const v of videoSubmissions) {
    await prisma.videoSubmission.upsert({
      where: { id: v.id },
      update: { skill: v.skill, status: v.status },
      create: { id: v.id, playerId: player.id, skill: v.skill, status: v.status },
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await prisma.coachFeedback.upsert({
    where: { id: 'seed-fb-1' },
    update: {
      feedback: 'Great first touch this week. Work on scanning before you receive.',
      rating: 8,
      date: today,
    },
    create: {
      id: 'seed-fb-1',
      coachId: coach.id,
      playerId: player.id,
      feedback: 'Great first touch this week. Work on scanning before you receive.',
      rating: 8,
      date: today,
    },
  });
  await prisma.coachFeedback.upsert({
    where: { id: 'seed-fb-2' },
    update: {
      feedback: 'Passing weight is improving. Next session: weaker-foot wall work.',
      rating: 7,
      date: fourDaysAgo,
    },
    create: {
      id: 'seed-fb-2',
      coachId: coach.id,
      playerId: player.id,
      feedback: 'Passing weight is improving. Next session: weaker-foot wall work.',
      rating: 7,
      date: fourDaysAgo,
    },
  });

  // Historical completed sessions so parent monthly reports show real trends.
  const now = new Date();
  const monthDayISO = (monthsAgo, day) =>
    new Date(now.getFullYear(), now.getMonth() - monthsAgo, day).toISOString().split('T')[0];
  const historical = [
    ...[2, 9].filter(d => d <= now.getDate()).map(day => ({ monthsAgo: 0, day })),
    ...[3, 6, 9, 12, 15, 18, 21, 24, 27].map(day => ({ monthsAgo: 1, day })),
    ...[5, 10, 15, 20, 25].map(day => ({ monthsAgo: 2, day })),
  ];
  for (const { monthsAgo, day } of historical) {
    const id = `seed-sess-m${monthsAgo}-d${day}`;
    const date = monthDayISO(monthsAgo, day);
    await prisma.completedSession.upsert({
      where: { id },
      update: { date },
      create: {
        id,
        userId: player.id,
        sessionId: 'seed-session',
        date,
        exercises: JSON.stringify(['bm_toe_taps', 'pa_two_touch']),
        xp: 60,
        minutes: 30,
      },
    });
  }

  console.log('Seed complete!');
  console.log('');
  console.log('Demo accounts (password: demo1234):');
  console.log('  Player:  player@traininglab.com');
  console.log('  Coach:   coach@traininglab.com');
  console.log('  Parent:  parent@traininglab.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
