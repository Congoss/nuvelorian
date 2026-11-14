import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHolderDrop, processHolderDrop, getHolderDrop, saveHolderDrop, checkNftPetStatus } from './holder-drops.js';
import { store } from '../data/store.js';
import { playerDb } from '../data/player-db.js';

test('normalizes independent NFT and token drops with separate thresholds', () => {
  const nft = normalizeHolderDrop({ id: 'nft-1', kind: 'nft', contract: 'nft.herewallet.near', threshold: '2', rewards: [{ field: 'large_poison', amount: 1 }] }, { keepState: false });
  const token = normalizeHolderDrop({ id: 'token-1', kind: 'token', contract: 'pl4.nearlytrade.near', decimals: 18, threshold: '1250000.25', rewards: [{ field: 'large_poison', amount: 1 }] }, { keepState: false });

  assert.equal(nft.kind, 'nft');
  assert.equal(nft.threshold, '2');
  assert.equal(token.kind, 'token');
  assert.equal(token.threshold, '1250000.25');
  assert.equal(token.decimals, 18);
});

test('rejects invalid contracts and malformed token thresholds', () => {
  assert.throws(() => normalizeHolderDrop({ kind: 'nft', contract: 'not a contract' }), /Invalid NEAR contract/);
  assert.throws(() => normalizeHolderDrop({ kind: 'token', contract: 'pl4.nearlytrade.near', threshold: '1e6' }), /positive decimal/);
});

test('NFT pet is granted once per player and wallet, independently of daily resource mail', async () => {
  const original = { players: store.players, drops: store.nftHolderDrops, claims: store.nftPetClaims, fetch: global.fetch, persistNow: store.persistNow, flush: playerDb.flushDirtyPlayers };
  const players = [
    { id: 'pet-owner', near_wallet_id: 'owner.near', near_wallet_verified: true, inventory_items: [] },
    { id: 'same-wallet', near_wallet_id: 'owner.near', near_wallet_verified: true, inventory_items: [] },
    { id: 'not-holder', near_wallet_id: 'outsider.near', inventory_items: [] },
  ];
  const drop = normalizeHolderDrop({ id: 'nft-pet-test', kind: 'nft', contract: 'collection.near', petRewardId: 'raidboss2_pet', threshold: '1' });
  drop.sentByDay = { [new Date().toISOString().slice(0, 10)]: { 'pet-owner': { at: new Date().toISOString() } } };
  try {
    store.players = players; store.nftHolderDrops = [drop]; store.nftPetClaims = [];
    store.persistNow = async () => {}; playerDb.flushDirtyPlayers = async () => {};
    global.fetch = async (_url, options) => {
      const rpc = JSON.parse(options.body);
      const args = JSON.parse(Buffer.from(rpc.params.args_base64, 'base64'));
      const value = rpc.params.method_name === 'nft_supply_for_owner' ? (args.account_id === 'owner.near' ? '2' : '0') : rpc.params.method_name === 'nft_tokens_for_owner' ? [{token_id:'old-test-1',owner_id:args.account_id},{token_id:'old-test-2',owner_id:args.account_id}] : {token_id:args.token_id,owner_id:'owner.near'};
      return Response.json({ result: { result: [...Buffer.from(JSON.stringify(value))] } });
    };
    const options = { id: drop.id, petOnly: true, playerIds: players.map(player => player.id) };
    const first = await processHolderDrop(options);
    assert.equal(first.sent, 1);
    assert.equal(players[0].inventory_items[0].id, 'raidboss2_pet');
    assert.equal(players[1].inventory_items.length, 0);
    assert.equal(players[2].inventory_items.length, 0);
    assert.equal(players[0].gift_mail, undefined, 'Pet issuance does not resend resource mail');
    assert.equal((await processHolderDrop(options)).sent, 0);
    store.players = JSON.parse(JSON.stringify(players));
    store.nftHolderDrops = [normalizeHolderDrop({ ...getHolderDrop(drop.id), sentByDay: {} })];
    assert.equal((await processHolderDrop(options)).sent, 0, 'Receipts survive serialization and daily resets');
    store.nftHolderDrops[0].id = 'recreated-campaign';
    assert.equal((await processHolderDrop({ ...options, id: 'recreated-campaign' })).sent, 0, 'Recreating a campaign cannot bypass the pet receipt');
    assert.throws(() => normalizeHolderDrop({ kind: 'token', contract: 'token.near', petRewardId: 'raidboss2_pet' }));
    assert.throws(() => normalizeHolderDrop({ kind: 'nft', contract: 'collection.near', petRewardId: 'unknown-pet' }));
    const extra = { id: 'rpc-fail', near_wallet_id: 'rpc-fail.near', inventory_items: [] };
    store.players.push(extra);
    global.fetch = async () => Response.json({ error: { message: 'NFT contract panicked' } });
    const failed = await processHolderDrop({ id: 'recreated-campaign', petOnly: true, playerIds: [extra.id] });
    assert.equal(failed.sent, 0);
    assert.equal(failed.errors.length, 1);
    assert.equal(extra.inventory_items.length, 0);
  } finally {
    store.players = original.players; store.nftHolderDrops = original.drops; store.nftPetClaims = original.claims; global.fetch = original.fetch;
    store.persistNow = original.persistNow; playerDb.flushDirtyPlayers = original.flush;
  }
});

