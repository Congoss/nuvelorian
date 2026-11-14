// Fixed mainnet read-only RPC. No signer, secrets, broadcast or arbitrary methods.
export function createSubaccountReader({fetchImpl=fetch}={}){
  async function query(params){
    const response=await fetchImpl('https://free.rpc.fastnear.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'p4-subaccount-read',method:'query',params:{finality:'final',...params}}),signal:AbortSignal.timeout(12000)});
    const payload=await response.json();
    if(!response.ok)throw Error('NEAR_RPC_UNAVAILABLE');
    if(payload.error){
      if(payload.error.cause?.name==='UNKNOWN_ACCOUNT')return null;
      throw Error('NEAR_RPC_UNAVAILABLE');
    }
    if(!payload.result||payload.result.error)throw Error('NEAR_RPC_UNAVAILABLE');
    return payload.result;
  }
  return async function read(account,publicKey){
    if(!/^(?=.{2,64}$)[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\.[a-z0-9]+(?:[-_][a-z0-9]+)*)+$/.test(account)||account.endsWith('.testnet'))throw Error('INVALID_MAINNET_ACCOUNT');
    if(publicKey&&!/^ed25519:[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(publicKey))throw Error('INVALID_PUBLIC_KEY');
    const accountState=await query({request_type:'view_account',account_id:account});
    if(!accountState)return {network:'mainnet',account,exists:false};
    const key=publicKey?await query({request_type:'view_access_key',account_id:account,public_key:publicKey}):null;
    return {network:'mainnet',account,exists:true,balance:accountState.amount,keyMatches:publicKey?key?.permission==='FullAccess':null};
  };
}
