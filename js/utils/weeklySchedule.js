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

export function renderWeeklySchedule(days, today, { escapeHtml } = {}) {
  const list = Array.isArray(days) ? days : [];
  if (!list.length) {
    return '<p style="color: var(--slate-400);">No weekly plan yet.</p>';
  }
  const esc = escapeHtml || ((v) => String(v ?? ''));
  return list.map(({ day, rest, focus }) => {
    const name = String(day || '');
    const label = name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
    const focusText = rest
      ? 'Rest'
      : (Array.isArray(focus) ? focus.slice(0, 2).join(', ') : '') || '—';
    return `
        <div class="day-card ${day === today ? 'today' : ''}">
          <div class="day-name">${esc(label)}</div>
          <div class="day-focus">${esc(focusText)}</div>
        </div>
      `;
  }).join('');
}

