import sharp from 'sharp';
const p='public/local-enhancement/user-press-source-v4.png';
await sharp(p).extract({left:430,top:378,width:65,height:98}).webp({quality:95}).toFile('public/local-enhancement/user-press-shaft-v5.webp');
const mask=Buffer.from('<svg width="1672" height="940" xmlns="http://www.w3.org/2000/svg"><path fill="white" fill-rule="evenodd" d="M0 320H326V585H0Z M43 365H258V525H43Z"/></svg>');
await sharp(p).composite([{input:mask,blend:'dest-in'}]).webp({quality:95}).toFile('public/local-enhancement/user-press-slot-frame-v5.webp');
