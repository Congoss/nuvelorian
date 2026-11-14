import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {getBossMedalProgress} from '../src/lib/bossMedals.js';
const flatten=(o,p='',r={})=>{for(const [k,v]of Object.entries(o)){const key=p?p+'.'+k:k;if(v&&typeof v==='object')flatten(v,key,r);else r[key]=v;}return r;};
const locales=Object.fromEntries(['uk','ru','en'].map(l=>[l,flatten(JSON.parse(fs.readFileSync('src/i18n/locales/'+l+'.json','utf8')))]));
test('all three dictionaries have identical keys and interpolation placeholders',()=>{
 const placeholders=s=>[...String(s).matchAll(/{{(.*?)}}/g)].map(m=>m[1]).sort();
 for(const [language,strings]of Object.entries(locales)){
  assert.deepEqual(Object.keys(strings).sort(),Object.keys(locales.en).sort(),language);
  for(const [key,value]of Object.entries(strings)){assert.equal(typeof value,'string');assert(value.trim(),language+':'+key);assert.deepEqual(placeholders(value),placeholders(locales.en[key]),language+':'+key);}
 }
});
test('medal progress is localized at every threshold',()=>{
 for(const count of [0,10,50,100]){
  assert.match(getBossMedalProgress(count,'ru').label,/[а-я]/i);
  assert.match(getBossMedalProgress(count,'uk').label,/[а-яі]/i);
  assert.doesNotMatch(getBossMedalProgress(count,'en').label,/[а-яі]/i);
  assert.equal(getBossMedalProgress(count,'ua').label,getBossMedalProgress(count,'uk').label);
 }
});
