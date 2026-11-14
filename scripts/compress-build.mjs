import { readdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { brotliCompress, gzip, constants } from 'node:zlib';
import path from 'node:path';

const br = promisify(brotliCompress);
const gz = promisify(gzip);
let before = 0;
let after = 0;
const distRoot = process.argv[2] || 'dist';
for (const name of await readdir(distRoot, { recursive: true })) {
  if (!/\.(js|css|html|svg|json)$/.test(name)) continue;
  const file = path.join(distRoot, name);
  const data = await readFile(file);
  if (data.length < 1024) continue;
  const [brotli, zipped] = await Promise.all([br(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } }), gz(data, { level: 9 })]);
  await Promise.all([writeFile(file + '.br', brotli), writeFile(file + '.gz', zipped)]);
  before += data.length;
  after += brotli.length;
}
console.log(`JS/CSS/text delivery: ${before} -> ${after} bytes (Brotli)`);
