import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';process.env.LOCAL_GAME_STATE_PATH='';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb},{paymentDb}]=await Promise.all([
  import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js'),import('../server/data/payment-db.js'),
]);
store.init=playerDb.init=paymentDb.init=async()=>{};store.persistSoon=()=>{};
let flushed=[];playerDb.flushDirtyPlayers=async ids=>{if(ids)flushed.push(...ids);return 0;};

test('affiliate setup changes only the authenticated player and survives profile/share-page reads',async()=>{
  store.players=playerDb.attachPlayers([
    {id:'affiliate-a',telegram_id:'123',created_by:'telegram_123@miniapp.local',referral_code:'player-a',level:10},
    {id:'affiliate-b',telegram_id:'456',created_by:'telegram_456@miniapp.local',referral_code:'player-b',level:10,telegram_affiliate_url:'https://t.me/planet_4bot?ref=OtherAffiliate'},
  ]);
  const app=createApp();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${app.address().port}`;
  const post=(body,headers={'x-telegram-user-id':'123'})=>fetch(base+'/api/referrals/affiliate',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  try{
    assert.equal((await post({url:'https://t.me/planet_4bot?ref=Fake' },{})).status,401);
    const saved=await post({url:'https://t.me/planet_4bot?start=_tgr_TestAffiliateA',playerId:'affiliate-b'});
    assert.equal(saved.status,200,await saved.clone().text());
    assert.equal((await saved.json()).data.referralLink,'https://t.me/planet_4bot?startapp=ref_player-a&ref=TestAffiliateA');
    assert.equal(store.players[0].telegram_affiliate_referrer,'TestAffiliateA');
    assert.equal(store.players[1].telegram_affiliate_url,'https://t.me/planet_4bot?ref=OtherAffiliate');
    assert.ok(flushed.includes('affiliate-a'));assert.ok(!flushed.includes('affiliate-b'));
    const profile=await fetch(base+'/players/me',{headers:{'x-telegram-user-id':'123'}});
    assert.equal((await profile.json()).data.telegram_affiliate_url,'https://t.me/planet_4bot?ref=TestAffiliateA');
    const page=await fetch(base+'/invite/player-a?lang=uk');const html=await page.text();
    assert.ok(html.includes('startapp=ref_player-a&amp;ref=TestAffiliateA'));
    assert.ok(!html.includes('OtherAffiliate'));
    assert.equal(page.headers.get('cache-control'),'no-store');
    assert.equal((await post({url:'https://t.me/otherbot?ref=Fake'})).status,400);
    assert.equal(store.players[0].telegram_affiliate_referrer,'TestAffiliateA');
    assert.equal((await post({url:''})).status,200);
    assert.equal(store.players[0].telegram_affiliate_url,'');
    assert.equal(store.players[1].telegram_affiliate_url,'https://t.me/planet_4bot?ref=OtherAffiliate');
  }finally{await new Promise(resolve=>app.close(resolve));}
});
