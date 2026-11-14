import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Opt-in local test storage; never a production DB replacement.
function statePath() {
  return process.env.NODE_ENV !== 'production' && process.env.LOCAL_GAME_STATE_PATH
    ? resolve(process.env.LOCAL_GAME_STATE_PATH) : null;
}
export function readLocalState() {
  const path = statePath();
  return path && existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}
export function saveLocalState(store) {
  const path = statePath();
  if (!path) return false;
  const snapshot = Object.fromEntries(Object.entries(store).filter(([, value]) => typeof value !== 'function'));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(`${path}.tmp`, JSON.stringify(snapshot), 'utf8');
  renameSync(`${path}.tmp`, path);
  return true;
}
