const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function daysFromWeeklyPlan(weeklyPlan, fallback = {}) {
  const plan = weeklyPlan?.plan;
  const source = plan && typeof plan === 'object' ? plan : fallback;
  const keys = DAY_ORDER.filter((day) => source[day]);
  const extra = Object.keys(source).filter((day) => !DAY_ORDER.includes(day));
  return [...keys, ...extra].map((day) => {
    const sched = source[day] || {};
    const rest = Boolean(sched.rest);
    const focus = rest ? ['Rest'] : (Array.isArray(sched.focus) ? sched.focus : []);
    return { day, rest, focus, estimatedMinutes: sched.estimatedMinutes || 0 };
  });
}