test('bulk sending recovers from RPC 429, shares wallet reads and does not duplicate mail', async () => {
  const original = { players: store.players, drops: store.nftHolderDrops, fetch: global.fetch, persistNow: store.persistNow, flush: playerDb.flushDirtyPlayers, rpc: process.env.NEAR_HOLDER_RPC_URL };
  const players = Array.from({ length: 12 }, (_, index) => ({ id: `bulk-${index}`, near_wallet_id: `bulk${index === 1 ? 0 : index}.near` }));
  const drop = normalizeHolderDrop({ id: 'bulk-rate-limit', kind: 'token', contract: 'token.near', decimals: 0, threshold: '10', text: { en: 'Holder reward' } });
  let primaryCalls = 0;
  let fallbackCalls = 0;
  try {
    process.env.NEAR_HOLDER_RPC_URL = 'https://fixture-rpc.invalid';
    store.players = players;
    store.nftHolderDrops = [drop];
    store.persistNow = async () => {};
    playerDb.flushDirtyPlayers = async () => {};
    global.fetch = async url => {
      if (!url.includes('fastnear.com')) {
        primaryCalls += 1;
        return new Response('', { status: 429, headers: { 'Retry-After': '60' } });
      }
      fallbackCalls += 1;
      return Response.json({ result: { result: [...Buffer.from(JSON.stringify('20'))] } });
    };
    const first = await processHolderDrop({ id: drop.id, playerIds: players.map(player => player.id) });
    assert.equal(first.sent, 12);
    assert.deepEqual(first.errors, []);
    assert.ok(primaryCalls <= 4, 'Rate-limited providers are put on cooldown');
    assert.equal(fallbackCalls, 11, 'Shared wallet is read only once per scan');
    assert.ok(players.every(player => player.gift_mail.length === 1 && player.gift_mail[0].rewards[0].amount === 2));
    assert.equal((await processHolderDrop({ id: drop.id, playerIds: players.map(player => player.id) })).sent, 0);
    assert.ok(players.every(player => player.gift_mail.length === 1));
  } finally {
    store.players = original.players; store.nftHolderDrops = original.drops; global.fetch = original.fetch;
    store.persistNow = original.persistNow; playerDb.flushDirtyPlayers = original.flush;
    if (original.rpc === undefined) delete process.env.NEAR_HOLDER_RPC_URL; else process.env.NEAR_HOLDER_RPC_URL = original.rpc;
  }
});

