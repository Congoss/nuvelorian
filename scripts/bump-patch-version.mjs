import fs from 'node:fs';
const description=process.argv.slice(2).join(' ').trim();
if(!description)throw new Error('Usage: node scripts/bump-patch-version.mjs "Patch description"');
const file='src/lib/appVersion.js';let source=fs.readFileSync(file,'utf8');
const current=source.match(/APP_VERSION = '(\d+)\.(\d+)'/);if(!current)throw new Error('Version not found');
const nextPatch=Number(current[2])+1;
const next=String(Number(current[1])+Math.floor(nextPatch/100))+'.'+String(nextPatch%100).padStart(2,'0');
source=source.replace(current[0],"APP_VERSION = '"+next+"'");fs.writeFileSync(file,source);
fs.appendFileSync('PATCH_HISTORY.md','\n- BETA '+next+' · '+new Date().toISOString()+' · '+description+'\n');console.log('BETA '+next);
