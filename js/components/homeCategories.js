export function listHomeCategories(raw) {
  const list = Array.isArray(raw) ? raw : Object.values(raw || {});
  return list.filter((c) => c && (c.id || c.name));
}

export function subcategoryPreview(cat, limit = 4) {
  const subs = cat?.subcategories;
  if (!subs || typeof subs !== 'object') return [];
  return Object.values(subs).flat().filter((item) => item != null && String(item).trim()).slice(0, limit).map(String);
}

export function renderHomeCategoryCards(categories, { escapeHtml } = {}) {
  const esc = escapeHtml || ((v) => String(v ?? ''));
  const list = listHomeCategories(categories);
  if (!list.length) {
    return '<p style="color: var(--slate-500);">Training categories will appear when the catalog loads.</p>';
  }
  return list.map((cat) => {
    const preview = subcategoryPreview(cat).map(esc).join(' · ');
    return `
      <div class="card">
        <div style="font-size: 2rem; margin-bottom: 0.75rem;">${esc(cat.icon || '')}</div>
        <h3 class="card-title">${esc(cat.name || cat.id)}</h3>
        <p class="card-subtitle" style="margin-top: 0.5rem;">
          ${preview}${preview ? '...' : ''}
        </p>
      </div>
    `;
  }).join('');
}
