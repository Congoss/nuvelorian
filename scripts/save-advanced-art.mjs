import sharp from 'sharp';
import fs from 'node:fs/promises';
const names={1:'85f2b0b2-e5d9-42bb-9cd6-fef06b6d268c',2:'331efe57-c7c3-4d4e-b54e-f099d5ab1808',3:'b3b7a58f-63d9-4605-a6dc-c1f90e45f30b',4:'bead22eb-1af7-4090-9ae1-5e204f592482',5:'09cf4ad3-380c-47d6-ae00-db9ce8cbd693',6:'509bf4f8-8332-4c5f-b813-5176a1a35b6f',7:'58eee4c7-9380-405b-a4d8-1be22b55bb9d',8:'1a5073ea-7ea1-495e-8ba1-1b0bf835dee1',9:'a51ff290-e697-4183-8567-2afb0d098ac7',10:'ff0567d5-9779-41d0-91d3-6a05dafe6d6d'};
await fs.mkdir('public/skills/advanced',{recursive:true});await fs.mkdir('docs/art/advanced-talents',{recursive:true});
for(const [id,name]of Object.entries(names)){
 const source=`C:/Users/admin/.codex/generated_images/01a1a214-6b37-79a0-9567-5f635a4c2dbf/exec-${name}.png`;
 await fs.copyFile(source,`docs/art/advanced-talents/a${id.padStart(2,'0')}.png`);
 await sharp(source).resize(640,384,{fit:'cover'}).webp({quality:85}).toFile(`public/skills/advanced/a${id.padStart(2,'0')}.webp`);
}
console.log('Saved 10 talent illustrations and originals');
