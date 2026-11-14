import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputDir = path.join(root, 'src', 'assets', 'optimized', 'camp');

const medalNames = [
  'bronze-bos1', 'silver-bos1', 'gold-bos1',
  'bronze-medal', 'silver-medal', 'gold-medal',
  'bronze-Moth', 'silver-moth', 'gold-moth',
  'bronze-Shork', 'silver-Shork', 'gold-Shork',
  'bronze-Worm', 'silver-worm', 'gold-Worm',
  'bronze-Sporgol', 'silver-Sporgol', 'gold-Sporgol',
  'bronze-Suckhole', 'silver-Suckhole', 'gold-Suckhole',
  'bronze-Shkraban', 'silver-Shkraban', 'gold-Shkraban',
];

const jobs = [
  ['hero-background.webp', 'src/assets/hero/background.png', 720, 84],
  ['friends.webp', 'src/assets/ui/friends.png', 128, 88],
  ['referral-banner.webp', 'src/assets/IVENTS/referral-banner.png', 720, 84],
  ['nav-leaderboard.webp', 'src/assets/nav/top-leaderboard.png', 128, 88],
  ['nav-daily.webp', 'src/assets/nav/daily.png', 128, 88],
  ['nav-card-game.webp', 'src/assets/nav/card-game.png', 128, 88],
  ['nav-world-boss.webp', 'src/assets/nav/world-boss.png', 128, 88],
  ['nav-hero.webp', 'src/assets/nav/ecip.png', 128, 88],
  ['nav-chat.webp', 'src/assets/nav/chat.png', 128, 88],
  ['nav-chat-plus.webp', 'src/assets/nav/chat+1.png', 128, 88],
  ...medalNames.map((name) => [`medal-${name}.webp`, `src/assets/boss-ui/${name}.png`, 192, 88]),
];

await mkdir(outputDir, { recursive: true });

for (const [outputName, inputName, width, quality, animated = false] of jobs) {
  const input = path.join(root, inputName);
  const output = path.join(outputDir, outputName);
  let source;
  try {
    source = await stat(input);
  } catch {
    console.warn(`${inputName}: source missing; keeping any existing optimized copy`);
    continue;
  }
  let existing = null;
  try { existing = await stat(output); } catch { /* Generate a missing output. */ }
  if (existing?.mtimeMs >= source.mtimeMs) {
    console.log(`${inputName}: cached (${(existing.size / 1024).toFixed(1)} KiB)`);
    continue;
  }
  const generated = await sharp(input, { animated })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(output)
    .then(() => stat(output));
  console.log(`${inputName}: ${(source.size / 1024).toFixed(1)} KiB -> ${(generated.size / 1024).toFixed(1)} KiB`);
}
