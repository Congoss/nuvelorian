import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {marketTeamAllowed,readMarketAccess} from '../server/services/market-access.js';

test('team access uses authenticated Telegram identity, denies by default and excludes bots/banned players',()=>{
 const config={telegramIds:['123']};
 assert.equal(marketTeamAllowed({telegram_id:123},config),true);
 for(const player of [null,{id:'123'},{telegram_id:'124'},{telegram_id:'123',is_banned:true},{telegram_id:'123',ai_agent:{key:'hunter'}}])assert.equal(marketTeamAllowed(player,config),false);
 assert.equal(marketTeamAllowed({telegram_id:'123'},{}),false);
});
test('file changes revoke access immediately and malformed/empty files never fall back to env',()=>{
 const dir=mkdtempSync(join(tmpdir(),'p4-market-access-')),file=join(dir,'access.json'),env={MARKET_TEAM_TELEGRAM_IDS:'123,456'};
 try{
  assert.equal(marketTeamAllowed({telegram_id:'123'},readMarketAccess({file,env})),true);
  for(const content of ['{"telegramIds":[]}','broken','{}']){
   writeFileSync(file,content);
   assert.equal(marketTeamAllowed({telegram_id:'123'},readMarketAccess({file,env})),false);
  }
  writeFileSync(file,'{"telegramIds":["456"]}');
  assert.equal(marketTeamAllowed({telegram_id:'456'},readMarketAccess({file,env})),true);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
