import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
const root = 'src/assets/hero/bp leg set';
const output = 'src/assets/optimized/bp-legendary-glow';
await mkdir(output, { recursive: true });
for (const slot of ['armor', 'boots', 'legs', 'head', 'hands']) {
  const source = `${root}/setbp2-${slot}${slot === 'hands' ? '' : '-anim'}.png`;
  const target = `${output}/${slot}.webp`;
  const cached = await stat(target).catch(() => null);
  if (cached && cached.mtimeMs >= (await stat(source)).mtimeMs) continue;
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    // Bake the existing SVG color matrix and SourceAlpha composite into pixels.
    const alpha = Math.max(0, Math.min(255, 2.5 * data[i] - 2 * data[i + 1] - .5 * data[i + 2]));
    data[i + 3] = Math.round(data[i + 3] * alpha / 255);
    data[i] = 255; data[i + 1] = 92; data[i + 2] = 5;
  }
  await sharp(data, { raw: info }).blur(1.2).webp({ quality: 84, alphaQuality: 100 }).toFile(target);
}
