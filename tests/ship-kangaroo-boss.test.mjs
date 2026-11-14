import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {SHIP_MODULES} from '../src/lib/clanShipPreview.js';
import {getShipBossName} from '../src/lib/shipBattleText.js';
import {getShipBossPortrait,isShipBossReleased} from '../src/lib/shipBossPresentation.js';
import {ensureShip,openShipFight,attackShipFight} from '../server/utils/clanShip.js';

test('third ship boss keeps the hangar identity and shared six-million-HP combat',()=>{
 const clan={id:'kangaroo-test',name:'Test'},ship=ensureShip(clan);
 for(const module of SHIP_MODULES.slice(0,3))ship.progress[module.id]=module.cost;
 ship.kills.engine=1;
 const player={id:'fighter',created_by:'fighter@test',nickname:'Fighter',level:80,talent_tree_version:2,talent_levels:{},inventory_items:[],equipped_items:{},weapon_inventory:{'large-poison':10},weapon_cooldowns:{}};
 const now=Date.parse('2026-10-29T12:00:00Z');
 const opened=openShipFight(clan,player,{requestId:'kangaroo-open-0001',moduleId:'hangar'},now);
 assert.equal(ship.fights.hangar.boss_id,'ship-hangar');
 assert.equal(ship.fights.hangar.max_hp,6000000);
 const body={requestId:'kangaroo-attack-0001',moduleId:'hangar',fightId:opened.fightId,weaponId:'c4',multiplier:5};
 const first=attackShipFight(clan,player,[player],body,{now,rng:()=>.99});
 assert(first.damage>0);assert.equal(player.weapon_inventory['large-poison'],5);
 const replay=attackShipFight(clan,player,[player],body,{now,rng:()=>.99});
 assert.equal(replay.damage,first.damage);assert.equal(player.weapon_inventory['large-poison'],5);
 assert.equal(ship.fights.hangar.current_hp,6000000-first.damage);
});

test('hangar has localized identity and artwork while future sectors remain unreleased',()=>{
 assert(isShipBossReleased('hangar'));assert(!isShipBossReleased('core'));
 assert.match(getShipBossName('hangar','uk'),/Орбітальний/ );
 assert.match(getShipBossName('hangar','ru'),/Орбитальный/);
 assert.match(getShipBossName('hangar','en'),/Orbital/);
 assert.equal(getShipBossPortrait('hangar'),'/ship-kangaroo-boss/portrait-card.webp');
});

test('production scene dependencies are self-contained and every declared asset exists',async()=>{
 const base=path.resolve('public/ship-kangaroo-boss');
 for(const name of ['scene.html','scene.js','background-animation.js','weapon-plasma-field.js']){
  const source=await fs.readFile(path.join(base,name),'utf8');
  assert(!source.includes('/output/'));assert(!source.includes('/src/'));
  for(const match of source.matchAll(/['"]([^'"\s]+\.webp)(?:\?[^'"]*)?['"]/g))await fs.access(path.join(base,match[1]));
 }
 const clouds=JSON.parse(await fs.readFile(path.join(base,'clouds.json'),'utf8'));
 for(const cloud of clouds)await fs.access(path.join(base,cloud.id+'.webp'));
});
