import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createTestnetSettlement} from '../server/services/market-testnet-settlement.js';
import {createTestnetFtReader,verifyFtOutcome,atomicAmount,settlementConfig} from '../server/services/market-testnet-rpc.js';
const config={network:'testnet',token:'token.p4.testnet',vault:'vault.p4.testnet',seller:'seller.p4.testnet',feeRecipient:'fee.p4.testnet',buyer:'buyer.p4.testnet',decimals:24};
const clone=v=>JSON.parse(JSON.stringify(v));
const hash=n=>'A'.repeat(43)+n;
const proof=expectation=>({...expectation,network:'testnet',final:true});
function fixture({state,save,reader}={}){let disk,clock=Date.parse('2026-11-11T12:00:00Z');const storage=s=>{disk=clone(s);return save?save(s):true;};const client=reader || {metadata:async()=>({decimals:24}),verify:async e=>proof(e)};const book=createTestnetSettlement({config,state,save:storage,reader:client,now:()=>clock});return {book,disk:()=>disk,advance:ms=>{clock+=ms;}};}
const reserve=book=>book.reserve({requestId:randomUUID()});
function outcome(e){const args={receiver_id:e.receiver,amount:e.amount,memo:e.memo};return {final_execution_status:'FINAL',status:{SuccessValue:''},transaction:{hash:e.txHash,signer_id:e.sender,receiver_id:e.token,actions:[{FunctionCall:{method_name:'ft_transfer',deposit:'1',args:Buffer.from(JSON.stringify(args)).toString('base64')}}]},transaction_outcome:{outcome:{status:{SuccessReceiptId:'receipt'}}},receipts_outcome:[{outcome:{executor_id:e.token,status:{SuccessValue:''},logs:['EVENT_JSON:'+JSON.stringify({standard:'nep141',version:'1.0.0',event:'ft_transfer',data:[{old_owner_id:e.sender,new_owner_id:e.receiver,amount:e.amount,memo:e.memo}]})]}}]};}
const expected={network:'testnet',txHash:hash(1),token:config.token,sender:config.buyer,receiver:config.vault,amount:'100000000000000000000000',memo:'p4-testnet:test:funding'};

