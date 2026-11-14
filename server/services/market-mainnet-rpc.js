import {atomicAmount} from './market-testnet-rpc.js';
export const PL4_MAINNET='pl4.nearlytrade.near';
const fail=code=>{throw Object.assign(new Error(code),{code,statusCode:409});};
const ok=status=>status&&(Object.hasOwn(status,'SuccessValue')||Object.hasOwn(status,'SuccessReceiptId'));
export function mainnetAccount(value){
 if(!/^(?=.{2,64}$)[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(value||'')||value.endsWith('.testnet'))fail('MAINNET_ACCOUNT_REQUIRED');return value;
}
export function mainnetPayment(order){
 const buyer=mainnetAccount(order.buyerWallet),seller=mainnetAccount(order.sellerWallet),recipient=mainnetAccount(order.feeRecipient);
 if(buyer===seller)fail('OWN_WALLET_TRADE');
 const gross=BigInt(atomicAmount(order.price,order.decimals)),fee=BigInt(atomicAmount(Math.ceil(order.price*5/100),order.decimals));
 if(gross<=fee)fail('PRICE_TOO_SMALL');
 const recipients=new Map();
 for(const [account,amount] of [[seller,gross-fee],[recipient,fee]])if(account!==buyer)recipients.set(account,(recipients.get(account)||0n)+amount);
 const memo=`planet4:${order.id}:pay`;
 return {network:'mainnet',signerId:buyer,receiverId:PL4_MAINNET,actions:[...recipients].map(([receiver,amount])=>({type:'FunctionCall',params:{methodName:'ft_transfer',args:{receiver_id:receiver,amount:String(amount),memo},gas:'30000000000000',deposit:'1'}}))};
}
export function verifyMainnetPayment(result,order,txHash){
 const intent=mainnetPayment(order),tx=result?.transaction;
 if(result?.final_execution_status!=='FINAL'||!Object.hasOwn(result?.status||{},'SuccessValue')||!ok(result?.transaction_outcome?.outcome?.status))fail('PAYMENT_NOT_FINAL_OR_FAILED');
 if(tx?.hash!==txHash||tx.signer_id!==intent.signerId||tx.receiver_id!==PL4_MAINNET||tx.actions?.length!==intent.actions.length)fail('PAYMENT_TRANSACTION_MISMATCH');
 for(let i=0;i<intent.actions.length;i++){
  const call=tx.actions[i].FunctionCall,expected=intent.actions[i].params;let args;
  try{args=JSON.parse(Buffer.from(call?.args||'','base64').toString());}catch{fail('PAYMENT_ARGUMENTS_INVALID');}
  if(call?.method_name!=='ft_transfer'||String(call.deposit)!=='1'||args.receiver_id!==expected.args.receiver_id||args.amount!==expected.args.amount||args.memo!==expected.args.memo)fail('PAYMENT_ARGUMENTS_MISMATCH');
 }
 if(!result.receipts_outcome?.length||result.receipts_outcome.some(r=>!ok(r.outcome?.status)))fail('PAYMENT_RECEIPTS_FAILED');
 const events=[];
 for(const receipt of result.receipts_outcome){
  if(receipt.outcome.executor_id!==PL4_MAINNET)continue;
  for(const line of receipt.outcome.logs||[]){if(!line.startsWith('EVENT_JSON:'))continue;let event;try{event=JSON.parse(line.slice(11));}catch{continue;}
   if(event.standard==='nep141'&&event.version==='1.0.0'&&event.event==='ft_transfer')events.push(...(event.data||[]));
  }
 }
 if(events.length!==intent.actions.length)fail('PAYMENT_EVENT_MISMATCH');
 for(const action of intent.actions){const a=action.params.args;const index=events.findIndex(e=>e.old_owner_id===intent.signerId&&e.new_owner_id===a.receiver_id&&e.amount===a.amount&&e.memo===a.memo);if(index<0)fail('PAYMENT_EVENT_MISMATCH');events.splice(index,1);}
 return {network:'mainnet',token:PL4_MAINNET,txHash,orderId:order.id,final:true};
}
export function createMainnetMarketReader({fetchImpl=fetch}={}){
 async function rpc(method,params){
  let last;
  for(const url of ['https://free.rpc.fastnear.com','https://rpc.mainnet.near.org'])try{
   const response=await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'p4-mainnet-market',method,params}),signal:AbortSignal.timeout(15000)});
   const data=await response.json();if(!response.ok||data.error||data.result?.error)throw Error('MAINNET_RPC_UNAVAILABLE');return data.result;
  }catch(error){last=error;}
  throw Object.assign(last||Error('MAINNET_RPC_UNAVAILABLE'),{statusCode:503});
 }
 async function network(){if((await rpc('status',[])).chain_id!=='mainnet')fail('WRONG_CHAIN');}
 async function view(method,args){const result=await rpc('query',{request_type:'call_function',account_id:PL4_MAINNET,method_name:method,args_base64:Buffer.from(JSON.stringify(args)).toString('base64'),finality:'final'});return JSON.parse(Buffer.from(result.result).toString());}
 return {
  async metadata(){await network();const meta=await view('ft_metadata',{});if(meta.spec!=='ft-1.0.0'||!Number.isInteger(meta.decimals)||meta.decimals<2||meta.decimals>24)fail('PL4_METADATA_INVALID');return {network:'mainnet',token:PL4_MAINNET,decimals:meta.decimals,symbol:meta.symbol};},
  async registered(account){mainnetAccount(account);return Boolean(await view('storage_balance_of',{account_id:account}));},
  async balance(account){mainnetAccount(account);return String(await view('ft_balance_of',{account_id:account}));},
  async registrationInstruction(signer,account){mainnetAccount(signer);mainnetAccount(account);await network();const bounds=await view('storage_balance_bounds',{});if(!/^\d+$/.test(bounds?.min||'')||BigInt(bounds.min)>10000000000000000000000n)fail('UNEXPECTED_STORAGE_DEPOSIT');return {network:'mainnet',signerId:signer,receiverId:PL4_MAINNET,actions:[{type:'FunctionCall',params:{methodName:'storage_deposit',args:{account_id:account,registration_only:true},gas:'30000000000000',deposit:bounds.min}}]};},
  async verify(order,txHash){if(!/^[1-9A-HJ-NP-Za-km-z]{40,50}$/.test(txHash||''))fail('TRANSACTION_HASH_INVALID');await network();return verifyMainnetPayment(await rpc('tx',{tx_hash:txHash,sender_account_id:order.buyerWallet,wait_until:'FINAL'}),order,txHash);},
 };
}
