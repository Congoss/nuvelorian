import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../data/store.js';
import { playerDb } from '../data/player-db.js';
import { normalizeHolderDrop, processHolderDrop, checkNftPetStatus, claimNftHolderPet } from './holder-drops.js';

test('NFT pet receipt survives transfers, recreated drops, wallet changes and serialization; public status is read-only', async () => {
  const saved = { players:store.players,drops:store.nftHolderDrops,claims:store.nftPetClaims,persist:store.persistNow,flush:playerDb.flushDirtyPlayers,fetch:global.fetch };
  let owner = 'seller.near', offline = false, transferDuringCheck = false;
  const seller={id:'seller',near_wallet_id:owner,near_wallet_verified:true,inventory_items:[]};
  const buyer={id:'buyer',near_wallet_id:'buyer.near',near_wallet_verified:true,inventory_items:[]};
  const config={id:'unique-pet',kind:'nft',contract:'pet-collection.near',petRewardId:'hereearlypet',threshold:'1'};
  const issue=id=>processHolderDrop({id:store.nftHolderDrops[0].id,petOnly:true,playerIds:[id]});
  try {
    store.players=[seller,buyer];store.nftHolderDrops=[normalizeHolderDrop(config)];store.nftPetClaims=[];
    store.persistNow=async()=>{};playerDb.flushDirtyPlayers=async()=>{};
    global.fetch=async(_url,options)=>{
      if(offline)throw new Error('RPC unavailable');
      const {params}=JSON.parse(options.body),args=JSON.parse(Buffer.from(params.args_base64,'base64'));
      let value;
      if(params.method_name==='nft_supply_for_owner')value=args.account_id===owner?'1':'0';
      else if(params.method_name==='nft_tokens_for_owner')value=[{token_id:'monkey#7',owner_id:owner}];
      else {if(transferDuringCheck)owner='moved.near';value={token_id:args.token_id,owner_id:owner};}
      return Response.json({result:{result:[...Buffer.from(JSON.stringify(value))]}});
    };
    assert.equal((await checkNftPetStatus(config.contract,'monkey#7')).available,true);
    assert.equal(store.nftPetClaims.length,0);
    assert.equal((await issue('seller')).sent,1);
    assert.equal(store.nftPetClaims[0].tokenId,'monkey#7');
    assert.equal(seller.holder_pet_grants.hereearlypet.tokenId,'monkey#7');
    assert.equal((await checkNftPetStatus(config.contract,'monkey#7')).claimed,true);
    owner='buyer.near';
    store.nftPetClaims=JSON.parse(JSON.stringify(store.nftPetClaims));
    store.nftHolderDrops=[normalizeHolderDrop({...config,id:'new-campaign'})];
    const blocked=await issue('buyer');assert.equal(blocked.sent,0);assert.equal(buyer.inventory_items.length,0);
    assert.equal(store.nftHolderDrops[0].holders.find(h=>h.id==='buyer').petTokens[0].claimed,true);
    seller.near_wallet_id='different.near';
    assert.equal((await issue('buyer')).sent,0);
    store.nftHolderDrops=[];
    assert.equal((await checkNftPetStatus(config.contract,'monkey#7')).claimed,true,'Deleting a campaign retains redemption status');
    store.nftHolderDrops=[normalizeHolderDrop(config)];
    offline=true;await assert.rejects(checkNftPetStatus(config.contract,'monkey#8'));
    offline=false;store.nftPetClaims=[];store.players=[buyer];buyer.near_wallet_verified=false;
    assert.equal((await issue('buyer')).sent,0,'Unverified wallets cannot redeem pets');
    buyer.near_wallet_verified=true;transferDuringCheck=true;
    assert.equal((await issue('buyer')).sent,0,'Ownership is checked again immediately before issuance');
    assert.equal(store.nftPetClaims.length,0);
    transferDuringCheck=false;owner='buyer.near';
    buyer.holder_pet_grants={hereearlypet:{wallet:'old.near',contract:config.contract,at:'2026-10-01'}};
    const unknown=await checkNftPetStatus(config.contract,'monkey#7');assert.equal(unknown.unknown,true);assert.equal(unknown.available,false);
    assert.equal((await issue('buyer')).sent,0);
  } finally {store.players=saved.players;store.nftHolderDrops=saved.drops;store.nftPetClaims=saved.claims;store.persistNow=saved.persist;playerDb.flushDirtyPlayers=saved.flush;global.fetch=saved.fetch;}
});

test('player checks distinguish missing wallets, no NFT, used NFT, RPC failure and successful one-time self-claim', async () => {
  const saved={players:store.players,drops:store.nftHolderDrops,claims:store.nftPetClaims,persist:store.persistNow,flush:playerDb.flushDirtyPlayers,fetch:global.fetch};
  const player={id:'self',inventory_items:[]};let mode='none',reads=0;
  try {
    store.players=[player];store.nftPetClaims=[];store.nftHolderDrops=[normalizeHolderDrop({id:'self-check',kind:'nft',contract:'self-collection.near',petRewardId:'hereearlypet'})];
    store.persistNow=async()=>{};playerDb.flushDirtyPlayers=async()=>{};
    global.fetch=async(_url,options)=>{
      reads++;if(mode==='offline')throw new Error('RPC unavailable');
      const {params}=JSON.parse(options.body),args=JSON.parse(Buffer.from(params.args_base64,'base64'));
      const token={token_id:'self-nft',owner_id:'self.near'};
      const value=params.method_name==='nft_supply_for_owner'?(mode==='none'?'0':'1'):params.method_name==='nft_tokens_for_owner'?[token]:{...token,token_id:args.token_id};
      return Response.json({result:{result:[...Buffer.from(JSON.stringify(value))]}});
    };
    assert.equal((await claimNftHolderPet(player,'hereearlypet')).status,'wallet_required');assert.equal(reads,0);
    player.near_wallet_id='self.near';assert.equal((await claimNftHolderPet(player,'hereearlypet')).status,'wallet_unverified');assert.equal(reads,0);
    player.near_wallet_verified=true;
    assert.equal((await claimNftHolderPet(player,'hereearlypet')).status,'no_nft');
    mode='offline';assert.equal((await claimNftHolderPet(player,'hereearlypet')).status,'rpc_error');assert.equal(player.inventory_items.length,0);
    mode='holder';store.nftPetClaims=[{network:process.env.NEAR_NETWORK||process.env.VITE_NEAR_NETWORK||'mainnet',contract:'self-collection.near',tokenId:'self-nft',wallet:'previous.near',petId:'hereearlypet',at:new Date().toISOString()}];
    assert.equal((await claimNftHolderPet(player,'hereearlypet')).status,'nft_used');assert.equal(player.inventory_items.length,0);
    store.nftPetClaims=[];
    assert.equal((await claimNftHolderPet(player,'hereearlypet')).status,'granted');assert.equal(player.inventory_items.length,1);
    const after=reads;assert.equal((await claimNftHolderPet(player,'hereearlypet')).status,'owned');assert.equal(reads,after);assert.equal(player.inventory_items.length,1);
    await assert.rejects(claimNftHolderPet(player,'forged-pet'),{statusCode:400});
  }finally{store.players=saved.players;store.nftHolderDrops=saved.drops;store.nftPetClaims=saved.claims;store.persistNow=saved.persist;playerDb.flushDirtyPlayers=saved.flush;global.fetch=saved.fetch;}
});
