import sharp from 'sharp';

const root = 'public/ship-gum-queen';
const { data, info: { width, height } } = await sharp(`${root}/character.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const mask = await sharp(`${root}/contour-v5.svg`).ensureAlpha().raw().toBuffer();
const pixels = width * height;
const nearest = new Int32Array(pixels).fill(-1);
const queue = new Int32Array(pixels);
let end = 0;
for (let y = 2; y < height - 2; y++) {
  for (let x = 2; x < width - 2; x++) {
    const i = y * width + x;
    if ([0, -2, 2, -2 * width, 2 * width].every(offset => mask[(i + offset) * 4 + 3] === 255 && data[(i + offset) * 4 + 3] >= 250)) {
      nearest[i] = i;
      queue[end++] = i;
    }
  }
}
if (!end) throw new Error('No opaque interior pixels in Gum Queen texture');
for (let start = 0; start < end; start++) {
  const i = queue[start];
  const x = i % width;
  for (const next of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]) {
    if (next < 0 || next >= pixels || nearest[next] !== -1) continue;
    nearest[next] = nearest[i];
    queue[end++] = next;
  }
}
for (let i = 0; i < pixels; i++) {
  const offset = i * 4;
  const source = nearest[i] * 4;
  for (let channel = 0; channel < 3; channel++) data[offset + channel] = data[source + channel];
  data[offset + 3] = mask[offset + 3];
}
await sharp(data, { raw: { width, height, channels: 4 } }).webp({ lossless: true }).toFile(`${root}/character-edge-v6.webp`);

const posterWidth = 400;
const posterHeight = Math.round(posterWidth * height / width);
const character = await sharp(`${root}/character-edge-v6.webp`).resize(posterWidth, posterHeight).png().toBuffer();
const background = await sharp(`${root}/cartoon-garage.webp`).resize(posterWidth, posterHeight, { fit: 'fill' })
  .modulate({ brightness: 0.72, saturation: 0.88 }).png().toBuffer();
await sharp(background).composite([{ input: character }]).webp({ quality: 75 }).toFile(`${root}/battle-poster-v1.webp`);
