import path from 'node:path';
import { listRasters, optimizeRaster, webpName } from './lib/webp-assets.mjs';

const publicRoot = path.resolve('public');
const files = await listRasters(publicRoot);
for (const source of files) {
  const relative = path.relative(publicRoot, source).replaceAll('\\', '/');
  const maxDimension = relative.startsWith('skills/') ? 256 : relative === 'assets/loading.png' ? 720 : 1280;
  await optimizeRaster(source, webpName(source), maxDimension);
}
console.log(`Public WebP cache: ${files.length} source images checked`);
