import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { APP_VERSION } from '../src/lib/appVersion.js';

const root = process.cwd();
const stage = path.resolve(process.argv[2] || `deploy/patch-${APP_VERSION}`);
if (stage === root || !stage.startsWith(path.join(root, 'deploy') + path.sep)) throw new Error('Stage must be inside deploy/');
if (fs.existsSync(stage)) throw new Error('Stage already exists');
const release = JSON.parse(fs.readFileSync(`releases/${APP_VERSION}.json`, 'utf8'));
if (release.version !== APP_VERSION) throw new Error('Release version mismatch');
if (JSON.parse(fs.readFileSync('dist/release-version.json', 'utf8')).version !== APP_VERSION) throw new Error('Build this version before packaging');
fs.mkdirSync(stage, { recursive: true });
// One stable set of support files; never copy historical INSTALL/PATCH files.
for (const name of ['dist', 'src', 'server']) fs.cpSync(name, path.join(stage, name), {
  recursive: true,
  // Source artwork is already compiled into dist and is not needed by Node.
  filter: source => !path.relative(root, path.resolve(source)).replaceAll('\\', '/').match(/^src\/assets(?:\/|$)/),
});
for (const name of ['package.json', 'package-lock.json']) fs.copyFileSync(name, path.join(stage, name));
fs.mkdirSync(path.join(stage, 'releases'), { recursive: true });
fs.writeFileSync(path.join(stage, 'releases', APP_VERSION + '.json'), JSON.stringify(release, null, 2));
fs.mkdirSync(path.join(stage, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(stage, 'tmp/restart.txt'), APP_VERSION + '\n');
const announcementNote = release.announce === false
  ? 'This release has no public patch log, announcement or release reward. Obsolete patch-document cleanup runs automatically after all packaged files match.'
  : 'The release announcement and obsolete patch-document cleanup run automatically after all packaged files match. Players claim the release reward under the world-chat patch log.';
fs.writeFileSync(path.join(stage, 'INSTALL.txt'), `PLANET4 ${APP_VERSION}\nMerge archive contents into the application directory, preserving .env, runtime data and dependencies. Restart the Node application after extraction completes. ${announcementNote} No gift mail is included.\n`);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push({ path: path.relative(stage, file).replaceAll('\\', '/'), sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
  }
}
walk(stage);
// Only immutable application files gate activation; restart markers and operator
// notes may legitimately be changed by hosting tools.
const installed = { ...release, files: files.filter(f => /^(dist|src|server)\//.test(f.path) || /^package(?:-lock)?\.json$/.test(f.path)) };
fs.writeFileSync(path.join(stage, 'releases/installed.json'), JSON.stringify(installed, null, 2));
fs.writeFileSync(path.join(stage, 'MANIFEST.json'), JSON.stringify(files, null, 2));
console.log(`Prepared ${APP_VERSION}: ${files.length} files; no messages or gifts sent.`);
