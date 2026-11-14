import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const {cardGameCommand,readCardDisplayState}=await import('../server/services/card-game.js');
test('repeated card display reads skip persistence and use live balances; play still commits',async()=>{
 let saves=0;const player={id:'cache-card',energy:100,card_game_bonus:0},store={players:[player],cardGames:{}};
 const options={hasDb:false,persistLocal:()=>{saves++;return true;},now:Date.parse('2026-10-29T12:00:00Z')};
 const first=await cardGameCommand(store,player,'state',{},options);assert.equal(first.free,1);assert.equal(saves,1);
 player.energy=70;player.card_game_bonus=3;
 const second=await cardGameCommand(store,player,'state',{},options);assert.equal(second.free,4);assert.equal(second.player.energy,70);assert.equal(saves,1);
 const played=await cardGameCommand(store,player,'begin',{mode:1,requestId:'cached-card-play-0001'},options);
 assert.equal(played.free,3);assert.equal(player.card_game_bonus,0);assert.equal(saves,2);
 const displayed=await cardGameCommand(store,player,'state',{},options);assert.equal(displayed.round.id,played.round.id);assert.equal(saves,2);
});

test('cold database display only reads state and verified payments without player locks or writes',async()=>{
 const queries=[];
 const sql=async(strings,...values)=>{
  const query=strings.join('?');queries.push(query);
  assert(!/FOR UPDATE|INSERT|UPDATE players|UPDATE player_card_games/i.test(query));
  if(query.includes('payment_transactions'))return [{id:'paid-1',item_id:'card_play_1',status:'success'}];
  return [];
 };
 const state=await readCardDisplayState(sql,'player');assert.equal(state.paid1,1);assert.equal(state.payments['paid-1'],'card_play_1');assert.equal(queries.length,2);
});

test('already shown daily window skips another persistence pass',async()=>{
 let saves=0;const player={id:'shown-card',card_game_bonus:0},store={players:[player],cardGames:{}};
 const options={hasDb:false,persistLocal:()=>{saves++;return true;},now:Date.parse('2026-11-01T12:00:00Z')};
 await cardGameCommand(store,player,'shown',{},options);assert.equal(saves,1);
 const second=await cardGameCommand(store,player,'shown',{},options);assert.equal(second.showDaily,false);assert.equal(saves,1);
});
