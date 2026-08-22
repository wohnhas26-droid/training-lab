export function normalizeCategories(raw) {
  if (Array.isArray(raw)) {
    return raw
      .filter((c) => c && c.id)
      .map((c) => ({ id: String(c.id), name: String(c.name || c.id) }));
  }
  if (raw && typeof raw === 'object') {
    return Object.values(raw)
      .filter((c) => c && c.id)
      .map((c) => ({ id: String(c.id), name: String(c.name || c.id) }));
  }
  return [];
}

export function completedExerciseIds(state) {
  const ids = new Set();
  for (const id of state?.completedExercises || []) {
    if (id) ids.add(String(id));
  }
  for (const session of state?.completedSessions || []) {
    const list = Array.isArray(session?.exercises) ? session.exercises : [];
    for (const id of list) {
      if (id) ids.add(String(id));
    }
  }
  return ids;
}

export function filterExercises(exercises, category = 'all') {
  const list = Array.isArray(exercises) ? exercises : [];
  if (!category || category === 'all') return list;
  return list.filter((ex) => ex.category === category);
}

export function renderCategoryOptions(categories, { escapeHtml }) {
  const list = Array.isArray(categories) ? categories : [];
  return `<option value="all">All Categories</option>${list.map((c) => (
    `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`
  )).join('')}`;
}

export function renderLibraryCards(exercises, {
  escapeHtml,
  getCategoryName,
  difficultyBadge,
  completedIds,
} = {}) {
  const list = Array.isArray(exercises) ? exercises : [];
  if (!list.length) {
    return '<p style="color: var(--slate-500);">No exercises in this category.</p>';
  }
  const done = completedIds instanceof Set ? completedIds : new Set(completedIds || []);
  return list.map((ex) => {
    const equipment = Array.isArray(ex.equipment) && ex.equipment.length
      ? ex.equipment.map((item) => escapeHtml(item)).join(', ')
      : 'None';
    const finished = done.has(ex.id);
    return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 0.75rem;">
            <h3 class="card-title">${escapeHtml(ex.name)}</h3>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; justify-content: flex-end;">
              ${finished ? '<span class="badge badge-green">Completed</span>' : ''}
              ${difficultyBadge(ex.difficulty)}
            </div>
          </div>
          <p class="card-subtitle" style="margin: 0.5rem 0;">${escapeHtml(getCategoryName(ex.category))} · ${escapeHtml(ex.reps)} · ${Number(ex.duration) || 0} min · +${Number(ex.xp) || 0} XP</p>
          <p style="font-size: 0.9rem; color: var(--slate-400);">${escapeHtml(ex.description)}</p>
          <p style="font-size: 0.8rem; color: var(--slate-500); margin-top: 0.5rem;">Equipment: ${equipment}</p>
        </div>
      `;
  }).join('');
}
