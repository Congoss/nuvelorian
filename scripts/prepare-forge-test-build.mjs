import fs from 'node:fs';import path from 'node:path';
const base='.local/build-3.14',out='.local/build-3.15-forge-test';
if(fs.existsSync(out))throw Error('Build directory exists');
fs.mkdirSync(out,{recursive:true});
for(const folder of ['src','server','public','scripts','tests'])fs.cpSync(base+'/'+folder,out+'/'+folder,{recursive:true});
for(const file of fs.readdirSync(base))if(fs.statSync(base+'/'+file).isFile())fs.copyFileSync(base+'/'+file,out+'/'+file);
fs.symlinkSync(path.resolve('node_modules'),out+'/node_modules','junction');
const files=['src/pages/ClanShipPreview.jsx','src/components/game/ShipForge.jsx','src/components/game/EnhancementDemo.jsx','src/components/game/GumWelder.jsx','src/components/game/enhancementDemo.css','src/components/game/shipForgeReference.css','server/utils/enhancementDemo.js','tests/enhancement-demo.test.mjs'];
for(const f of files){fs.mkdirSync(path.dirname(out+'/'+f),{recursive:true});fs.copyFileSync(f,out+'/'+f)}
fs.mkdirSync(out+'/public/local-enhancement',{recursive:true});
for(const name of ['forge-reference-body.webp','forge-reference-left.webp','forge-reference-right.webp','press-smoke-v6.webp','forge-wall-user.webp','gums.webp','premium-packs.webp'])fs.copyFileSync('public/local-enhancement/'+name,out+'/public/local-enhancement/'+name);
// Only the forge service positioning and modal styles, no unrelated ship layout changes.
const css=fs.readFileSync('src/pages/ClanShipScene.css','utf8');fs.appendFileSync(out+'/src/pages/ClanShipScene.css','\n'+css.slice(css.indexOf('.ship-forge-overlay')));
fs.writeFileSync(out+'/src/lib/appVersion.js',"export const APP_VERSION = '3.15';\nexport const APP_VERSION_LABEL = `BETA ${APP_VERSION}`;\n");
fs.writeFileSync(out+'/forge-source-files.json',JSON.stringify([...files,'src/pages/ClanShipScene.css','src/lib/appVersion.js'],null,2));
console.log('Isolated test stage prepared');
