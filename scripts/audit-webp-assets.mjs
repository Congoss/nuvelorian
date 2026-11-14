import { readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { listRasters, webpName } from './lib/webp-assets.mjs';

const assetsRoot = path.resolve('src/assets');
const sources = await listRasters(assetsRoot, path.join(assetsRoot, 'optimized'));
const publicSources = await listRasters(path.resolve('public'));
const pairs = [
  ...sources.map((source) => [source, path.join(assetsRoot, 'optimized/all', webpName(path.relative(assetsRoot, source)))]),
  ...publicSources.map((source) => [source, webpName(source)]),
];
let inputBytes = 0;
let outputBytes = 0;
const errors = [];
const animations = [];
for (const [source, output] of pairs) {
  const input = await sharp(source, { animated: true }).metadata();
  const result = await sharp(output, { animated: true }).metadata();
  inputBytes += (await stat(source)).size;
  outputBytes += (await stat(output)).size;
  const sourceHeight = input.pageHeight || input.height;
  const outputHeight = result.pageHeight || result.height;
  const expectedHeight = sourceHeight * result.width / input.width;
  if (Math.abs(outputHeight - expectedHeight) > 1.5) errors.push(`Canvas aspect ratio changed: ${source}`);
  if (input.hasAlpha && !result.hasAlpha) errors.push(`Alpha channel lost: ${source}`);
  if ((input.pages || 1) > 1) {
    let expectedDelays = input.delay;
    if (input.pages !== result.pages) {
      // WebP merges identical consecutive GIF frames without changing timing.
      const frames = [];
      for (let page = 0; page < input.pages; page += 1) {
        const bytes = await sharp(source, { page, pages: 1 }).ensureAlpha().raw().toBuffer();
        const hash = createHash('sha256').update(bytes).digest('hex');
        if (frames.at(-1)?.hash === hash) frames.at(-1).delay += input.delay[page];
        else frames.push({ hash, delay: input.delay[page] });
      }
      expectedDelays = frames.map((frame) => frame.delay);
    }
    if (JSON.stringify(expectedDelays) !== JSON.stringify(result.delay) || input.loop !== result.loop) errors.push(`Animation timing changed: ${source}`);
    animations.push({ file: path.relative(assetsRoot, source), sourceFrames: input.pages, webpFrames: result.pages, durationMs: result.delay?.reduce((sum, delay) => sum + delay, 0) });
  }
}
const productionOriginals = (await readdir(path.resolve('dist'), { recursive: true })).filter((file) => /\.(png|jpe?g|gif)$/i.test(file));
// Telegram inline-photo and OG previews require the JPEG URLs served by the API.
const telegramPreviews = productionOriginals.filter(file => /^referral-card(?:-v2)?\.jpg$/.test(file));
errors.push(...productionOriginals.filter(file => !telegramPreviews.includes(file)).map((file) => `Original raster shipped: ${file}`));
console.log(JSON.stringify({ checked: pairs.length, sourceMiB: inputBytes / 1048576, webpMiB: outputBytes / 1048576, savedPercent: (1 - outputBytes / inputBytes) * 100, animations, productionOriginals, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
