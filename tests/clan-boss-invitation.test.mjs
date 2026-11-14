import test from 'node:test';
import assert from 'node:assert/strict';
import {hasClanBossInvitation,isJoinableBossFight} from '../server/utils/clanBossInvitation.js';

test('solo fights cannot be joined even with a stale invitation',()=>{
 const player={clan_id:'a'};
 const fight={id:'solo',solo:true,clan_invite_sent_at:'2026-10-29',clan_invite_clan_id:'a'};
 assert.equal(hasClanBossInvitation(player,fight),false);
 fight.solo=false;
 assert.equal(hasClanBossInvitation(player,fight),true);
});
test('clan invite remains valid after rename or chat cleanup, but never grants access to another clan',()=>{
 const fight={id:'f',clan_invite_sent_at:'2026-10-28',clan_invite_clan_id:'clan-a',clan_invite_clan_name:'Old name'};
 assert.equal(hasClanBossInvitation({clan_id:'clan-a',clan_name:'New name'},fight,[]),true);
 assert.equal(hasClanBossInvitation({clan_id:'clan-b',clan_name:'Old name'},fight,[]),false);
});
test('legacy invitation normalizes names without bypassing available clan ids',()=>{
 const message={kind:'boss_fight_invite',channel:'clan',bossFightInvite:{fightId:'f'},clan:' CLAN   Name '};
 assert.equal(hasClanBossInvitation({clan_name:'clan name'},{id:'f'},[message]),true);
 assert.equal(hasClanBossInvitation({clan_name:'Other'},{id:'f'},[message]),false);
 assert.equal(hasClanBossInvitation({clan_name:'clan name'},{id:'g'},[message]),false);
 message.bossFightInvite.clanId='a';assert.equal(hasClanBossInvitation({clan_id:'b',clan_name:'clan name'},{id:'f'},[message]),false);
});
test('dead, expired and missing boss fights cannot be joined',()=>{
 const now=Date.now(),fight={status:'active',current_hp:10,ends_at:new Date(now+1000).toISOString()};
 assert.equal(isJoinableBossFight(fight,now),true);assert.equal(isJoinableBossFight(fight,now+1000),false);
 assert.equal(isJoinableBossFight({...fight,status:'dead'},now),false);assert.equal(isJoinableBossFight({...fight,current_hp:0},now),false);assert.equal(isJoinableBossFight(null,now),false);
});
