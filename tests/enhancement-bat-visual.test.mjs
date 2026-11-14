import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {weaponEnhancementVisual} from '../src/lib/weaponEnhancementVisuals.js';
const source=fs.readFileSync('src/components/game/EnhancementBat.jsx','utf8').replaceAll('\r','');
const start=source.indexOf('export function enhancementBatVisual'),end=source.indexOf('export default function',start);
const context=vm.createContext({weaponEnhancementVisual});vm.runInContext(source.slice(start,end).replace('export function','function')+'globalThis.visual=enhancementBatVisual;',context);
test('bat grows continuously from +4 to +15 with increasing aura and stronger +12/+15 embers',()=>{
 let previous=0;for(let level=4;level<=15;level++){const v=context.visual(level);assert(v.size>previous);assert.equal(v.color,weaponEnhancementVisual(level).color);previous=v.size;}
 assert.equal(context.visual(4).size,.68);assert.equal(context.visual(15).size,1);
 const levels=[4,6,8,10,12,15];for(let i=1;i<levels.length;i++){const a=context.visual(levels[i-1]),b=context.visual(levels[i]);assert(b.aura[1]>a.aura[1]);assert(b.aura[3]>a.aura[3]);}
 assert(context.visual(15).emberBoost>context.visual(12).emberBoost);assert(context.visual(12).emberBoost>context.visual(10).emberBoost);
});
