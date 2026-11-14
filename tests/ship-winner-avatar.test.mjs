import test from 'node:test';
import assert from 'node:assert/strict';
import { lastWinnerProfiles, shipView } from '../server/utils/clanShip.js';
test('winner avatar and name follow the current profile by stable id',()=>{
 const ship={lastWinners:{hull:'Old'},lastWinnerProfiles:{hull:{id:'winner',name:'Old',avatar:'old.webp'}}};
 const result=lastWinnerProfiles(ship,[{id:'winner',nickname:'New',avatar:'new.webp',created_by:'private@test',weapon_inventory:{}}]);
 assert.deepEqual(result.hull,{id:'winner',name:'New',avatar:'new.webp'});
 assert.equal(JSON.stringify(result).includes('private@test'),false);
});
test('legacy victory recovers winner from fight id before using names',()=>{
 const ship={lastWinners:{hull:'Old'},fights:{hull:{status:'dead',last_hit_player_id:'p'}}};
 assert.equal(lastWinnerProfiles(ship,[{id:'p',nickname:'Renamed',photo_url:'photo.webp'}]).hull.avatar,'photo.webp');
});
test('legacy name-only winner is resolved only for an unambiguous profile',()=>{
 const ship={lastWinners:{hull:'Name'}};
 assert.equal(lastWinnerProfiles(ship,[{id:'p',nickname:'Name',avatar:'p.webp'}]).hull.avatar,'p.webp');
 assert.equal(lastWinnerProfiles(ship,[{id:'p',nickname:'Name',avatar:'p.webp'},{id:'q',nickname:'Name',avatar:'q.webp'}]).hull.avatar,'');
});
test('removed winner keeps saved avatar and payload keeps legacy name',()=>{
 const clan={id:'c',ship:{lastWinners:{hull:'Name'},lastWinnerProfiles:{hull:{id:'p',name:'Name',avatar:'saved.webp'}},progress:{},donations:[],kills:{},fights:{}}};
 const view=shipView(clan,{id:'viewer'},[]);
 assert.equal(view.lastWinners.hull,'Name');
 assert.equal(view.lastWinnerProfiles.hull.avatar,'saved.webp');
});
