import fs from 'node:fs';import path from 'node:path';
const flat=(o,p='',r={})=>{for(const[k,v]of Object.entries(o)){const n=p?p+'.'+k:k;if(v&&typeof v==='object')flat(v,n,r);else r[n]=v;}return r;};
const dictionaries=Object.fromEntries(['uk','ru','en'].map(l=>[l,flat(JSON.parse(fs.readFileSync('src/i18n/locales/'+l+'.json')))]));
const issues=[];let files=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory()){walk(file);continue;}if(!/\.(jsx|js)$/.test(file))continue;files++;const source=fs.readFileSync(file,'utf8');for(const match of source.matchAll(/\bt\(['"]([a-z][\w.-]+)['"]/g)){if(!match[1].includes('.')||match[1].endsWith('.'))continue;for(const l of Object.keys(dictionaries))if(!Object.hasOwn(dictionaries[l],match[1]))issues.push({file,line:source.slice(0,match.index).split('\n').length,language:l,key:match[1]});}}}
walk('src/components');walk('src/pages');
fs.mkdirSync('docs/audits',{recursive:true});
fs.writeFileSync('docs/audits/translations-20261027.json',JSON.stringify({files,keys:Object.fromEntries(Object.entries(dictionaries).map(([l,v])=>[l,Object.keys(v).length])),missingStaticKeys:issues,limitations:['Static key scan does not verify dynamic keys, inline translations, server-generated content or visual layout.','Unused legacy ShipConstructionDialog contains Ukrainian-only copy; not imported by current game.']},null,2)+'\n');
console.log(JSON.stringify({files,missingStaticKeys:issues.length,examples:issues.slice(0,8)}));
