import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sources = JSON.parse(await fs.readFile(path.join(root, 'output/clan-ship/sprite-sources.json'), 'utf8'));
const out = path.join(root, 'public/clan-ship-preview');
await fs.mkdir(out, { recursive: true });
const metadata = {};
for (const [id, source] of Object.entries(sources)) {
  // Only remove transparent padding and resize; retain generated art and alpha.
  const pipeline = sharp(source);
  const original = await pipeline.metadata();
  if (id !== 'background' && !original.hasAlpha) throw new Error(`${id}: missing alpha`);
  const result = id === 'background'
    ? await pipeline.resize({ width: 1000, withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true })
    : await pipeline.trim({ background: '#00000000', threshold: 5 }).resize({ width: id.startsWith('worker') ? 320 : 800, height: 1000, fit: 'inside', withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true });
  await fs.writeFile(path.join(out, `${id}.png`), result.data);
  metadata[id] = { width: result.info.width, height: result.info.height, alpha: original.hasAlpha };
}
await fs.writeFile(path.join(out, 'dimensions.json'), JSON.stringify(metadata, null, 2));
console.log(metadata);
