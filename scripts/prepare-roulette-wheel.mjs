import sharp from 'sharp';
import { ROULETTE_WHEEL_SECTOR_ORDER } from '../src/lib/rouletteRewards.js';

// Preserve sector order and alignment while flattening the rotating layers.
for (const event of [false, true]) {
  const layers = ROULETTE_WHEEL_SECTOR_ORDER.map(id => ({
    input: `src/assets/roulette/${id === 'reward_nothing' ? event ? 'reward_free_spin-pump' : 'reward_free_spin' : id}.png`,
  }));
  await sharp({ create: { width: 1254, height: 1254, channels: 4, background: '#00000000' } })
    .composite(layers).png().toBuffer()
    .then(buffer => sharp(buffer).resize(680, 680).webp({ quality: 88 })
      .toFile(`src/assets/optimized/all/roulette/wheel${event ? '-halloween' : ''}.webp`));
}
