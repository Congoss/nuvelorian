import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTelegramProfiles} from '../server/services/admin-telegram-profiles.js';
const players=[{id:'a',telegram_id:'123'},{id:'b',telegram_id:'456'}];
test('lookup only selected players and returns verified username and link',async()=>{
 const rows=await resolveTelegramProfiles(players,['a'],{token:'test',fetchImpl:async(url,options)=>{
  assert.equal(JSON.parse(options.body).chat_id,'123');assert.ok(url.endsWith('/getChat'));
  return {ok:true,json:async()=>({ok:true,result:{id:123,type:'private',username:'alice'}})};
 }});
 assert.deepEqual(rows,[{id:'a',telegramId:'123',telegramUsername:'alice',telegramLink:'https://t.me/alice',telegramStatus:'found'}]);
});
test('distinguishes no username, unavailable, rate limits and network failure',async()=>{
 for(const [body,status] of [[{ok:true,result:{id:123,type:'private'}},'no_username'],[{ok:false,error_code:403},'unavailable'],[{ok:false,error_code:429,parameters:{retry_after:20}},'rate_limited'],[{ok:true,result:{id:999,type:'private',username:'wrong'}},'unavailable']]){
  const [row]=await resolveTelegramProfiles(players,['a'],{token:'test',fetchImpl:async()=>({ok:true,json:async()=>body})});assert.equal(row.telegramStatus,status);assert.equal(row.telegramUsername,'');
 }
 const [row]=await resolveTelegramProfiles(players,['a'],{token:'secret',fetchImpl:async()=>{throw Error('secret');}});assert.equal(row.telegramStatus,'unavailable');assert.ok(!JSON.stringify(row).includes('secret'));
});
test('rejects missing configuration and oversized batches before network access',async()=>{
 await assert.rejects(resolveTelegramProfiles(players,['a']),{statusCode:503});
 await assert.rejects(resolveTelegramProfiles(players,Array(6).fill('a'),{token:'test'}),{statusCode:400});
});
