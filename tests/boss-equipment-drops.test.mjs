import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';
import { calculateBossReward } from '../src/lib/bossRewardSystem.js';

const server = fs.readFileSync(new URL('../server/app.js', import.meta.url), 'utf8');
function source(name) {
  const start = server.indexOf(`function ${name}(`);
  assert.ok(start >= 0);
  return server.slice(start, server.indexOf('\n}', start) + 2);
}
const runtime = vm.createContext({ GAME_CONFIG, Math, randInt: () => 250, getBossPetPool: () => [], BOSS_BACKGROUND_REWARDS: {} });
vm.runInContext(['getBossEquipmentSetItemIds', 'getOwnedEquipmentItemIds', 'resolveBossEquipmentDrop', 'getBossPetPool', 'getOwnedPetIds', 'resolveBossPetDrop', 'getBossSpecialKinds'].map(source).join('\n'), runtime);

test('Glista set is eligible for gear rolls and all six pieces can be awarded without duplicates', () => {
  const player = { inventory_items: [], equipped_items: {} };
  assert.ok(runtime.getBossSpecialKinds(player, 'boss4').includes('gear'));
  const reward = calculateBossReward({ bossId: 'boss4', maxHp: 100000, actualDamageTotal: 100000, rank: 1, availableSpecials: runtime.getBossSpecialKinds(player, 'boss4'), rng: () => 0 });
  assert.ok(reward.drops.some(drop => drop.type === 'boss_gear_piece'));
  for (let i = 0; i < 6; i++) {
    const drop = runtime.resolveBossEquipmentDrop(player, 'boss4');
    assert.equal(drop.type, 'equipment');
    assert.ok(drop.itemId.startsWith('set4_'));
    assert.ok(!player.inventory_items.some(item => item.id === drop.itemId));
    player.inventory_items.push({ id: drop.itemId });
  }
  assert.equal(new Set(player.inventory_items.map(item => item.id)).size, 6);
  assert.equal(runtime.resolveBossEquipmentDrop(player, 'boss4').source, 'full_set_duplicate_fallback');
  assert.equal(runtime.getBossEquipmentSetItemIds('boss6').length, 6);
  assert.equal(runtime.getBossEquipmentSetItemIds('boss7').length, 6);
});

test('Worm pet is rollable and existing Gum Blob owners get duplicate fallback', () => {
 const p={inventory_items:[],equipped_items:{}};
 assert.ok(runtime.getBossSpecialKinds(p,'boss4').includes('pet'));
 assert.deepEqual([...runtime.getBossPetPool('boss4')],['pet5']);
 assert.equal(runtime.resolveBossPetDrop(p,'boss4').petId,'pet5');
 p.inventory_items=[{id:'pet5',slot:'pet'}];
 assert.equal(runtime.resolveBossPetDrop(p,'boss4').source,'all_boss_pets_owned_fallback');
 p.inventory_items=[];p.equipped_items.pet='pet5';
 assert.equal(runtime.resolveBossPetDrop(p,'boss4').type,'tentacles');
 assert.deepEqual([...runtime.getBossPetPool('heli')],['pet-bot']);
 assert.deepEqual([...runtime.getBossPetPool('boss7')],['pet-purrgulp']);
});

test('Shork drops Junk Skunk and duplicate pets fall back to currency',()=>{
 assert.ok(runtime.getBossSpecialKinds({},'chinook').includes('pet'));
 assert.equal(runtime.resolveBossPetDrop({},'chinook').petId,'pet-skunk');
 assert.equal(runtime.resolveBossPetDrop({inventory_items:[{id:'pet-skunk',slot:'pet'}]},'chinook').type,'tentacles');
});
