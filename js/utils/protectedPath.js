export function isProtectedPath(pathname = '') {
  return /^\/(player|coach|parent)(\/|$)/.test(pathname);
}
