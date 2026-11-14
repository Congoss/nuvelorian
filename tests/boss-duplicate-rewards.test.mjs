import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';
process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';
const [{ createApp }, { store }, { playerDb }] = await Promise.all([
  import('../server/app.js'), import('../server/data/store.js'), import('../server/data/player-db.js'),
]);

test('duplicate boss rewards grant salvage once without a server error', async () => {
  await store.init();await playerDb.init(store);
  const bossId=GAME_CONFIG.BOSSES[0].id;
  const gear=['weapon','head','armor','hands','legs','boots'].map(slot=>({id:`cardboard_${slot}`,type:'equipment',slot}));
  const [player]=playerDb.attachPlayers([{id:'duplicate-boss-reward',telegram_id:'90529',created_by:'telegram_90529@miniapp.local',level:10,tentacles:0,inventory_items:[...gear,{id:'pet-bot',type:'equipment',slot:'pet'}]}]);
  store.players=[player];store.claimedLoot=[];
  const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}/loot/claim`;
  try {
    for(const [index,drop] of [{type:'boss_gear_piece'},{type:'boss_pet'},{type:'equipment',itemId:'cardboard_weapon'},{type:'pet',petId:'pet-bot'}].entries()) {
      const instanceId=`duplicate-reward-${index}`;
      player.pending_boss_boxes=[{instanceId,boxType:'wooden',bossId,rewardFormula:'boss_v2',rewardSnapshot:[{...drop,qty:1,bossId}]}];
      const before=Number(player.tentacles||0),count=player.inventory_items.length;
      const claim=async()=>{const response=await fetch(url,{method:'POST',headers:{'x-telegram-user-id':'90529','content-type':'application/json'},body:JSON.stringify({instanceId})});const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));return result.data;};
      const result=await claim();assert.equal(result.drops[0].type,'tentacles');assert.ok(result.drops[0].qty>=250&&result.drops[0].qty<=500);assert.equal(player.tentacles-before,result.drops[0].qty);assert.equal(player.inventory_items.length,count);
      const balance=player.tentacles;assert.equal((await claim()).replayed,true);assert.equal(player.tentacles,balance);
    }
  }finally{await new Promise(r=>server.close(r));}
});