test('testnet is explicit, role accounts distinct, and mainnet token is refused',()=>{
 assert.throws(()=>settlementConfig({}),/DISABLED/);
 const env={MARKET_TESTNET_SETTLEMENT:'1',MARKET_TESTNET_TOKEN:config.token,MARKET_TESTNET_VAULT:config.vault,MARKET_TESTNET_SELLER:config.seller,MARKET_TESTNET_FEE_RECIPIENT:config.feeRecipient,MARKET_TESTNET_BUYER:config.buyer,MARKET_TESTNET_DECIMALS:'24'};
 assert.equal(settlementConfig(env).network,'testnet');assert.throws(()=>settlementConfig({...env,MARKET_TESTNET_TOKEN:'pl4.nearlytrade.near'}),/TESTNET_ACCOUNT_REQUIRED/);assert.throws(()=>settlementConfig({...env,MARKET_TESTNET_VAULT:config.buyer}),/DISTINCT/);
 assert.equal(atomicAmount(100_000_000_000,24),'1000000000000000000000000000000000');
});
test('FT verifier requires final success, exact arguments and a token-emitted event',()=>{
 assert.equal(verifyFtOutcome(outcome(expected),expected).final,true);
 const cases=[r=>{r.final_execution_status='EXECUTED_OPTIMISTIC';},r=>{r.status={Failure:{}};},r=>{r.transaction.signer_id=config.seller;},r=>{r.transaction.receiver_id='wrong.testnet';},r=>{r.transaction.actions[0].FunctionCall.method_name='ft_transfer_call';},r=>{r.transaction.actions[0].FunctionCall.deposit='0';},r=>{r.receipts_outcome=[];},r=>{r.receipts_outcome[0].outcome.executor_id='fake.testnet';},r=>{r.receipts_outcome[0].outcome.status={Failure:{}};},r=>{r.receipts_outcome[0].outcome.logs=[];},r=>{r.transaction.actions.push(clone(r.transaction.actions[0]));}];
 for(const change of cases){const data=outcome(expected);change(data);assert.throws(()=>verifyFtOutcome(data,expected));}
 for(const key of ['receiver','amount','memo','txHash'])assert.throws(()=>verifyFtOutcome(outcome(expected),{...expected,[key]:'wrong'}));
});
test('read-only reader pins testnet, reads actual decimals, and requests FINAL',async()=>{
 const calls=[];const reader=createTestnetFtReader({fetchImpl:async(url,init)=>{const q=JSON.parse(init.body);calls.push({url,...q});return {ok:true,json:async()=>({result:q.method==='status'?{chain_id:'testnet'}:q.method==='query'?{result:[...Buffer.from(JSON.stringify({spec:'ft-1.0.0',decimals:24,symbol:'TEST'}))]}:outcome(expected)})};}});
 assert.equal((await reader.metadata(config)).decimals,24);await reader.verify(expected);assert(calls.every(c=>c.url==='https://rpc.testnet.near.org'));assert(calls.every(c=>['status','query','tx'].includes(c.method)));assert.equal(calls.at(-1).params.wait_until,'FINAL');
 const wrong=createTestnetFtReader({fetchImpl:async()=>({ok:true,json:async()=>({result:{chain_id:'mainnet'}})})});await assert.rejects(wrong.metadata(config),/WRONG_CHAIN/);
});
test('reservation is exclusive, immutable and replayable without another RPC call',async()=>{
 let reads=0;const {book}=fixture({reader:{metadata:async()=>{reads++;if(reads>1)throw Error('offline');},verify:async e=>proof(e)}});const requestId=randomUUID(),order=await book.reserve({requestId});assert.equal((await book.reserve({requestId})).id,order.id);assert.equal(reads,1);
 const intent=book.instruction(order.id,'funding');assert.equal(intent.receiverId,config.token);assert.equal(intent.signerId,config.buyer);assert.equal(intent.actions[0].params.args.receiver_id,config.vault);assert.equal(intent.actions[0].params.deposit,'1');assert.equal(order.amount,'1000000000000000000000000');assert.equal(order.feeAmount,'50000000000000000000000');
});
test('only funding plus both verified payouts delivers the item; replay does not deliver twice',async()=>{
 const {book,disk}=fixture();const order=await reserve(book);await book.confirm({orderId:order.id,leg:'funding',txHash:hash(1)});assert.equal(book.read().inventory[config.buyer].length,0);
 await book.confirm({orderId:order.id,leg:'seller',txHash:hash(2)});assert.equal(book.read().orders[0].status,'payout_pending');assert.equal(book.read().inventory[config.buyer].length,0);
 await book.confirm({orderId:order.id,leg:'fee',txHash:hash(3)});assert.equal(book.read().orders[0].status,'completed');assert.equal(book.read().inventory[config.buyer].length,1);assert.equal(book.read().inventory[config.seller].length,0);const saved=disk();
 await book.confirm({orderId:order.id,leg:'fee',txHash:hash(3)});assert.deepEqual(disk(),saved);assert.equal(book.read().signingEnabled,false);
 const restarted=fixture({state:saved}).book;assert.equal((await restarted.confirm({orderId:order.id,leg:'fee',txHash:hash(3)})).status,'completed');assert.equal(restarted.read().inventory[config.buyer].length,1);
});
test('incomplete/failed RPC proof and failed disk write cannot deliver or consume receipts',async()=>{
 const rejected=fixture({reader:{metadata:async()=>({}),verify:async()=>{throw Error('PAYMENT_NOT_FINAL');}}});const order=await reserve(rejected.book);await assert.rejects(rejected.book.confirm({orderId:order.id,leg:'funding',txHash:hash(1)}),/NOT_FINAL/);assert.equal(rejected.book.read().orders[0].status,'awaiting_payment');
 let fail=false;const {book}=fixture({save:()=>!fail});const other=await reserve(book);const before=book.read();fail=true;await assert.rejects(book.confirm({orderId:other.id,leg:'funding',txHash:hash(2)}),/STORAGE_UNAVAILABLE/);assert.deepEqual(book.read(),before);
});
test('late funding becomes refundable and can never take an expired/reserved-again item',async()=>{
 const {book,advance}=fixture(),old=await reserve(book);advance(16*60000);await book.expire(old.id);const fresh=await reserve(book);
 await book.confirm({orderId:old.id,leg:'funding',txHash:hash(1)});assert.equal(book.read().orders[0].status,'refund_required');assert.equal(book.read().listing.orderId,fresh.id);
 assert.throws(()=>book.instruction(old.id,'seller'),/FUNDING_REQUIRED/);await book.confirm({orderId:old.id,leg:'refund',txHash:hash(2)});assert.equal(book.read().orders[0].status,'refunded');assert.equal(book.read().listing.orderId,fresh.id);assert.equal(book.read().inventory[config.buyer].length,0);
});
test('refunds stop once a payout exists; one transaction cannot pay two legs',async()=>{
 const {book}=fixture(),order=await reserve(book);await book.confirm({orderId:order.id,leg:'funding',txHash:hash(1)});
 await assert.rejects(book.confirm({orderId:order.id,leg:'seller',txHash:hash(1)}),/ALREADY_USED/);await book.confirm({orderId:order.id,leg:'seller',txHash:hash(2)});assert.throws(()=>book.instruction(order.id,'refund'),/RECONCILIATION/);
});
test('racing reservations admit only one buyer; config changes cannot reinterpret saved amounts',async()=>{
 const {book,disk}=fixture();const results=await Promise.allSettled([reserve(book),reserve(book)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.throws(()=>createTestnetSettlement({config:{...config,decimals:18},state:disk(),save:()=>true,reader:{}}),/CONFIG_CHANGED/);
});

