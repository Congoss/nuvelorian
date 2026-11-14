#!/usr/bin/env node
// Builds a clean public copy of the project for the NEAR Hackathon submission.
//
//   node scripts/hackathon-export.mjs [targetDir] [--git]
//
// 1. Copies an allow-list of source folders/files to targetDir (default ../planet4-hackathon),
//    skipping secrets, saves, logs, builds, release archives and local tooling.
// 2. Scans every copied text file for secrets; aborts (and deletes nothing) if any are found.
// 3. Reconstructs the pre-hackathon baseline (code as of BETA 2.49, before the
//    2026-10-19 19:02 UTC announcement) into <targetDir>.baseline using file timestamps and
//    the payloads of deploy packages <= 2.49. Writes HACKATHON_BASELINE.md with the method
//    and any files whose old version could not be recovered.
// 4. With --git: git init, commit the baseline, tag `pre-hackathon`, commit the current
//    tree, tag `hackathon-submission`. Nothing is pushed.
//
// Nothing in the source project is modified. Re-running replaces targetDir.
import {cpSync,existsSync,mkdirSync,readdirSync,readFileSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {execFileSync} from 'node:child_process';

const ROOT = resolve('.');
const args = process.argv.slice(2);
const TARGET = resolve(args.find(a => !a.startsWith('--')) || join(ROOT, '..', 'planet4-hackathon'));
const WITH_GIT = args.includes('--git');
const ANNOUNCED = Date.parse('2026-10-19T19:02:00Z');
const BASELINE_VERSION = 2.49;

const LOCAL_EXPORT_ROOT = join(ROOT, '.local') + sep;
if (TARGET === ROOT || (TARGET.startsWith(ROOT + sep) && !TARGET.startsWith(LOCAL_EXPORT_ROOT))) throw new Error('Target must be outside the project folder or inside .local');
if (existsSync(join(TARGET,'.git'))) throw new Error('Existing Git history must be preserved; select a new export directory');

const ALLOW = ['src','server','api','scripts','tests','public','docs','entities','contracts',
  'index.html','package.json','package-lock.json','vite.config.js','eslint.config.js','jsconfig.json',
  'components.json','tailwind.config.js','postcss.config.js','.env.production.example','.gitignore',
  'README.md','LICENSE','ASSETS_LICENSE.md','PATCH_HISTORY.md'];

// Paths (relative, forward slashes) that never leave the machine.
const DENY = [
  /(^|\/)\.env(?!\.production\.example$)/, /(^|\/)node_modules\//, /\.log$/, /\.psd$/i, /\.zip$/i, /\.tgz$/i,
  /(^|\/)\.local\//, /(^|\/)dist[^/]*\//, /^src\/dev\//, /^contracts\/.*\/target\//,
  // deployment tooling with host-specific paths
  /^scripts\/(package-patch-|stage-patch-|prepare-build-|prepare-patch-|fetch-diagnostics|snapshot-local-server|launch-serve-dist|serve-dist\.)/,
  // internal notes: incident reviews, security audits, chat logs, operator runbooks
  /^docs\/(audits|superpowers)\//, /^docs\/(CHAT_ISSUES|PENDING_FIXES|PRELAUNCH-AUDIT|audit-review|release-publication|PERFORMANCE|NUVELOR_|performance-review|achievements-review)/i,
  /^docs\/HACKATHON_(PLAN|README|COMPETITORS|SUBMISSION|CHECKLIST|READINESS)/,
  /^docs\/MARKET_(JOPKA|SCENARIOS)_/,
];
const TEXT = /\.(m?js|cjs|jsx|ts|tsx|json|md|txt|html|css|sql|yml|yaml|svg|env|example|sh|ps1|cmd)$/i;
const SECRET_PATTERNS = [
  ['NEAR private key', /ed25519:[1-9A-HJ-NP-Za-km-z]{60,}/],
  ['PEM private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Telegram bot token', /\b\d{8,10}:AA[A-Za-z0-9_-]{30,}\b/],
  ['Database URL with password', /postgres(?:ql)?:\/\/[^\s'"`:@]+:(?!PASSWORD@)[^\s'"`@]+@/],
  ['OpenAI-style key', /\bsk-[A-Za-z0-9]{24,}\b/],
  ['NEAR AI / bearer token literal', /Bearer\s+[A-Za-z0-9._-]{32,}/],
  ['Seed phrase field', /"(seed_?phrase|mnemonic|secret_key|private_key)"\s*:\s*"[^"]{20,}"/i],
];
const MAX_FILE = 95 * 1024 * 1024; // GitHub rejects files over 100 MB

const posix = p => p.split(sep).join('/');
function* walk(dir) {
  for (const entry of readdirSync(dir, {withFileTypes:true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full); else if (entry.isFile()) yield full;
  }
}
function listSource() {
  const files = [];
  for (const name of ALLOW) {
    const full = join(ROOT, name);
    if (!existsSync(full)) continue;
    for (const f of statSync(full).isDirectory() ? walk(full) : [full]) {
      const rel = posix(relative(ROOT, f));
      if (!DENY.some(rx => rx.test(rel))) files.push(rel);
    }
  }
  return files.sort();
}

// --- 1. copy ---
const files = listSource();
const big = files.filter(f => statSync(join(ROOT, f)).size > MAX_FILE);
if (big.length) { console.error('Files too large for GitHub (>95 MB):\n ' + big.join('\n ')); process.exit(1); }

// --- 2. secret scan (before writing anything) ---
const findings = [];
for (const f of files) {
  if (!TEXT.test(f) || statSync(join(ROOT, f)).size > 5e6) continue;
  const text = readFileSync(join(ROOT, f), 'utf8');
  for (const [label, rx] of SECRET_PATTERNS) if (rx.test(text)) findings.push(`${f}: ${label}`);
}
if (findings.length) { console.error('Secret scan failed — fix these before publishing:\n ' + findings.join('\n ')); process.exit(1); }

rmSync(TARGET, {recursive:true, force:true});
mkdirSync(TARGET, {recursive:true});
let bytes = 0;
for (const f of files) {
  const to = join(TARGET, f);
  mkdirSync(dirname(to), {recursive:true});
  cpSync(join(ROOT, f), to, {preserveTimestamps:true});
  bytes += statSync(to).size;
}
console.log(`Copied ${files.length} files (${(bytes/1e6).toFixed(1)} MB) to ${TARGET}; secret scan clean.`);

// --- 3. baseline reconstruction ---
// Package payloads <= 2.49, newest first. Each holds the files changed in that release.
const deployDir = join(ROOT, 'deploy');
const versionOf = name => { const m = name.match(/(\d+)\.(\d+)/); return m ? Number(`${m[1]}.${m[2]}`) : NaN; };
const payloads = existsSync(deployDir) ? readdirSync(deployDir, {withFileTypes:true})
  .filter(d => d.isDirectory() && versionOf(d.name) <= BASELINE_VERSION)
  .sort((a,b) => versionOf(b.name) - versionOf(a.name) || b.name.localeCompare(a.name))
  .map(d => existsSync(join(deployDir, d.name, 'payload')) ? join(deployDir, d.name, 'payload') : join(deployDir, d.name)) : [];
const BASE = TARGET + '.baseline'; // sibling folder, never published
rmSync(BASE, {recursive:true, force:true});
const report = {unchanged:0, fromPackage:0, created:[], unknown:[]};
for (const f of files) {
  const st = statSync(join(ROOT, f));
  let from = null;
  if (st.mtimeMs < ANNOUNCED) { from = join(ROOT, f); report.unchanged++; }
  else {
    const old = payloads.map(p => join(p, f)).find(p => existsSync(p));
    if (old) { from = old; report.fromPackage++; }
    else if ((st.birthtimeMs || st.mtimeMs) >= ANNOUNCED) { report.created.push(f); continue; }
    else { from = join(ROOT, f); report.unknown.push(f); } // conservative: counted as pre-existing
  }
  const to = join(BASE, f);
  mkdirSync(dirname(to), {recursive:true});
  cpSync(from, to);
}
const md = `# Hackathon baseline reconstruction

The project had no version control before the hackathon. The \`pre-hackathon\` tag is rebuilt from what
existed before the NEAR Hackathon announcement (2026-10-19 19:02 UTC); the last pre-announcement build is BETA 2.49
(built 2026-10-15). Method, per file in the published tree:

1. Last modified before the announcement → included unchanged (${report.unchanged} files).
2. Modified later, and an older copy exists in a deploy package ≤ 2.49 → that copy is used (${report.fromPackage} files).
3. Created after the announcement → not in the baseline; it is hackathon work (${report.created.length} files).
4. Modified later, created earlier, no older copy recoverable → **the current version is put in the baseline**,
   so the diff never claims old code as new. These changes are therefore *not* credited (${report.unknown.length} files).

Files in group 4:
${report.unknown.map(f => '- `' + f + '`').join('\n') || '- none'}
`;
writeFileSync(join(TARGET, 'HACKATHON_BASELINE.md'), md);
console.log(`Baseline: ${report.unchanged} unchanged, ${report.fromPackage} from packages, ${report.created.length} new, ${report.unknown.length} unrecoverable (kept as baseline).`);

// Old release payloads can contain credentials removed from today's tree.
// Check the reconstructed history before it can become a public Git commit.
const historicalFindings = [];
for (const f of walk(BASE)) {
  if (!TEXT.test(f) || statSync(f).size > 5e6) continue;
  const content = readFileSync(f, 'utf8');
  for (const [label, rx] of SECRET_PATTERNS) if (rx.test(content)) historicalFindings.push(`${posix(relative(BASE,f))}: ${label}`);
}
if (historicalFindings.length) { console.error('Historical baseline secret scan failed:\n ' + historicalFindings.join('\n ')); process.exit(1); }

// --- 4. git ---
if (WITH_GIT) {
  const git = (...a) => execFileSync('git', a, {cwd:TARGET, stdio:'inherit'});
  git('init', '-q', '-b', 'main');
  // First commit: the reconstructed baseline as the work tree.
  execFileSync('git', ['--work-tree', BASE, 'add', '-A'], {cwd:TARGET, stdio:'inherit'});
  git('commit', '-q', '-m', 'Pre-hackathon baseline (reconstructed BETA 2.49, before 2026-10-19 19:02 UTC)\n\nSee HACKATHON_BASELINE.md for the reconstruction method.');
  git('tag', 'pre-hackathon');
  // Second commit: the current tree.
  git('add', '-A');
  git('commit', '-q', '-m', 'Hackathon submission: NEAR market, AI merchants, ranked PvP and judge demo');
  git('tag', 'hackathon-submission');
  console.log('Git ready: tags pre-hackathon and hackathon-submission. Nothing pushed.');
  console.log('Diff: git diff --stat pre-hackathon hackathon-submission');
}
