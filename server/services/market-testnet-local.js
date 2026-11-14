import {existsSync,readFileSync,mkdirSync,writeFileSync,renameSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {settlementConfig,createTestnetFtReader} from './market-testnet-rpc.js';
import {createTestnetSettlement} from './market-testnet-settlement.js';
let service;
const keys=['MARKET_TESTNET_TOKEN','MARKET_TESTNET_VAULT','MARKET_TESTNET_SELLER','MARKET_TESTNET_FEE_RECIPIENT','MARKET_TESTNET_BUYER','MARKET_TESTNET_DECIMALS'];
export function testnetSetupStatus(env=process.env){
  const missing=keys.filter(key=>!String(env[key] || '').trim());
  if(env.MARKET_TESTNET_SETTLEMENT!=='1')missing.unshift('MARKET_TESTNET_SETTLEMENT');
  let error=null;if(!missing.length)try{settlementConfig(env);}catch(failure){error=failure.code || failure.message;}
  return {mode:'testnet-rehearsal',network:'testnet',ready:missing.length===0&&!error,missing,error,signingEnabled:false,productionInventory:false};
}
export function localTestnetService(){
  if(process.env.NODE_ENV==='production'||process.env.LOCAL_MARKET_TEST!=='1')throw Object.assign(new Error('LOCAL_ONLY'),{statusCode:403});
  if(service)return service;
  const config=settlementConfig();
  const file=resolve('.local/market-testnet-settlement.json');
  const state=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):undefined;
  const save=draft=>{
    mkdirSync(dirname(file),{recursive:true});const temp=file+'.'+process.pid+'.tmp';
    writeFileSync(temp,JSON.stringify(draft));const fd=openSync(temp,'r+');try{fsyncSync(fd);}finally{closeSync(fd);}
    renameSync(temp,file);return true;
  };
  service=createTestnetSettlement({config,state,save,reader:createTestnetFtReader()});
  return service;
}
