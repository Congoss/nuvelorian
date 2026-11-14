import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

// Unapproved balance is deliberately absent. Overrides belong only to the sandbox.
export const ENHANCEMENT_CONFIG = Object.freeze({
  unlockLevel:70,maxLevel:15,
  normalChances:Object.freeze([90,85,80,75,70,65,60,55,50,45,40,35,30,25,20]),
  improvedChances:Object.freeze([95,92,89,86,83,80,75,70,65,60,55,50,45,40,30]),
  poisonPctPerLevel:1,premiumStars:99,premiumUsd:.99,
});
const fail=(code,status=400)=>{throw Object.assign(new Error(code),{statusCode:status});};
export function createEnhancementDemo({file=null,rng=Math.random}={}) {
  let owners=file&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
  function save(next){if(file){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(next));fs.renameSync(tmp,file);}owners=next;}
  function get(owner,itemId='demo-weapon'){
    if(!/^[a-zA-Z0-9-]{16,80}$/.test(owner||''))fail('INVALID_DEMO_SESSION',401);
    if(typeof itemId!=='string'||!itemId||itemId.length>160)fail('INVALID_ITEM');
    const next=structuredClone(owners);
    const state=next[owner]??={level:70,gums:{normal:9999,improved:9999,premium:9999},sandboxSupplyVersion:1,stars:999,items:[],receipts:{},settings:{normal:null,improved:null,pct:ENHANCEMENT_CONFIG.poisonPctPerLevel},bossClaims:0};
    if(Number(state.sandboxSupplyVersion||0)<1){state.gums={normal:9999,improved:9999,premium:9999};state.sandboxSupplyVersion=1;}
    state.settings??={};
    // Migrate the former flat prototype chances to the level-based server table.
    if(state.settings.normal===55)state.settings.normal=null;
    if(state.settings.improved===70)state.settings.improved=null;
    if(state.settings.pct==null)state.settings.pct=ENHANCEMENT_CONFIG.poisonPctPerLevel;
    if(!state.items.some(i=>i.itemId===itemId))for(let n=0;n<2;n++)state.items.push({instanceId:randomUUID(),itemId,enhancementLevel:0,version:0});
    save(next);return structuredClone(state);
  }
  function act(owner,body){
    if(!owners[owner])fail('INVALID_DEMO_SESSION',401);
    if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId||''))fail('REQUEST_ID_REQUIRED');
    const fingerprint=createHash('sha256').update(JSON.stringify(body)).digest('hex');
    const prior=owners[owner].receipts[body.requestId];
    if(prior){if(prior.fingerprint!==fingerprint)fail('REQUEST_ID_REUSED',409);return {state:structuredClone(owners[owner]),result:prior.result,replayed:true};}
    const next=structuredClone(owners),state=next[owner];let result;
    if(body.action==='settings'){
      const settings=body.settings||{};
      for(const key of ['normal','improved','pct'])if(settings[key]!==null&&(!Number.isFinite(settings[key])||settings[key]<0||settings[key]>(key==='pct'?10:100)))fail('INVALID_TEST_SETTINGS');
      if(settings.normal!==null&&settings.improved!==null&&settings.improved<settings.normal)fail('IMPROVED_CHANCE_TOO_LOW');
      if(!Number.isInteger(body.level)||body.level<1||body.level>1000)fail('INVALID_LEVEL');
      state.settings={normal:settings.normal,improved:settings.improved,pct:settings.pct};state.level=body.level;result={type:'settings'};
    }else if(body.action==='buy'){
      const quantity=body.quantity??1;
      if(![1,5,15].includes(quantity))fail('INVALID_PACK');
      const cost=ENHANCEMENT_CONFIG.premiumStars*quantity;
      if(state.stars<cost)fail('NOT_ENOUGH_STARS');
      state.stars-=cost;state.gums.premium+=quantity;result={type:'buy',quantity,cost};
    }else if(body.action==='boss'){
      const roll=rng();const gum=roll<.05?'normal':roll<.06?'improved':null;
      if(gum)state.gums[gum]++;state.bossClaims++;result={type:'boss',gum};
    }else if(body.action==='enhance'){
      if(state.level<70)fail('LEVEL_70_REQUIRED',403);
      const item=state.items.find(i=>i.instanceId===body.instanceId);if(!item)fail('ITEM_NOT_OWNED',403);
      if(item.version!==body.version)fail('STALE_ITEM',409);
      if(item.enhancementLevel>=15)fail('MAX_ENHANCEMENT');
      if(!['normal','improved','premium'].includes(body.gum))fail('INVALID_GUM');
      if(state.gums[body.gum]<1)fail('NO_GUM');
      const configured=body.gum==='normal'?ENHANCEMENT_CONFIG.normalChances:ENHANCEMENT_CONFIG.improvedChances;
      const chance=body.gum==='premium'?100:(state.settings[body.gum]??configured[item.enhancementLevel]);
      if(chance===null)fail('BALANCE_NOT_APPROVED');
      const success=body.gum==='premium'||rng()*100<chance;
      const before=item.enhancementLevel;state.gums[body.gum]--;
      item.enhancementLevel=success?before+1:Math.max(0,before-1);item.version++;
      result={type:'enhance',instanceId:item.instanceId,gum:body.gum,chance,success,before,after:item.enhancementLevel};
    }else fail('UNKNOWN_ACTION');
    state.receipts[body.requestId]={fingerprint,result,at:new Date().toISOString()};
    // Commit the debit, item change and durable receipt together, before responding.
    save(next);return {state:structuredClone(state),result};
  }
  return {get,act};
}
