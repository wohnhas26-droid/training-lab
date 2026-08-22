export function renderLinkPlayerCard({
  escapeHtml,
  title = 'Link your player',
  message = 'Enter the email your player signed up with. We only show real training data after they are linked.',
} = {}) {
  return `
    <div class="card" id="link-player-card">
      <h3 class="card-title">${escapeHtml ? escapeHtml(title) : title}</h3>
      <p style="color: var(--slate-400); margin: 0.5rem 0 1rem;">${escapeHtml ? escapeHtml(message) : message}</p>
      <form id="link-player-form" style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: end; max-width: 560px;">
        <div class="form-group" style="flex: 1; min-width: 240px; margin: 0;">
          <label class="form-label">Player email</label>
          <input type="email" class="form-input" name="email" required placeholder="player@example.com">
        </div>
        <button type="submit" class="btn btn-primary">Link Player</button>
      </form>
    </div>`;
}

export function bindLinkPlayerForm({ onLinked }) {
  const form = document.getElementById('link-player-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      await window.TrainingLab.ready();
      const state = await window.TrainingLab.addChild(fd.get('email'));
      window.TrainingLab.showToast('Player linked');
      form.reset();
      onLinked?.(state);
    } catch (err) {
      window.TrainingLab.showToast(err.message || 'Could not link player');
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}
