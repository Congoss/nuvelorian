import test from 'node:test';
import assert from 'node:assert/strict';
import {serializePlayerData,playerDb,savePlayerSnapshot} from '../server/data/player-db.js';

test('single-pass player serialization matches the existing persisted data',()=>{
 const player={id:'p',username:'name',level:42,xp:100,coins:30,scrap:30,safe_scrap:4,scrap_per_hour:1,created_at:'2026-10-01',created_date:'2026-10-01',tentacles:30,energy:5,weapon_inventory:{'large-poison':45},talent_combat_state:{f:{marks:5}},inventory_items:[{id:'hat',enhancementLevel:15}],optional:undefined,invalid:NaN};
 const record=playerDb.toDbPlayerRecord(player);
 assert.deepEqual(JSON.parse(serializePlayerData(player)),record.data);
 const captured=serializePlayerData(player);player.weapon_inventory['large-poison']=44;player.talent_combat_state.f.marks=0;
 assert.equal(JSON.parse(captured).weapon_inventory['large-poison'],45);
 assert.equal(JSON.parse(captured).talent_combat_state.f.marks,5);
});
test('serialized and object snapshots pass identical JSON to the existing SQL statement',async()=>{
 const player={id:'p',username:'n',level:2,xp:3,tentacles:4,weapon_inventory:{'large-poison':45}};
 const object=playerDb.toDbPlayerRecord(player),serialized=playerDb.toDbPlayerRecord(player,{serializeData:true});
 const calls=[];const sql=async(strings,...values)=>{calls.push({query:strings.join('?'),values});};
 await savePlayerSnapshot(sql,object,'{}');await savePlayerSnapshot(sql,serialized,'{}');
 assert.deepEqual(calls[0],calls[1]);
});
