import test from 'node:test';
import assert from 'node:assert/strict';
import {mainnetPayment,verifyMainnetPayment,createMainnetMarketReader,PL4_MAINNET} from '../server/services/market-mainnet-rpc.js';
const order={id:'test-order',buyerWallet:'buyer.near',sellerWallet:'seller.near',feeRecipient:'nuvelorian.near',decimals:18,price:100};
const hash='A'.repeat(44);
function outcome(o=order){const intent=mainnetPayment(o);return {final_execution_status:'FINAL',status:{SuccessValue:''},transaction:{hash,signer_id:o.buyerWallet,receiver_id:PL4_MAINNET,actions:intent.actions.map(a=>({FunctionCall:{method_name:a.params.methodName,deposit:a.params.deposit,args:Buffer.from(JSON.stringify(a.params.args)).toString('base64')}}))},transaction_outcome:{outcome:{status:{SuccessReceiptId:'receipt'}}},receipts_outcome:[{outcome:{executor_id:PL4_MAINNET,status:{SuccessValue:''},logs:intent.actions.map(a=>'EVENT_JSON:'+JSON.stringify({standard:'nep141',version:'1.0.0',event:'ft_transfer',data:[{old_owner_id:o.buyerWallet,new_owner_id:a.params.args.receiver_id,amount:a.params.args.amount,memo:a.params.args.memo}]}))}}]};}
test('one PL4 batch pays seller and 5% fee; self-fee is retained and common recipients are combined',()=>{
 const intent=mainnetPayment(order);assert.equal(intent.actions.length,2);assert.equal(intent.actions[0].params.args.amount,'950000000000000000');assert.equal(intent.actions[1].params.args.amount,'50000000000000000');
 assert.equal(mainnetPayment({...order,buyerWallet:order.feeRecipient}).actions.length,1);
 const same=mainnetPayment({...order,sellerWallet:order.feeRecipient});assert.equal(same.actions.length,1);assert.equal(same.actions[0].params.args.amount,'1000000000000000000');
 assert.throws(()=>mainnetPayment({...order,sellerWallet:order.buyerWallet}),/OWN_WALLET/);
 assert.throws(()=>mainnetPayment({...order,buyerWallet:'buyer.testnet'}),/MAINNET/);
});
test('final receipts must match every payment action and token-emitted transfer, without extra actions',()=>{
 assert.equal(verifyMainnetPayment(outcome(),order,hash).final,true);
 for(const change of [r=>{r.final_execution_status='EXECUTED'},r=>{r.receipts_outcome[0].outcome.status={Failure:{}}},r=>{r.transaction.signer_id='attacker.near'},r=>{r.transaction.actions.pop()},r=>{r.receipts_outcome[0].outcome.executor_id='fake.near'},r=>{r.receipts_outcome[0].outcome.logs.pop()}]){const r=outcome();change(r);assert.throws(()=>verifyMainnetPayment(r,order,hash));}
 for(const o of [{...order,buyerWallet:order.feeRecipient},{...order,sellerWallet:order.feeRecipient}])assert.equal(verifyMainnetPayment(outcome(o),o,hash).final,true);
});
test('reader refuses a wrong chain before token metadata',async()=>{
 const reader=createMainnetMarketReader({fetchImpl:async()=>({ok:true,json:async()=>({result:{chain_id:'testnet'}})})});await assert.rejects(reader.metadata(),/WRONG_CHAIN/);
});
