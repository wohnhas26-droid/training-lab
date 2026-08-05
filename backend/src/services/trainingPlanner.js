import { EXERCISES, WEEKLY_SCHEDULE, POSITION_FOCUS, getExercisesByCategory } from '../data/index.js';

const SKILL_LEVEL_MAP = {
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate'],
  advanced: ['beginner', 'intermediate', 'advanced'],
  elite: ['beginner', 'intermediate', 'advanced'],
};

function mapGoalToCategory(goal) {
  const map = {
    'ball mastery': 'ball_mastery',
    dribbling: 'dribbling',
    'first touch': 'first_touch',
    passing: 'passing',
    finishing: 'finishing',
    speed: 'speed',
    agility: 'speed',
    conditioning: 'speed',
    goalkeeping: 'goalkeeper',
    'weak foot': 'finishing',
  };
  return map[goal.toLowerCase()] || null;
}

function blendCategories(base, priority, weight) {
  const count = Math.ceil(base.length * weight);
  const blended = [...priority.slice(0, count)];
  base.forEach(c => { if (!blended.includes(c)) blended.push(c); });
  return blended.slice(0, 4);
}

function selectExercises(categories, allowedDifficulties, equipment, count) {
  const pool = categories.flatMap(cat =>
    getExercisesByCategory(cat).filter(e =>
      allowedDifficulties.includes(e.difficulty) &&
      e.equipment.every(eq => eq === 'ball' || equipment.includes(eq) || equipment.includes('all'))
    )
  );

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = [];
  const usedCategories = new Set();

  for (const ex of shuffled) {
    if (selected.length >= count) break;
    if (!usedCategories.has(ex.category) || selected.length >= count - 1) {
      selected.push(ex);
      usedCategories.add(ex.category);
    }
  }

  while (selected.length < count && shuffled.length > selected.length) {
    const next = shuffled.find(e => !selected.includes(e));
    if (next) selected.push(next);
    else break;
  }

  return selected;
}

export function generatePersonalizedPlan(profile) {
  const {
    position = 'midfielder',
    skillLevel = 'intermediate',
    goals = [],
    improvementAreas = [],
    trainingDays = 5,
    equipment = ['ball'],
  } = profile;

  const allowedDifficulties = SKILL_LEVEL_MAP[skillLevel] || SKILL_LEVEL_MAP.intermediate;
  const positionCategories = POSITION_FOCUS[position] || POSITION_FOCUS.midfielder;

  const priorityCategories = [...new Set([
    ...improvementAreas,
    ...positionCategories,
    ...goals.map(g => mapGoalToCategory(g)),
  ])].filter(Boolean);

  const plan = {};
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  dayNames.forEach((day, index) => {
    if (index >= trainingDays && day !== 'sunday') {
      plan[day] = { rest: true, exercises: [] };
      return;
    }

    const schedule = WEEKLY_SCHEDULE[day];
    let categories = schedule.categories;

    if (priorityCategories.length > 0 && day !== 'sunday') {
      categories = blendCategories(categories, priorityCategories, 0.4);
    }

    const exercises = selectExercises(categories, allowedDifficulties, equipment, day === 'sunday' ? 3 : 5);
    plan[day] = {
      rest: day === 'sunday' && trainingDays < 7,
      focus: schedule.focus,
      categories,
      exercises,
      estimatedMinutes: exercises.reduce((sum, e) => sum + e.duration, 0),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    profile: { position, skillLevel, goals, improvementAreas, trainingDays },
    plan,
    weeks: 4,
  };
}

export function getTodaySession(plan) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = days[new Date().getDay()];

  if (!plan?.plan?.[day]) {
    const schedule = WEEKLY_SCHEDULE[day] || WEEKLY_SCHEDULE.monday;
    const exercises = schedule.categories.flatMap(cat => getExercisesByCategory(cat).slice(0, 2)).slice(0, 5);
    return { day, focus: schedule.focus, categories: schedule.categories, exercises, estimatedMinutes: exercises.reduce((s, e) => s + e.duration, 0) };
  }

  return { day, ...plan.plan[day] };
}

export function generateEvaluation(profile, progress) {
  const sessionsCompleted = progress.skillsCompleted || 0;
  const consistency = progress.streak || 0;

  const strengths = [];
  const improvements = [];

  if (consistency >= 7) strengths.push('Excellent training consistency');
  else improvements.push('Build a more consistent training routine');

  if (sessionsCompleted >= 50) strengths.push('Strong work ethic and drill completion');
  else improvements.push('Increase total drills completed');

  return {
    date: new Date().toISOString().split('T')[0],
    overallRating: Math.min(10, 5 + Math.floor(sessionsCompleted / 20) + Math.floor(consistency / 3)),
    strengths: strengths.length ? strengths : ['Good foundation to build upon'],
    improvements: improvements.length ? improvements : ['Maintain current training intensity'],
    recommendation: `Based on your ${profile.skillLevel || 'intermediate'} level and ${profile.position || 'midfielder'} position, focus on ${(profile.improvementAreas || ['ball mastery']).join(', ')} over the next 2 weeks.`,
  };
}
