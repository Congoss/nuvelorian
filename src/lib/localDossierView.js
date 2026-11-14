export function readLocalDossierView(key, fallback) {
  try { const raw = sessionStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
  catch { return fallback; }
}
export function saveLocalDossierView(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep navigation usable if storage is blocked. */ }
}
