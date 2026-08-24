export function renderPlayerAssignmentList(assignments, { getCategoryName, escapeHtml }) {
  if (!assignments.length) {
    return '<p style="color: var(--slate-500);">No coach assignments yet.</p>';
  }

  return assignments.map((a) => {
    const notes = a.notes
      ? `<p style="font-size: 0.85rem; color: var(--slate-400); margin-top: 0.35rem;">${escapeHtml(a.notes)}</p>`
      : '';
    const action = a.completed
      ? '<span class="badge badge-green">Completed</span>'
      : `<button type="button" class="btn btn-secondary btn-sm assignment-complete" data-id="${escapeHtml(a.id)}">Mark complete</button>`;
    const dueClass = a.overdue && !a.completed ? 'color: var(--gold);' : 'color: var(--slate-400);';

    return `
      <div class="assignment-card" style="padding: 1rem; background: var(--slate-800); border-radius: 8px; margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
          <div>
            <strong>${escapeHtml(a.title)}</strong>
            <p style="font-size: 0.85rem; ${dueClass} margin-top: 0.25rem;">
              ${escapeHtml(getCategoryName(a.category))} · Due ${escapeHtml(a.dueDate)}${a.overdue && !a.completed ? ' · Overdue' : ''}
            </p>
            ${notes}
          </div>
          <div>${action}</div>
        </div>
      </div>`;
  }).join('');
}

export function renderCoachAssignmentList(assignments, { getCategoryName, escapeHtml, assignToLabel }) {
  if (!assignments.length) {
    return '<p style="color: var(--slate-500);">No assignments yet.</p>';
  }

  return assignments.map((a) => {
    const done = a.completedCount ?? 0;
    const total = a.assigneeCount ?? 0;
    const badge = a.completed
      ? '<span class="badge badge-green">Done</span>'
      : `<span class="badge badge-gold">${done}/${total} complete</span>`;
    const notes = a.notes
      ? `<p style="font-size: 0.85rem; color: var(--slate-400); margin-top: 0.35rem;">${escapeHtml(a.notes)}</p>`
      : '';

    return `
      <div style="padding: 1rem; background: var(--slate-800); border-radius: 8px; margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
          <div>
            <strong>${escapeHtml(a.title)}</strong>
            <p style="font-size: 0.85rem; color: var(--slate-400); margin-top: 0.25rem;">
              ${escapeHtml(getCategoryName(a.category))} · Due ${escapeHtml(a.dueDate)} · Assigned to ${escapeHtml(assignToLabel(a.assignTo))}
            </p>
            ${notes}
          </div>
          ${badge}
        </div>
      </div>`;
  }).join('');
}

export function renderAssignPlayerOptions(players, { escapeHtml } = {}) {
  const esc = escapeHtml || ((v) => String(v ?? ''));
  const list = Array.isArray(players) ? players : [];
  return '<option value="all">Entire Team</option>' +
    list.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
}

export function renderAssignCategoryOptions(categories, { escapeHtml } = {}) {
  const esc = escapeHtml || ((v) => String(v ?? ''));
  const list = Array.isArray(categories) ? categories : Object.values(categories || {});
  return list.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
}