test('selected sends check only selected wallets, retain failed snapshots and prevent duplicates', async () => {
  const originals = { players: store.players, drops: store.nftHolderDrops, fetch: global.fetch, persistSoon: store.persistSoon, persistNow: store.persistNow, flush: playerDb.flushDirtyPlayers };
  const players = [{id:'selected',nickname:'Selected',near_wallet_id:'selected.near'}, {id:'other',nickname:'Other',near_wallet_id:'other.near'}];
  const drop = normalizeHolderDrop({id:'selection-test',kind:'token',enabled:false,contract:'token.near',decimals:0,threshold:'10',text:{en:'Holder bonus'},rewards:[{field:'large_poison',amount:1}],holders:players.map(p=>({id:p.id,nickname:p.nickname,wallet:p.near_wallet_id,holding:'20',rewardMultiplier:2}))});
  const calls = [];
  const flushed = [];
  const result = value => ({ok:true,json:async()=>({result:{result:[...Buffer.from(JSON.stringify(value))]}})});
  try {
    store.players = players;
    store.nftHolderDrops = [drop];
    store.persistSoon = () => {};
    store.persistNow = async () => {};
    playerDb.flushDirtyPlayers = async ids => flushed.push(ids);
    global.fetch = async (_url, options) => {
      const request = JSON.parse(options.body);
      calls.push(JSON.parse(Buffer.from(request.params.args_base64,'base64').toString()).account_id);
      return result('20');
    };
    const sent = await processHolderDrop({id:drop.id,playerIds:['selected']});
    assert.equal(sent.sent,1);
    assert.deepEqual(calls,['selected.near']);
    assert.deepEqual(flushed,[['selected']]);
    assert.equal(players[0].gift_mail[0].rewards[0].amount,2);
    assert.equal(players[1].gift_mail,undefined);
    assert.equal(getHolderDrop(drop.id).holders.length,2);
    assert.equal(getHolderDrop(drop.id).lastRunAt,'');
    assert.equal((await processHolderDrop({id:drop.id,playerIds:['selected']})).sent,0);
    assert.equal(players[0].gift_mail.length,1);
    await assert.rejects(processHolderDrop({id:drop.id,playerIds:[]}),{code:'HOLDER_PLAYERS_REQUIRED'});
    global.fetch = async () => { throw new Error('RPC offline'); };
    const failed = await processHolderDrop({id:drop.id,previewOnly:true});
    assert.equal(failed.errors.length,2);
    assert.equal(failed.holders.length,2);
    assert.ok(failed.holders.every(holder=>holder.stale));
    assert.equal((await processHolderDrop({id:drop.id,playerIds:['other']})).sent,0);
    assert.equal(players[1].gift_mail,undefined);
    assert.equal(getHolderDrop(drop.id).lastScanErrors.length,2);
    global.fetch = async () => result('0');
    await processHolderDrop({id:drop.id,playerIds:['selected']});
    assert.deepEqual(getHolderDrop(drop.id).holders.map(holder=>holder.id),['other']);
    let release;
    const barrier = new Promise(resolve=>{release=resolve;});
    global.fetch = async () => { await barrier; return result('20'); };
    const pending = processHolderDrop({id:drop.id,playerIds:['other']});
    await assert.rejects(processHolderDrop({id:drop.id,playerIds:['other']}),{code:'HOLDER_DROP_BUSY'});
    assert.throws(()=>saveHolderDrop({...getHolderDrop(drop.id)}),{code:'HOLDER_DROP_BUSY'});
    release();
    assert.equal((await pending).sent,1);
  } finally {
    store.players=originals.players;store.nftHolderDrops=originals.drops;global.fetch=originals.fetch;
    store.persistSoon=originals.persistSoon;store.persistNow=originals.persistNow;playerDb.flushDirtyPlayers=originals.flush;
  }
});
