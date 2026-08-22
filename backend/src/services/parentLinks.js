export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function validatePlayerForLink(player, parentId) {
  if (!player) return { status: 404, error: 'No account found with that email' };
  if (player.role !== 'player') return { status: 400, error: 'That account is not a player' };
  if (parentId && player.id === parentId) return { status: 400, error: 'You cannot link your own account' };
  return null;
}
