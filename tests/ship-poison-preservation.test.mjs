import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureShip,openShipFight,attackShipFight} from '../server/utils/clanShip.js';
for(const count of [5,10,100])test('x'+count+' rolls preservation per dose and can save multiple doses',()=>{
 const clan={id:'c',name:'C'},ship=ensureShip(clan);ship.progress.hull=100000000;
 const player={id:'p',created_by:'p@test',nickname:'P',level:80,talent_tree_version:2,talent_levels:{t34:50},inventory_items:[],equipped_items:{},weapon_inventory:{'large-poison':1000},weapon_cooldowns:{}};
 const now=Date.parse('2026-10-29T12:00:00Z'),opened=openShipFight(clan,player,{moduleId:'hull',requestId:'preserve-open-request'},now);
 let rolls=0;const saved=2;
 attackShipFight(clan,player,[player],{moduleId:'hull',fightId:opened.fightId,requestId:'preserve-hit-request',weaponId:'c4',multiplier:count},{now,rng:()=>rolls++<saved?.1:.9});
 assert.equal(rolls,count);assert.equal(player.weapon_inventory['large-poison'],1000-count+saved);
});
