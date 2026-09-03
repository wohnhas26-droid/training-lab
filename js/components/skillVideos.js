export const VIDEOS_LOAD_FAILED =
  'Could not load videos right now. Try again in a moment.';

export function renderVideoSkillOptions(categories, { escapeHtml } = {}) {
  const esc = escapeHtml || ((v) => String(v ?? ''));
  const list = Array.isArray(categories) ? categories : Object.values(categories || {});
  return list.map((c) => {
    const label = c?.name || c?.id || '';
    if (!label) return '';
    return `<option value="${esc(label)}">${esc(label)}</option>`;
  }).filter(Boolean).join('');
}

export function renderSkillVideoList(videos, {
  escapeHtml,
  videoPreviewHtml,
  emptyText = 'No submissions yet.',
  pendingLabel = 'Pending Review',
  reviewedLabel = 'Reviewed',
} = {}) {
  if (videos === null) {
    return `<p style="color: var(--slate-500);">${escapeHtml(VIDEOS_LOAD_FAILED)}</p>`;
  }
  const list = Array.isArray(videos) ? videos : [];
  if (!list.length) {
    return `<p style="color: var(--slate-500);">${escapeHtml(emptyText)}</p>`;
  }
  return list.map((v) => {
    const pending = String(v.status || '').toLowerCase() === 'pending';
    return `
      <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--slate-800);">
        <div style="display:flex; justify-content:space-between; align-items:center; gap: 0.75rem; flex-wrap:wrap;">
          <strong>${escapeHtml(v.skill || 'Skill')}</strong>
          <span class="badge ${pending ? 'badge-gold' : 'badge-green'}">${pending ? escapeHtml(pendingLabel) : escapeHtml(reviewedLabel)}</span>
        </div>
        ${videoPreviewHtml(v.url, escapeHtml)}
      </div>`;
  }).join('');
}
