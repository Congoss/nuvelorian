import test from 'node:test';
import assert from 'node:assert/strict';
import {shipCombatDraft,shipCombatCheckpoint} from '../server/utils/shipCombatSnapshot.js';

test('failed combat can discard its draft without mutating committed fights or counters',()=>{
 const ship={fights:{hull:{id:'active',participants:{p:{damage:10}}},engine:{id:'other'}},history:{old:{id:'old',participants:{p:{damage:20}}}},receipts:{saved:{result:{damage:10}}},kills:{hull:2},lastWinners:{hull:'old'},lastWinnerProfiles:{hull:{id:'old'}}};
 const before=JSON.stringify(ship),draft=shipCombatDraft(ship,'hull','old');
 draft.fights.hull.participants.p.damage=100;
 draft.history.old.participants.p.damage=200;
 draft.receipts.new={result:{damage:100}};draft.kills.hull++;draft.lastWinners.hull='new';draft.lastWinnerProfiles.hull={id:'new'};
 assert.equal(JSON.stringify(ship),before);
 assert.equal(draft.fights.engine,ship.fights.engine);
 assert.equal(draft.receipts.saved,ship.receipts.saved);
});

test('checkpoint detects relevant fight, receipt and victory changes without scanning unrelated history',()=>{
 const unrelated={toJSON(){throw Error('unrelated history must not be serialized');}};
 const ship={fights:{hull:{id:'active',current_hp:100}},history:{unrelated},receipts:{unrelated},kills:{hull:0},lastWinners:{}};
 const first=shipCombatCheckpoint(ship,'hull','active','combat:p:req');
 ship.fights.hull.current_hp=99;assert.notEqual(shipCombatCheckpoint(ship,'hull','active','combat:p:req'),first);
 ship.fights.hull.current_hp=100;assert.equal(shipCombatCheckpoint(ship,'hull','active','combat:p:req'),first);
 ship.receipts['combat:p:req']={result:{damage:1}};assert.notEqual(shipCombatCheckpoint(ship,'hull','active','combat:p:req'),first);
});
