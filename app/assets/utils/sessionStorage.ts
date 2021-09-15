export function getSessionStorage() {
  if (window.sessionStorage && sessionStorage) {
    return sessionStorage;
  }
  return null;
}
