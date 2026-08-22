export function validateAchievementId(id, catalog) {
  const key = String(id || '').trim();
  const list = Array.isArray(catalog) ? catalog : [];
  if (!key || !list.some((a) => a.id === key)) {
    return { status: 400, error: 'Unknown achievement' };
  }
  return null;
}
