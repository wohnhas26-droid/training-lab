import { categoryLabel } from './library.js';
import { formatProfileLabel } from './ui.js';

export function renderSessionExercises(exercises, {
  escapeHtml,
  difficultyBadge,
  completedIds,
  categories,
} = {}) {
  const list = Array.isArray(exercises) ? exercises : [];
  if (!list.length) {
    return '<div class="card"><p style="color: var(--slate-400);">No exercises scheduled today. Enjoy your rest day or browse the <a href="/player/library.html">Training Library</a>.</p></div>';
  }
  const done = completedIds instanceof Set ? completedIds : new Set(completedIds || []);
  const esc = escapeHtml || ((v) => String(v ?? ''));
  const badge = difficultyBadge || (() => '');
  return list.map((ex, i) => {
    const isDone = done.has(ex.id);
    const equipment = Array.isArray(ex.equipment) && ex.equipment.length
      ? ex.equipment.map((item) => esc(formatProfileLabel(item))).filter(Boolean).join(', ')
      : 'None';
    return `
          <div class="exercise-item ${isDone ? 'completed' : ''}" data-id="${esc(ex.id)}" data-xp="${ex.xp}" data-duration="${ex.duration}">
            <div class="exercise-check">${isDone ? '✓' : ''}</div>
            <div class="exercise-info">
              <div class="exercise-name">${i + 1}. ${esc(ex.name)}</div>
              <div class="exercise-meta">${esc(categoryLabel(ex.category, categories))} · ${esc(ex.reps)} · ${ex.duration} min · +${ex.xp} XP ${badge(ex.difficulty)}</div>
              <p style="font-size: 0.85rem; color: var(--slate-500); margin-top: 0.25rem;">${esc(ex.description)}</p>
              <p style="font-size: 0.8rem; color: var(--slate-500); margin-top: 0.25rem;">Equipment: ${equipment}</p>
            </div>
          </div>
        `;
  }).join('');
}
