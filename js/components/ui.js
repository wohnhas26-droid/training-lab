export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

export function hasSavedUser() {
  try {
    const state = JSON.parse(localStorage.getItem('training_lab_app') || '{}');
    return Boolean(state.user);
  } catch {
    return false;
  }
}

export function showToast(message, duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}

export function renderNav(activePage = '') {
  const state = JSON.parse(localStorage.getItem('training_lab_app') || '{}');
  const loggedIn = Boolean(state.user);
  const role = state.user?.role || 'player';

  const dashboardLinks = {
    player: '/player/dashboard.html',
    coach: '/coach/dashboard.html',
    parent: '/parent/dashboard.html',
  };

  return `
    <nav class="nav">
      <a href="/index.html" class="logo">
        <div class="logo-icon">⚽</div>
        Futbol Training Lab
      </a>
      <div class="nav-links">
        <a href="/index.html" ${activePage === 'home' ? 'class="active"' : ''}>Home</a>
        <a href="/pricing.html" ${activePage === 'pricing' ? 'class="active"' : ''}>Pricing</a>
        ${loggedIn
          ? `<a href="${dashboardLinks[role] || dashboardLinks.player}">Dashboard</a>
             <button type="button" class="btn btn-ghost btn-sm" data-action="logout">Log Out</button>`
          : `<a href="/login.html">Log In</a>
             <a href="/onboarding.html" class="btn btn-primary btn-sm">Get Started</a>`
        }
      </div>
    </nav>
  `;
}

export function renderSidebar(role, activeItem) {
  const menus = {
    player: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/player/dashboard.html' },
      { id: 'training', label: 'Today\'s Training', icon: '⚽', href: '/player/training.html' },
      { id: 'library', label: 'Training Library', icon: '📚', href: '/player/library.html' },
      { id: 'progress', label: 'Progress', icon: '📈', href: '/player/progress.html' },
      { id: 'challenges', label: 'Challenges', icon: '🏆', href: '/player/challenges.html' },
      { id: 'profile', label: 'My Profile', icon: '👤', href: '/player/profile.html' },
    ],
    coach: [
      { id: 'dashboard', label: 'Coach Dashboard', icon: '📋', href: '/coach/dashboard.html' },
      { id: 'assign', label: 'Assign Training', icon: '📝', href: '/coach/assign.html' },
      { id: 'players', label: 'Player Progress', icon: '👥', href: '/coach/players.html' },
      { id: 'leaderboard', label: 'Leaderboard', icon: '🏅', href: '/coach/leaderboard.html' },
      { id: 'feedback', label: 'Video Review', icon: '🎥', href: '/coach/feedback.html' },
    ],
    parent: [
      { id: 'dashboard', label: 'Parent Dashboard', icon: '👨‍👩‍👧', href: '/parent/dashboard.html' },
      { id: 'reports', label: 'Report Cards', icon: '📄', href: '/parent/reports.html' },
      { id: 'attendance', label: 'Attendance', icon: '📅', href: '/parent/attendance.html' },
    ],
  };

  const items = menus[role] || menus.player;
  return `
    <aside class="sidebar">
      <ul class="sidebar-nav">
        ${items.map(item => `
          <li>
            <a href="${item.href}" class="${activeItem === item.id ? 'active' : ''}">
              <span>${item.icon}</span> ${item.label}
            </a>
          </li>
        `).join('')}
      </ul>
    </aside>
  `;
}

export function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function titleCaseChunk(part) {
  if (!part) return part;
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

const TITLE_CASE_SMALL_WORDS = new Set([
  'a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'or', 'the', 'to',
]);

/** Title-case a stored profile token (position, skill level). */
export function formatProfileLabel(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  return text
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(titleCaseChunk)
    .join(' ');
}

/** Title-case a display phrase, keeping hyphens and slashes (Pull-Push, Inside/Outside). */
export function titleCasePhrase(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => {
      if (i > 0 && TITLE_CASE_SMALL_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.replace(/[^\s/-]+/g, titleCaseChunk);
    })
    .join(' ');
}

export function difficultyBadge(difficulty) {
  const colors = {
    beginner: 'badge-green',
    intermediate: 'badge-gold',
    advanced: 'badge-purple',
  };
  return `<span class="badge ${colors[difficulty] || 'badge-green'}">${capitalize(difficulty)}</span>`;
}
