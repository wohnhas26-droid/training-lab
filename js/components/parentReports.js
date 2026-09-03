export const REPORTS_INTRO =
  'Monthly training summaries scored from session activity.';

export const REPORTS_NOTE =
  'These scores reflect training volume and consistency. They are not Elite monthly evaluations.';

export function reportsSubtitleForChild(name) {
  return `Training activity for ${name}`;
}

export function reportsFailedSubtitle(name) {
  return `Could not load ${name}'s report cards right now.`;
}

export function renderReportsFailed() {
  return '<div class="card"><p style="color: var(--slate-500);">Try again in a moment.</p></div>';
}

export function renderParentReportCard(report, { escapeHtml } = {}) {
  const esc = escapeHtml || ((v) => String(v ?? ''));
  const r = report || {};
  const dim = Number(r.sessions) === 0 ? ' style="opacity: 0.7;"' : '';
  return `
      <div class="card"${dim}>
        <h3 class="card-title">${esc(r.label)} Report Card</h3>
        <p style="font-size: 2rem; font-weight: 800; color: var(--green-400); margin: 1rem 0 0.25rem;">${Number(r.score) || 0}/10</p>
        <p style="font-size: 0.85rem; color: var(--slate-500); margin-bottom: 1rem;">Activity score</p>
        <ul style="color: var(--slate-400); font-size: 0.9rem; padding-left: 1.25rem;">
          <li>Training consistency: ${esc(r.consistency)}</li>
          <li>Sessions completed: ${Number(r.sessions) || 0}</li>
          <li>Minutes trained: ${Number(r.minutes) || 0}</li>
          <li>Skills practiced: ${Number(r.skills) || 0}</li>
        </ul>
      </div>`;
}
