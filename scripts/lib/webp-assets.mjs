import { readdir, mkdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const RASTER_EXTENSION = /\.(png|jpe?g|gif)$/i;
const pending = new Map();

// Preserve existing PNG cache names; avoid collisions with foo.png/foo.gif.
export function webpName(filename) {
  return /\.png$/i.test(filename) ? filename.replace(/\.png$/i, '.webp') : `${filename}.webp`;
}

export async function listRasters(directory, excludedDirectory = null) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (file === excludedDirectory) continue;
    if (entry.isDirectory()) result.push(...await listRasters(file, excludedDirectory));
    else if (entry.isFile() && RASTER_EXTENSION.test(file)) result.push(file);
  }
  return result;
}

export function deliveryDimension(source) {
  const name = source.replaceAll('\\', '/');
  if (/\/ui\/energy(?:\+\d+)?\.png$/i.test(name)) return 256;
  if (/\/roulette\/reward_[^/]+\.png$/i.test(name)) return 512;
  if (/\/(?:nav|flags|daily-icons|COSMOFISH)\//i.test(name)) return 256;
  if (/\/(?:box|skills|guide)\//i.test(name)) return 512;
  if (/\/IVENTS\//i.test(name)) return 960;
  return 1280;
}

export async function optimizeRaster(source, output, maxDimension = deliveryDimension(source)) {
  if (pending.has(output)) return pending.get(output);
  const work = (async () => {
    const [input, cached] = await Promise.all([
      stat(source).catch((error) => { if (error.code !== 'ENOENT') throw error; return null; }),
      stat(output).catch((error) => { if (error.code !== 'ENOENT') throw error; return null; }),
    ]);
    if (cached && (!input || cached.mtimeMs >= input.mtimeMs)) {
      const metadata = await sharp(await readFile(output), { animated: true }).metadata();
      if (!input || (metadata.width <= maxDimension && (metadata.pageHeight || metadata.height) <= maxDimension)) return { cached: true };
    }
    if (!input) throw new Error(`Missing source image and WebP cache: ${source}`);
    await mkdir(path.dirname(output), { recursive: true });
    await sharp(source, { animated: true })
      .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 100, effort: 4 })
      .toFile(output);
    return { cached: false };
  })();
  pending.set(output, work);
  try { return await work; } finally { pending.delete(output); }
}
