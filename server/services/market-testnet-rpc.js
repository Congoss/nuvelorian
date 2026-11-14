// Read-only verification. This module never signs or broadcasts a transaction.
const RPC='https://rpc.testnet.near.org';
const fail=(code)=>{throw Object.assign(new Error(code),{code,statusCode:409});};
export function testnetAccount(value){
  const account=String(value || '').trim();
  if(!/^(?=.{2,64}$)[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\.[a-z0-9]+(?:[-_][a-z0-9]+)*)*\.testnet$/.test(account))fail('TESTNET_ACCOUNT_REQUIRED');
  return account;
}
export function settlementConfig(env=process.env){
  if(env.MARKET_TESTNET_SETTLEMENT!=='1')fail('TESTNET_SETTLEMENT_DISABLED');
  const config={network:'testnet',token:testnetAccount(env.MARKET_TESTNET_TOKEN),vault:testnetAccount(env.MARKET_TESTNET_VAULT),seller:testnetAccount(env.MARKET_TESTNET_SELLER),feeRecipient:testnetAccount(env.MARKET_TESTNET_FEE_RECIPIENT),buyer:testnetAccount(env.MARKET_TESTNET_BUYER),decimals:Number(env.MARKET_TESTNET_DECIMALS)};
  if(new Set([config.vault,config.seller,config.feeRecipient,config.buyer]).size!==4)fail('TESTNET_ROLES_MUST_BE_DISTINCT');
  if(!Number.isInteger(config.decimals)||config.decimals<2||config.decimals>24)fail('TESTNET_DECIMALS_REQUIRED');
  return Object.freeze(config);
}
export function atomicAmount(hundredths,decimals){
  if(!Number.isSafeInteger(hundredths)||hundredths<1||hundredths>100_000_000_000||!Number.isInteger(decimals)||decimals<2||decimals>24)fail('INVALID_TESTNET_AMOUNT');
  return (BigInt(hundredths)*10n**BigInt(decimals-2)).toString();
}
const succeeded=status=>status&&typeof status==='object'&&(Object.hasOwn(status,'SuccessValue')||Object.hasOwn(status,'SuccessReceiptId'));
export function verifyFtOutcome(result,expected){
  if(result?.final_execution_status!=='FINAL')fail('PAYMENT_NOT_FINAL');
  if(!result.status||!Object.hasOwn(result.status,'SuccessValue')||!succeeded(result.transaction_outcome?.outcome?.status))fail('PAYMENT_FAILED');
  const tx=result.transaction;
  if(tx?.hash!==expected.txHash||tx?.signer_id!==expected.sender||tx?.receiver_id!==expected.token)fail('PAYMENT_TRANSACTION_MISMATCH');
  if(!Array.isArray(tx.actions)||tx.actions.length!==1)fail('PAYMENT_ACTION_MISMATCH');
  const call=tx.actions[0].FunctionCall;
  if(call?.method_name!=='ft_transfer'||String(call.deposit)!=='1')fail('PAYMENT_ACTION_MISMATCH');
  let args;try{args=JSON.parse(Buffer.from(call.args,'base64').toString('utf8'));}catch{fail('PAYMENT_ARGUMENTS_INVALID');}
  if(args.receiver_id!==expected.receiver||args.amount!==expected.amount||args.memo!==expected.memo)fail('PAYMENT_ARGUMENTS_MISMATCH');
  const receipts=result.receipts_outcome;
  if(!Array.isArray(receipts)||receipts.length===0||receipts.some(r=>!succeeded(r.outcome?.status)))fail('PAYMENT_RECEIPTS_INCOMPLETE');
  const transfers=[];
  for(const receipt of receipts){
    if(receipt.outcome.executor_id!==expected.token)continue;
    for(const log of receipt.outcome.logs || []){
      if(!log.startsWith('EVENT_JSON:'))continue;
      let event;try{event=JSON.parse(log.slice(11));}catch{continue;}
      if(event.standard==='nep141'&&event.version==='1.0.0'&&event.event==='ft_transfer'&&Array.isArray(event.data))transfers.push(...event.data);
    }
  }
  if(transfers.length!==1||transfers[0].old_owner_id!==expected.sender||transfers[0].new_owner_id!==expected.receiver||transfers[0].amount!==expected.amount||transfers[0].memo!==expected.memo)fail('PAYMENT_EVENT_MISMATCH');
  return {txHash:expected.txHash,network:'testnet',token:expected.token,sender:expected.sender,receiver:expected.receiver,amount:expected.amount,memo:expected.memo,final:true};
}
export function createTestnetFtReader({fetchImpl=fetch}={}){
  async function rpc(method,params){
    const response=await fetchImpl(RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'p4-testnet-read',method,params}),signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    if(!response.ok||data.error)throw Object.assign(new Error('TESTNET_RPC_UNAVAILABLE'),{code:'TESTNET_RPC_UNAVAILABLE',statusCode:503});
    return data.result;
  }
  async function network(){const result=await rpc('status',[]);if(result?.chain_id!=='testnet')fail('WRONG_CHAIN');}
  return {
    async metadata(config){
      testnetAccount(config.token);await network();
      const raw=await rpc('query',{request_type:'call_function',account_id:config.token,method_name:'ft_metadata',args_base64:'e30=',finality:'final'});
      let metadata;try{metadata=JSON.parse(Buffer.from(raw.result).toString('utf8'));}catch{fail('TOKEN_METADATA_INVALID');}
      if(metadata.spec!=='ft-1.0.0'||metadata.decimals!==config.decimals)fail('TOKEN_DECIMALS_MISMATCH');
      return {network:'testnet',token:config.token,decimals:metadata.decimals,symbol:String(metadata.symbol || '')};
    },
    async verify(expected){
      for(const key of ['token','sender','receiver'])testnetAccount(expected[key]);
      if(!/^[1-9A-HJ-NP-Za-km-z]{40,50}$/.test(expected.txHash || ''))fail('TRANSACTION_HASH_INVALID');
      await network();
      return verifyFtOutcome(await rpc('tx',{tx_hash:expected.txHash,sender_account_id:expected.sender,wait_until:'FINAL'}),expected);
    },
  };
}
