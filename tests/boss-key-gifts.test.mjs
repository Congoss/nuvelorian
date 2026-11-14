import test from 'node:test';import assert from 'node:assert/strict';
import {BOSS_KEY_REWARDS,getBossKeyRewardLabel} from '../src/lib/bossKeyRewards.js';
import {normalizeGiftRewards,claimGiftMail} from '../server/utils/giftMail.js';
test('all nine boss key gifts preserve other keys and can only be claimed once',()=>{
 const rewards=BOSS_KEY_REWARDS.map((key,i)=>({field:key.field,amount:i+1}));assert.equal(rewards.length,9);assert.equal(normalizeGiftRewards(rewards).length,9);
 const player={keycards:{parcel:10},gift_mail:[{id:'keys',rewards}]};claimGiftMail(player,'keys');
 for(const [i,key] of BOSS_KEY_REWARDS.entries())assert.equal(player.keycards[key.location],i+1+(key.location==='parcel'?10:0));
 const before=structuredClone(player.keycards);assert.equal(claimGiftMail(player,'keys').alreadyClaimed,true);assert.deepEqual(player.keycards,before);
 assert.match(getBossKeyRewardLabel('boss_key_boss7','uk'),/Клеопатреш/);assert.match(getBossKeyRewardLabel('boss_key_boss7','en'),/Cleopatrash/);
 for(const reward of [{field:'boss_key_unknown',amount:1},{field:'boss_key_boss7',amount:-1},{field:'boss_key_boss7',amount:1.5}])assert.throws(()=>normalizeGiftRewards([reward]));
});
process.env.NODE_ENV='test';process.env.ADMIN_TOKEN='gift-key-admin';for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('admin resource issuance delivers boss7 keys via gift mail, claimed into the correct inventory',async()=>{
 await store.init();await playerDb.init(store);store.players=playerDb.attachPlayers([{id:'key-gift-player',telegram_id:'90724',created_by:'telegram_90724@miniapp.local',level:80,keycards:{teletron:2}}]);
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{const response=await fetch(base+'/api/admin/grants',{method:'POST',headers:{'content-type':'application/json','x-admin-token':'gift-key-admin'},body:JSON.stringify({target:{playerId:'key-gift-player'},gift:{kind:'resource',field:'boss_key_boss7',amount:5}})});assert.equal(response.status,200,await response.text());const player=store.players[0];assert.equal(player.keycards.teletron,2);const mail=player.gift_mail.at(-1);assert.ok(mail);
 const claim=await fetch(base+'/mail/gifts/claim',{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':'90724'},body:JSON.stringify({mailId:mail.id})});assert.equal(claim.status,200);assert.equal((await claim.json()).data.player.keycards.teletron,7);
 }finally{await new Promise(r=>server.close(r));}
});
