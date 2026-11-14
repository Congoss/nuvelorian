import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING']) process.env[key]='';
const {createApp}=await import('../server/app.js');
const {store}=await import('../server/data/store.js');
const {playerDb}=await import('../server/data/player-db.js');
test('chat replies are scoped and clan invitations are server owned and rate limited',async()=>{
 await store.init();await playerDb.init(store);
 store.players=playerDb.attachPlayers([
  {id:'chat-user',telegram_id:'99001',created_by:'telegram_99001@miniapp.local',username:'Tester',clan_name:'ChatClan',clan_id:'chat-clan',clan_logo_id:'planet4'},
  {id:'clan-mate',telegram_id:'99002',created_by:'telegram_99002@miniapp.local',username:'ClanMate',clan_name:'ChatClan',clan_id:'chat-clan'},
 ]);
 store.clans=[{id:'chat-clan',name:'ChatClan',logo_id:'planet4',level:2,owner_id:'chat-user'}];store.chatMessages=[];
 const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const send=async(body,telegramId='99001')=>{const response=await fetch(`http://127.0.0.1:${server.address().port}/chat/messages`,{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':telegramId},body:JSON.stringify(body)});return {status:response.status,...await response.json()};};
 try {
 const first=await send({channel:'world',text:'First'});assert.equal(first.status,201);
 const reply=await send({channel:'world',text:'Reply',replyToId:first.data.id});assert.equal(reply.status,201);assert.equal(reply.data.reply.text,'First');
 assert.equal((await send({channel:'clan',text:'Wrong channel',replyToId:first.data.id})).status,400);
 const invite=await send({channel:'world',text:'Invite',kind:'clan_invite',clanInvite:{name:'Fake'}});assert.equal(invite.status,201);assert.equal(invite.data.clanInvite.name,'ChatClan');
 assert.equal((await send({channel:'world',text:'Invite',kind:'clan_invite'})).status,429);
 const invitation=store.chatMessages.find(entry=>entry.kind==='clan_invite');
 invitation.created_at=new Date(Date.now()-19*60000).toISOString();
 assert.equal((await send({channel:'world',text:'Invite',kind:'clan_invite'})).status,429);
 invitation.created_at=new Date(Date.now()-21*60000).toISOString();
 const currentClan=store.clans.find(entry=>entry.id==='chat-clan');currentClan.owner_id='someone-else';
 store.players[0].clan_role='member';
 assert.equal((await send({channel:'world',text:'Invite',kind:'clan_invite'})).status,403);
 store.players[0].clan_role='deputy';
 assert.equal((await send({channel:'world',text:'Invite',kind:'clan_invite'})).status,201);
 store.bossFights=[{id:'boss-fight-1',boss_id:'boss4',boss_name:'Worm',status:'active',current_hp:100,opened_by_email:store.players[0].created_by}];
 const bossInvite=await send({channel:'clan',text:'Help!',kind:'boss_fight_invite',bossFightInvite:{fightId:'boss-fight-1'}});
 assert.equal(bossInvite.status,201);
 assert.deepEqual({...bossInvite.data.bossFightInvite},{fightId:'boss-fight-1',bossId:'boss4',bossName:'Worm',clanLogoId:'planet4'});
 assert.equal((await send({channel:'clan',text:'Help again!',kind:'boss_fight_invite',bossFightInvite:{fightId:'boss-fight-1'}})).status,409);
 assert.equal((await send({channel:'clan',text:'Mate invite',kind:'boss_fight_invite',bossFightInvite:{fightId:'boss-fight-1'}},'99002')).status,403);
 store.bossFights.push({id:'boss-fight-next',boss_id:'boss5',boss_name:'Sporgol',status:'active',current_hp:100,opened_by_email:store.players[0].created_by});
 assert.equal((await send({channel:'clan',text:'Next boss!',kind:'boss_fight_invite',bossFightInvite:{fightId:'boss-fight-next'}})).status,201);
 store.bossFights.find(fight=>fight.id==='boss-fight-1').status='dead';
 const messages=await fetch(`http://127.0.0.1:${server.address().port}/chat/messages?channel=clan`,{headers:{'x-telegram-user-id':'99001'}}).then(response=>response.json());
 assert.equal(messages.data.some(message=>message.bossFightInvite?.fightId==='boss-fight-1'),false);
 const activeFight=await fetch(`http://127.0.0.1:${server.address().port}/boss-fights/active`,{headers:{'x-telegram-user-id':'99001'}}).then(response=>response.json());
 assert.ok(activeFight.data.clan_invite_sent_at);
 store.chatMessages=Array.from({length:120},(_,index)=>({id:`recent-${index}`,channel:'world',player_id:'chat-user',text:`Message ${index}`,created_at:new Date(1700000000000+index*1000).toISOString()}));
 const recent=await fetch(`http://127.0.0.1:${server.address().port}/chat/messages?channel=world&limit=40`,{headers:{'x-telegram-user-id':'99001'}}).then(response=>response.json());
 assert.equal(recent.data.length,40);
 assert.equal(recent.data[0].id,'recent-80');
 assert.equal(recent.data[39].id,'recent-119');
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('chat message mapping keeps boss invite actions attached to the rendered message', () => {
 const source=fs.readFileSync('src/components/game/ChatPanel.jsx','utf8');
 const start=source.indexOf('  const mapApiMessage =');
 const end=source.indexOf('\n\n  const loadMessages',start);
 assert.ok(start>=0&&end>start);
 const context=vm.createContext({channel:'clan',selfAvatar:'avatar',profile:{language:'en'},t:key=>key,Date});
 vm.runInContext(`${source.slice(start,end)}\nglobalThis.mapApiMessage=mapApiMessage;`,context);
 const invite={fightId:'fight-1',bossName:'SHORK'};
 const mapped=context.mapApiMessage({id:'message-1',bossFightInvite:invite,text:'Help'},'clan');
 assert.deepEqual({...mapped.bossFightInvite},invite);
});
