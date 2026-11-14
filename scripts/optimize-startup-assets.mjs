import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const root = process.cwd();
const outputDir = path.join(root, 'src', 'assets', 'optimized');

// These are delivery copies only. Original PNG artwork remains untouched.
const assets = [
  { input: 'src/assets/ui/cosmohand.png', output: 'cosmohand.webp', width: 192, quality: 88 },
  { input: 'src/assets/ui/paper.png', output: 'paper.webp', width: 192, quality: 88 },
  { input: 'public/assets/loading.png', output: 'loading.webp', width: 720, quality: 82 },
  { input: 'src/assets/ui/level.png', output: 'level.webp', width: 192, quality: 88 },
  { input: 'src/assets/nav/bosses.png', output: 'nav-bosses.webp', width: 128, quality: 88 },
  { input: 'src/assets/nav/quests-nav.png', output: 'nav-quests.webp', width: 128, quality: 88 },
  { input: 'src/assets/nav/hero.png', output: 'nav-hero.webp', width: 128, quality: 88 },
  { input: 'src/assets/nav/inventory.png', output: 'nav-inventory.webp', width: 128, quality: 88 },
  { input: 'src/assets/nav/clans.png', output: 'nav-clans.webp', width: 128, quality: 88 },
];

await mkdir(outputDir, { recursive: true });
for (const asset of assets) {
  await sharp(path.join(root, asset.input), { animated: false })
    .resize({ width: asset.width, withoutEnlargement: true })
    .webp({ quality: asset.quality, smartSubsample: true })
    .toFile(path.join(outputDir, asset.output));
}
