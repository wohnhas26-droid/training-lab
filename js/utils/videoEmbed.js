const FILE_EXT = /\.(mp4|webm|ogg|mov)(\?|#|$)/i;

function safeUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url;
  } catch {
    return null;
  }
}

function youtubeId(url) {
  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    return url.pathname.replace(/^\//, '').split('/')[0] || null;
  }
  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const fromQuery = url.searchParams.get('v');
    if (fromQuery) return fromQuery;
    const parts = url.pathname.split('/').filter(Boolean);
    const embedAt = parts.indexOf('embed');
    if (embedAt >= 0 && parts[embedAt + 1]) return parts[embedAt + 1];
    const shortsAt = parts.indexOf('shorts');
    if (shortsAt >= 0 && parts[shortsAt + 1]) return parts[shortsAt + 1];
  }
  return null;
}

function vimeoId(url) {
  const host = url.hostname.toLowerCase();
  if (host !== 'vimeo.com' && host !== 'www.vimeo.com' && host !== 'player.vimeo.com') {
    return null;
  }
  const id = url.pathname.split('/').filter(Boolean).pop();
  return /^\d+$/.test(id || '') ? id : null;
}

/**
 * Normalize a player-submitted video link into a preview descriptor.
 * Never returns javascript: or other non-http(s) schemes.
 */
export function parseVideoUrl(raw) {
  const url = safeUrl(raw);
  if (!url) return { kind: 'none' };

  const yt = youtubeId(url);
  if (yt) {
    return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}` };
  }

  const vim = vimeoId(url);
  if (vim) {
    return { kind: 'vimeo', src: `https://player.vimeo.com/video/${encodeURIComponent(vim)}` };
  }

  if (FILE_EXT.test(url.pathname)) {
    return { kind: 'file', src: url.href };
  }

  return { kind: 'link', href: url.href };
}

export function videoPreviewHtml(raw, escapeHtml) {
  const parsed = parseVideoUrl(raw);
  if (parsed.kind === 'youtube' || parsed.kind === 'vimeo') {
    return `<iframe src="${escapeHtml(parsed.src)}" title="Skill video" style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px;margin-top:1rem;background:#0f172a;" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  if (parsed.kind === 'file') {
    return `<video controls preload="metadata" src="${escapeHtml(parsed.src)}" style="width:100%;max-height:240px;border-radius:8px;margin-top:1rem;background:#0f172a;"></video>`;
  }
  if (parsed.kind === 'link') {
    return `<a class="btn btn-secondary btn-sm" href="${escapeHtml(parsed.href)}" target="_blank" rel="noopener noreferrer" style="margin-top:1rem;">Open video link</a>`;
  }
  return `<div style="background: var(--slate-800); height: 120px; border-radius: 8px; margin-top: 1rem; display: flex; align-items: center; justify-content: center; color: var(--slate-500);">No video link provided</div>`;
}
