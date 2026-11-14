import { readFile, writeFile, mkdir } from 'node:fs/promises';

const source = await readFile('src/assets/IVENTS/backgr_cosmofish.mp4');
const atoms = [];
for (let offset = 0; offset < source.length;) {
  const size = source.readUInt32BE(offset);
  if (size < 8 || offset + size > source.length) throw new Error('Unsupported MP4 atom');
  atoms.push({ type: source.toString('ascii', offset + 4, offset + 8), offset, data: source.subarray(offset, offset + size) });
  offset += size;
}
const moov = atoms.find((atom) => atom.type === 'moov');
const mdat = atoms.find((atom) => atom.type === 'mdat');
if (!moov || !mdat) throw new Error('MP4 metadata or frames missing');
let output = source;
if (moov.offset > mdat.offset) {
  const metadata = Buffer.from(moov.data);
  const containers = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);
  const rewrite = (start, end) => {
    for (let offset = start; offset < end;) {
      const size = metadata.readUInt32BE(offset);
      if (size < 8 || offset + size > end) throw new Error('Invalid MP4 metadata');
      const type = metadata.toString('ascii', offset + 4, offset + 8);
      if (type === 'stco' || type === 'co64') {
        const count = metadata.readUInt32BE(offset + 12);
        const stride = type === 'stco' ? 4 : 8;
        if (offset + 16 + count * stride > offset + size) throw new Error('Invalid MP4 offsets');
        for (let i = 0; i < count; i++) {
          const position = offset + 16 + i * stride;
          const old = type === 'stco' ? metadata.readUInt32BE(position) : Number(metadata.readBigUInt64BE(position));
          const adjusted = old >= mdat.offset && old < moov.offset ? old + metadata.length : old;
          if (type === 'stco') metadata.writeUInt32BE(adjusted, position);
          else metadata.writeBigUInt64BE(BigInt(adjusted), position);
        }
      } else if (containers.has(type)) rewrite(offset + 8, offset + size);
      offset += size;
    }
  };
  rewrite(0, metadata.length);
  const parts = [];
  for (const atom of atoms) {
    if (atom === moov) continue;
    if (atom === mdat) parts.push(metadata);
    parts.push(atom.data);
  }
  output = Buffer.concat(parts);
}
await mkdir('src/assets/optimized/video', { recursive: true });
await writeFile('src/assets/optimized/video/cosmofish.mp4', output);
console.log('Fishing MP4: metadata moved ahead of frames; encoded video preserved');
