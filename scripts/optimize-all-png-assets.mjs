import path from 'node:path';
import { listRasters, optimizeRaster, webpName } from './lib/webp-assets.mjs';

const assetsRoot = path.resolve('src/assets');
const files = await listRasters(assetsRoot, path.join(assetsRoot, 'optimized'));
let generated = 0;
let cached = 0;
// Sequential conversion bounds memory use for large multi-frame GIFs.
for (const source of files) {
  const output = path.join(assetsRoot, 'optimized/all', webpName(path.relative(assetsRoot, source)));
  const result = await optimizeRaster(source, output);
  if (result.cached) cached += 1;
  else generated += 1;
}
console.log(`Raster WebP cache: ${generated} generated, ${cached} cached, ${files.length} total`);
