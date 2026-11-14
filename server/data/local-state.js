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
  // A per-process temp file keeps concurrent local servers/tests from renaming
  // each other's half-written snapshot; Windows can briefly lock the target.
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(snapshot), 'utf8');
  for (let attempt = 0; ; attempt += 1) {
    try { renameSync(temp, path); return true; }
    catch (error) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(error?.code) || attempt >= 20) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }
  }
}
