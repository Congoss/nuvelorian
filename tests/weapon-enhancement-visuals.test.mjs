import test from 'node:test';
import assert from 'node:assert/strict';
import {weaponEnhancementVisual,weaponCanvasTransform} from '../src/lib/weaponEnhancementVisuals.js';
import {isWeaponArtLayer} from '../src/components/game/weaponEnhancementContext.js';
test('no glow before +4; intermediate levels retain the previous effect with a slight boost',()=>{
 for(const level of [0,1,2,3,-1,undefined])assert.equal(weaponEnhancementVisual(level),null);
 for(const [level,expected] of [[4,4],[5,4],[6,6],[7,6],[8,8],[9,8],[10,10],[11,10],[12,12],[13,12],[14,12],[15,15],[99,15]])assert.equal(weaponEnhancementVisual(level).level,expected);
 assert(weaponEnhancementVisual(7).intensity>weaponEnhancementVisual(6).intensity);
 assert.equal(weaponEnhancementVisual(15).halo,'#e4ae39');
 assert(weaponEnhancementVisual(15).density<=20);
});
test('padding expands the canvas without moving or scaling the weapon effect',()=>{
 const normal=weaponCanvasTransform(300,500,'0 0 500 896');
 const padded=weaponCanvasTransform(364,564,'0 0 500 896',32);
 assert.equal(padded.scale,normal.scale);
 assert.equal(padded.x-32,normal.x);assert.equal(padded.y-32,normal.y);
});
test('weapon-only and combined weapon layers get enhancement; unrelated armor and gloves do not',()=>{
 for(const label of ['Hero weapon','Hero back weapon','Set 2 gloves with first weapon','NUVELOR weapon'])assert(isWeaponArtLayer(label));
 for(const label of ['Set 4 armor over weapon combinations','Selected gloves with Set 5 weapon','Set 1 gloves over NUVELOR weapon combo','Set 5 cyan laser','Hero bracers'])assert.equal(isWeaponArtLayer(label),false,label);
});
