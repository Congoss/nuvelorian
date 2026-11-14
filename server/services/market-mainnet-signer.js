import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {KeyPair} from '@near-js/crypto';
import {createTransaction,encodeTransaction,SignedTransaction,Signature,actionCreators} from '@near-js/transactions';
import {baseDecode,baseEncode} from '@near-js/utils';
import {mainnetPayment} from './market-mainnet-rpc.js';
const accounts={smith:'tor.nuvelorian.near',hunter:'grym.nuvelorian.near'};
const fail=code=>{throw Object.assign(new Error(code),{code,statusCode:409});};
export function claimAgentPayment(order,claim,now=Date.now()){
 if(order.status!=='awaiting_payment'||order.signedTx)return false;
 const claimedAt=Number(order.signingClaimAt)||Date.parse(order.createdAt)||0;
 if(order.signingClaim&&now-claimedAt<60000)return false;
 order.signingClaim=claim;order.signingClaimAt=now;return true;
}
export function agentSecrets(){
 const path=process.env.MARKET_AGENT_KEYS_FILE;if(!path)return null;
 const mode=statSync(path).mode;if(process.platform!=='win32'&&(mode&0o077))fail('AGENT_KEY_FILE_PERMISSIONS');
 const data=JSON.parse(readFileSync(path,'utf8'));
 for(const [key,account] of Object.entries(accounts))if(data.agents?.[key]?.accountId!==account||!/^ed25519:/.test(data.agents[key].privateKey||''))fail('AGENT_KEY_CONFIG_INVALID');
 return data;
}
export function createAgentSigner({fetchImpl=fetch,secrets=agentSecrets,authorize=async()=>false}={}){
 async function rpc(method,params){
  const response=await fetchImpl('https://free.rpc.fastnear.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'p4-agent-mainnet',method,params}),signal:AbortSignal.timeout(15000)});
  const result=await response.json();if(!response.ok||result.error)fail('AGENT_RPC_UNCERTAIN');return result.result;
 }
 return {
  configured(){return Boolean(secrets());},
  async prepare(order,key){
   if(order.buyerWallet!==accounts[key]||order.feeRecipient!=='nuvelorian.near'||order.network&&order.network!=='mainnet'||!await authorize(order,key))fail('AGENT_SIGNER_SCOPE');
   const config=secrets();if(!config)fail('AGENT_SIGNER_NOT_CONFIGURED');
   if((await rpc('status',[])).chain_id!=='mainnet')fail('WRONG_CHAIN');
   const pair=KeyPair.fromString(config.agents[key].privateKey),publicKey=pair.getPublicKey();
   const access=await rpc('query',{request_type:'view_access_key',account_id:accounts[key],public_key:publicKey.toString(),finality:'final'});
   if(access.permission!=='FullAccess')fail('AGENT_KEY_NOT_FULL_ACCESS');
   const intent=mainnetPayment(order);
   const actions=intent.actions.map(a=>actionCreators.functionCall('ft_transfer',a.params.args,30000000000000n,1n));
   const tx=createTransaction(intent.signerId,publicKey,intent.receiverId,BigInt(access.nonce)+1n,actions,baseDecode(access.block_hash));
   const digest=createHash('sha256').update(encodeTransaction(tx)).digest(),signed=pair.sign(digest);
   const transaction=new SignedTransaction({transaction:tx,signature:new Signature({keyType:0,data:signed.signature})});
   return {txHash:baseEncode(digest),signedTx:Buffer.from(transaction.encode()).toString('base64')};
  },
  async broadcast(prepared){return rpc('send_tx',{signed_tx_base64:prepared.signedTx,wait_until:'FINAL'});},
 };
}
