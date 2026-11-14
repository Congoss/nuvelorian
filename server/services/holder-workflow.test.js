import test from 'node:test';
import assert from 'node:assert/strict';
import {holderRewardMultiplier,holderDropStatus,normalizeHolderDrop,saveHolderDrop,processHolderDrop,getHolderDrop} from './holder-drops.js';
import {store} from '../data/store.js';
import {playerDb} from '../data/player-db.js';

test('NFT and token units use exact integer arithmetic and preserve old NFT rules',()=>{
  const nft=normalizeHolderDrop({kind:'nft',contract:'collection.near',threshold:'2',rewardMode:'per_unit'});
  assert.equal(holderRewardMultiplier(nft,'5'),2);
  assert.equal(holderRewardMultiplier(nft,'1'),0);
  assert.equal(holderRewardMultiplier({...nft,rewardMode:'fixed'},'50'),1);
  assert.equal(holderRewardMultiplier({...nft,rewardMode:undefined},'50'),1);
  const token=normalizeHolderDrop({kind:'token',contract:'token.near',threshold:'1.25',decimals:18,rewardMode:'per_unit'});
  assert.equal(holderRewardMultiplier(token,'3749999999999999999'),2);
  assert.equal(holderRewardMultiplier(token,'3750000000000000000'),3);
  assert.equal(holderRewardMultiplier({...token,rewardMode:'fixed'},'3750000000000000000'),1);
});

test('daily workflow previews holdings, sends scaled mail once and reports real delivery dates',async()=>{
  const old={players:store.players,drops:store.nftHolderDrops,soon:store.persistSoon,persist:store.persistNow,flush:playerDb.flushDirtyPlayers,fetch:globalThis.fetch};
  store.persistSoon=()=>{};store.persistNow=async()=>{};playerDb.flushDirtyPlayers=async()=>{};
  store.players=[{id:'workflow-holder',near_wallet_id:'holder.near',nickname:'Holder'}];
  const drop=normalizeHolderDrop({id:'workflow-nft',kind:'nft',contract:'workflow.near',threshold:'2',rewardMode:'per_unit',enabled:false,rewards:[{field:'large_poison',amount:3}],text:{uk:'Щоденна нагорода'}});
  store.nftHolderDrops=[drop];
  globalThis.fetch=async()=>Response.json({result:{result:[...Buffer.from(JSON.stringify('5'))]}});
  try{
    const preview=await processHolderDrop({id:drop.id,previewOnly:true});
    assert.equal(preview.holders[0].rewardMultiplier,2);
    assert.equal(store.players[0].gift_mail,undefined);
    assert.ok(getHolderDrop(drop.id).lastPreviewAt);
    saveHolderDrop({...getHolderDrop(drop.id),enabled:true});
    assert.equal(holderDropStatus(getHolderDrop(drop.id)).due,true);
    const result=await processHolderDrop({id:drop.id});
    assert.equal(result.sent,1);
    assert.equal(store.players[0].gift_mail[0].rewards[0].amount,6);
    const status=holderDropStatus(getHolderDrop(drop.id));
    assert.ok(status.lastSentAt);
    assert.ok(Date.parse(status.nextRunAt)>Date.now());
    assert.equal(status.status,'completed');
    assert.equal(status.running,false);
    assert.equal((await processHolderDrop({id:drop.id})).reason,'already-checked-today');
    assert.equal(store.players[0].gift_mail.length,1);
    // The player snapshot and its receipt can persist before global campaign
    // metadata. Losing the latter must not issue a second mail after restart.
    const current=getHolderDrop(drop.id);
    current.sentByDay={};current.lastSuccessfulFullScanDay='';
    store.players[0].gift_mail=[];
    assert.equal((await processHolderDrop({id:drop.id})).sent,0);
    assert.equal(store.players[0].gift_mail.length,0);
    const edited=saveHolderDrop({...getHolderDrop(drop.id),threshold:'3',lastSentAt:'fake',lastSuccessfulFullScanDay:'fake'});
    assert.equal(edited.lastSentAt,status.lastSentAt);
    assert.notEqual(edited.lastSuccessfulFullScanDay,'fake');
    assert.equal(edited.lastPreviewAt,'');
    assert.deepEqual(edited.holders,[]);
  }finally{store.players=old.players;store.nftHolderDrops=old.drops;store.persistSoon=old.soon;store.persistNow=old.persist;playerDb.flushDirtyPlayers=old.flush;globalThis.fetch=old.fetch;}
});

test('running and interrupted deliveries have distinct statuses',()=>{
  const drop={id:'not-running',enabled:true,runStatus:'running',runStartedAt:'2026-10-21T10:00:00Z',nextRunAt:'2026-10-22T00:00:00Z'};
  const status=holderDropStatus(drop,Date.parse('2026-10-21T11:00:00Z'));
  assert.equal(status.status,'interrupted');
  assert.equal(status.due,false);
  assert.equal(holderDropStatus({...drop,enabled:false}).nextRunAt,'');
});
