export const PROGRESSION_LEVELS = [
  { id: 'rookie', name: 'Rookie', minXp: 0, icon: '🌱' },
  { id: 'academy', name: 'Academy', minXp: 500, icon: '⚽' },
  { id: 'advanced', name: 'Advanced', minXp: 1500, icon: '🔥' },
  { id: 'elite', name: 'Elite', minXp: 3500, icon: '⭐' },
  { id: 'premier', name: 'Premier', minXp: 7000, icon: '🏆' },
  { id: 'professional', name: 'Professional', minXp: 15000, icon: '👑' },
];

export const ACHIEVEMENTS = [
  { id: 'first_session', name: 'First Steps', description: 'Complete your first training session', icon: '🎯', xp: 50 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day training streak', icon: '🔥', xp: 200 },
  { id: 'streak_30', name: 'Iron Will', description: '30-day training streak', icon: '💪', xp: 1000 },
  { id: 'ball_master', name: 'Ball Master', description: 'Complete 50 ball mastery drills', icon: '⚽', xp: 300 },
  { id: 'weak_foot', name: 'Two-Footed Threat', description: 'Complete the Weak Foot Challenge', icon: '🦶', xp: 500 },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete the Speed Challenge', icon: '⚡', xp: 400 },
  { id: 'finisher', name: 'Clinical Finisher', description: 'Complete 25 finishing drills', icon: '🥅', xp: 350 },
  { id: 'juggler', name: 'Juggling Pro', description: 'Reach 100 juggles', icon: '🎪', xp: 250 },
  { id: 'challenge_hero', name: 'Challenge Hero', description: 'Complete 5 monthly challenges', icon: '🏅', xp: 750 },
  { id: 'elite_graduate', name: 'Elite Graduate', description: 'Reach Elite progression level', icon: '⭐', xp: 500 },
];

export function getLevelForXp(xp) {
  let current = PROGRESSION_LEVELS[0];
  for (const level of PROGRESSION_LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  const nextIndex = PROGRESSION_LEVELS.indexOf(current) + 1;
  const next = PROGRESSION_LEVELS[nextIndex] || null;
  const progress = next
    ? ((xp - current.minXp) / (next.minXp - current.minXp)) * 100
    : 100;
  return { current, next, progress: Math.min(progress, 100), xp };
}
