import path from 'node:path';
import sharp from 'sharp';

const folder = 'src/assets/hero/hereearlypet';
const layers = ['hvost', 'legs', 'telo', 'antena', 'fire', 'ochky', 'zub'];
for (const name of layers) {
  await sharp(path.join(folder, `hereearlypet-${name}.png`)).trim({ threshold: 0 }).webp({ lossless: true }).toFile(path.join(folder, `${name}.webp`));
}
const composite = await sharp({ create: { width: 500, height: 896, channels: 4, background: '#00000000' } })
  .composite(layers.map(name => ({ input: path.join(folder, `hereearlypet-${name}.png`) }))).png().toBuffer();
await sharp(composite).webp({ lossless: true }).toFile(path.join(folder, 'hereearlypet.webp'));
await sharp(composite).trim({ threshold: 0 }).resize({ width: 240 }).webp({ quality: 95 }).toFile(path.join(folder, 'hereearlypet-icon.webp'));
console.log('Prepared seven trimmed pet layers, full art and inventory icon. Original PNGs preserved.');
const { data: firePixels, info: fireInfo } = await sharp(path.join(folder, 'fire.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < firePixels.length; i += 4) {
  const [r, g, b, a] = firePixels.subarray(i, i + 4);
  const coverage = Math.max(0, Math.min(1, (r - 140) / 45, (g - 60) / 45, (130 - b) / 45));
  firePixels[i] = firePixels[i + 1] = firePixels[i + 2] = 255;
  firePixels[i + 3] = Math.round(a * coverage);
}
await sharp(firePixels, { raw: { width: fireInfo.width, height: fireInfo.height, channels: 4 } }).webp({ lossless: true }).toFile(path.join(folder, 'fire-interior-mask.webp'));
for (const name of layers) console.log(name, await sharp(path.join(folder, `${name}.webp`)).metadata().then(({width,height})=>({width,height})));
