import test from 'node:test';
import assert from 'node:assert/strict';
import { COLLECTION_REWARDS, getQuestCollectionDrops } from '../src/lib/questCollectionRewards.js';
import { applyPlayerAction } from '../server/utils/playerActions.js';

test('batch claims grant ten rewards, consume ten sets and reject insufficient or invalid counts', () => {
  for (const locationId of Object.keys(COLLECTION_REWARDS)) {
    const player={stat_strength:1,level:100,energy:0,max_energy:1000,collection_item_counts:Object.fromEntries(Array.from({length:7},(_,i)=>[`${locationId}-artifact-${i+1}`,11]))};
    applyPlayerAction(player,{type:'collection-claim',locationId,count:10});
    for (const drop of getQuestCollectionDrops(locationId)) {
      const field={strength:'stat_strength',spin:'roulette_bonus_spins'}[drop.type] || drop.type;
      assert.equal(drop.type==='weapon' ? player.weapon_inventory[drop.id] : player[field] - (field==='stat_strength' ? 1 : 0),drop.qty*10);
    }
    assert.equal(player.collection_rewards_claimed[locationId],10);
    assert.ok(Object.values(player.collection_item_counts).every(n=>n===1));
    for(const count of [10,0,-1,2,1.5,'10']) {
      const before=JSON.stringify(player);
      assert.throws(()=>applyPlayerAction(player,{type:'collection-claim',locationId,count}));
      assert.equal(JSON.stringify(player),before);
    }
    applyPlayerAction(player,{type:'collection-claim',locationId});
    assert.equal(player.collection_rewards_claimed[locationId],11);
  }
});

test('every location preview matches the exact resources and poisons actually granted', () => {
  for (const locationId of Object.keys(COLLECTION_REWARDS)) {
    const player = { level:100, energy:0, max_energy:1000, tentacles:0, stat_strength:1,
      collection_item_counts:Object.fromEntries(Array.from({length:7}, (_, i) => [`${locationId}-artifact-${i+1}`, 1])),
    };
    const drops = getQuestCollectionDrops(locationId);
    applyPlayerAction(player, {type:'collection-claim', locationId});
    const expectedWeapons = Object.fromEntries(drops.filter(drop => drop.type === 'weapon').map(drop => [drop.id, drop.qty]));
    assert.deepEqual(player.weapon_inventory, expectedWeapons, locationId);
    for (const [type, field] of [['tentacles','tentacles'],['strength','stat_strength'],['energy','energy'],['spin','roulette_bonus_spins']]) {
      assert.equal(Number(player[field] || 0) - (field === 'stat_strength' ? 1 : 0), drops.find(drop => drop.type === type)?.qty || 0, `${locationId}: ${type}`);
    }
    assert.equal(drops.some(drop => drop.type === 'xp'), false);
  }
});

test('duplicate poison rewards are combined and unknown locations have no preview', () => {
  assert.deepEqual(getQuestCollectionDrops('p4-u05').filter(drop => drop.type === 'weapon'), [{type:'weapon',id:'large-poison',qty:3}]);
  assert.deepEqual(getQuestCollectionDrops('p4-u07').filter(drop => drop.type === 'weapon'), [{type:'weapon',id:'large-poison',qty:5}]);
  assert.deepEqual(getQuestCollectionDrops('missing'), []);
});
