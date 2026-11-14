import sharp from 'sharp';import fs from 'node:fs';
const source='C:/Users/admin/AppData/Local/Temp/codex-clipboard-3da3a7de-7caa-4399-ae4b-857057d54b4a.png';
const out='public/local-enhancement';fs.copyFileSync(source,out+'/user-press-source-v4.png');
const {width,height}=await sharp(source).metadata();
const left='M505 205H755V650H505Z',right='M907 205H1166V650H907Z';
const svg=paths=>Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`);
await sharp(source).composite([{input:svg(`<path d="${left} ${right}" fill="white"/>`),blend:'dest-out'}]).webp({quality:92}).toFile(out+'/user-press-body-v4.webp');
for(const [name,d]of [['left',left],['right',right]])await sharp(source).composite([{input:svg(`<path d="${d}" fill="white"/>`),blend:'dest-in'}]).webp({quality:92}).toFile(out+'/user-press-jaw-'+name+'-v4.webp');
