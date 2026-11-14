#!/usr/bin/env node
// One command that proves every claim in the README works: npm run verify:hackathon
// Chains every test suite plus both scripted demos. No network, keys or real payments.
// Exits non-zero on the first failure, with a clean PASS/FAIL summary at the end —
// built for an AI screener (or a judge) to run once and trust the result.
import {spawnSync} from 'node:child_process';

const steps = [
  ['npm script', 'test:market', 'mainnet and simulation checks: escrow, replay, fees, agent limits, restocking, mainnet book, public trade totals'],
  ['npm script', 'test:pvp', 'ranked matchmaking, hidden moves, rank claims, paid refill, NEAR AI fallback and duel routes'],
  ['npm script', 'test:guest', '3 checks: guest play, skip tutorial, view-only market, public stats'],
  ['npm script', 'test:escrow', '8 checks: the built escrow contract wasm in an in-memory NEAR mock'],
  ['npm script', 'demo:market', 'deterministic market rehearsal: restock, replay guard, no bot buyback'],
  ['npm script', 'demo:attack', '10 adversarial scenarios against the AI merchants, all must be blocked'],
  ['npm script', 'simulate:market', '7-day fast-forward simulation, isolated fixture'],
];

console.log(`Hackathon verification — ${steps.length} steps\n`);
const results = [];
for (const [, script, label] of steps) {
  process.stdout.write(`▶ npm run ${script}  (${label})\n`);
  const r = spawnSync('npm', ['run', script], {stdio: 'inherit', shell: true});
  const ok = r.status === 0;
  results.push({script, ok});
  console.log(ok ? `✔ ${script}\n` : `✖ ${script} FAILED (exit ${r.status})\n`);
  if (!ok) break; // stop at the first failure so the cause is the last thing printed
}

console.log('── Summary ──');
for (const {script, ok} of results) console.log(`${ok ? '✔' : '✖'} ${script}`);
const passed = results.every(r => r.ok) && results.length === steps.length;
console.log(passed ? `\nPASS — all ${steps.length} steps succeeded.` : '\nFAIL — see the failing step above.');
process.exit(passed ? 0 : 1);
