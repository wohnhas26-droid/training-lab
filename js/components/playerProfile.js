function listText(items, escapeHtml) {
  const list = Array.isArray(items) ? items.filter((v) => v != null && String(v).trim()) : [];
  if (!list.length) return '—';
  return list.map((item) => escapeHtml(item)).join(', ');
}

export function renderProfileCard(user, profile, { escapeHtml, capitalize } = {}) {
  const esc = escapeHtml || ((v) => String(v ?? ''));
  const cap = capitalize || ((s) => String(s ?? ''));
  const p = profile || {};
  const days = Number(p.trainingDays);
  const daysLabel = Number.isFinite(days) && days > 0 ? String(days) : '—';
  const age = p.age == null || p.age === '' ? '—' : esc(p.age);
  return `
      <h3 class="card-title">${esc(user?.name)}</h3>
      <p class="card-subtitle" style="margin-bottom: 1rem;">${esc(user?.email)}</p>
      <div style="display: grid; gap: 0.75rem;">
        <div><span style="color: var(--slate-500);">Age:</span> ${age}</div>
        <div><span style="color: var(--slate-500);">Position:</span> ${esc(cap(p.position || '—'))}</div>
        <div><span style="color: var(--slate-500);">Skill Level:</span> ${esc(cap(p.skillLevel || '—'))}</div>
        <div><span style="color: var(--slate-500);">Training Days:</span> ${daysLabel} / week</div>
        <div><span style="color: var(--slate-500);">Goals:</span> ${listText(p.goals, esc)}</div>
        <div><span style="color: var(--slate-500);">Equipment:</span> ${listText(p.equipment, esc)}</div>
      </div>
    `;
}

const PLAN_NAMES = {
  player: 'Player Membership',
  elite: 'Elite Membership',
  team: 'Team Membership',
};

const STATUS_LABELS = {
  active: ['Active', 'badge-green'],
  trialing: ['Free Trial', 'badge-gold'],
  past_due: ['Past Due', 'badge-purple'],
  canceled: ['Canceled', 'badge-blue'],
};

export function renderSubscriptionCard(sub, { planNames = PLAN_NAMES, weeklyPlan, escapeHtml } = {}) {
  const esc = escapeHtml || ((v) => String(v ?? ''));
  const plan = sub?.plan || 'player';
  const planLabel = planNames[plan] || plan;
  const [statusLabel, statusCls] = STATUS_LABELS[sub?.status] || ['Unknown', 'badge-blue'];
  const periodEnd = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString()
    : null;
  const generated = weeklyPlan?.generatedAt
    ? new Date(weeklyPlan.generatedAt).toLocaleDateString()
    : 'Not yet';
  return `
        <h3 class="card-title">Subscription</h3>
        <p style="font-size: 1.5rem; font-weight: 700; color: var(--green-400); margin: 1rem 0;">${esc(planLabel)}</p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
          <span class="badge ${statusCls}">${esc(statusLabel)}</span>
          ${plan === 'elite' ? '<span class="badge badge-gold">AI Personal Training</span>' : ''}
        </div>
        ${periodEnd ? `<p style="color: var(--slate-400); font-size: 0.9rem;">Current period ends: ${esc(periodEnd)}</p>` : ''}
        <p style="color: var(--slate-400); margin-top: 1rem; font-size: 0.9rem;" id="plan-generated">
          Weekly plan generated: ${esc(generated)}
        </p>
        <div style="display: flex; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap;">
          <a href="/pricing.html" class="btn btn-secondary btn-sm">Change Plan</a>
          ${sub?.hasBillingAccount && sub?.stripeConfigured
            ? '<button class="btn btn-ghost btn-sm" id="manage-billing-btn">Manage Billing</button>'
            : ''}
        </div>
      `;
}
