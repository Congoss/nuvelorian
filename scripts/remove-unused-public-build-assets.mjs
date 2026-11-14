import { readdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { listRasters, webpName } from './lib/webp-assets.mjs';

const publicRoot = path.resolve('public');
const distRoot = path.resolve(process.argv[2] || 'dist');
const entries = await readdir(distRoot, { recursive: true });
const textFiles = entries.filter((name) => /\.(js|css|html|json)$/i.test(name));
const runtimeText = (await Promise.all(textFiles.map((name) => readFile(path.join(distRoot, name), 'utf8')))).join('\n');
let removed = 0;
for (const source of await listRasters(publicRoot)) {
  const relative = path.relative(publicRoot, source).replaceAll('\\', '/');
  if (/^referral-card(?:-v2)?\.jpg$/.test(relative)) continue; // Telegram preview image is referenced by server HTML.
  const target = path.resolve(distRoot, relative);
  const withinDist = path.relative(distRoot, target);
  if (withinDist.startsWith('..') || path.isAbsolute(withinDist)) throw new Error('Invalid build asset path');
  await stat(webpName(target)); // Never remove an original without its delivery copy.
  if (runtimeText.includes(relative) || runtimeText.includes(encodeURI(relative))) {
    throw new Error(`Production still references original raster: ${relative}`);
  }
  await rm(target, { force: true });
  removed += 1;
}
console.log(`Removed ${removed} original raster build copies; source artwork is preserved.`);
