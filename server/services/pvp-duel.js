import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {duelStats,demoDuelProfile,DUEL_ACTIONS,DUEL_BEATS} from '../../src/lib/pvpDuel.js';
import {PVP_SERIES_SIZE,PVP_COOLDOWN_MS,PVP_MIN_RATING_CHANGE,PVP_MAX_RATING_CHANGE} from '../../src/lib/pvpRanks.js';
const PILOT_NAMES={
 Тор:{uk:'Тор',ru:'Тор',en:'Tor'},Шплінт:{uk:'Шплінт',ru:'Шплинт',en:'Splint'},Дим:{uk:'Дим',ru:'Дым',en:'Smoke'},
 Реле:{uk:'Реле',ru:'Реле',en:'Relay'},Бляха:{uk:'Бляха',ru:'Бляха',en:'Tin'},Клема:{uk:'Клема',ru:'Клемма',en:'Terminal'},
 Котушка:{uk:'Котушка',ru:'Катушка',en:'Coil'},Грим:{uk:'Грим',ru:'Грим',en:'Grym'},Іскра:{uk:'Іскра',ru:'Искра',en:'Spark'},
 Дротик:{uk:'Дротик',ru:'Дротик',en:'Dart'},Клаксон:{uk:'Клаксон',ru:'Клаксон',en:'Klaxon'},Кліщ:{uk:'Кліщ',ru:'Клещ',en:'Tick'},
 Радар:{uk:'Радар',ru:'Радар',en:'Radar'},Жук:{uk:'Жук',ru:'Жук',en:'Beetle'},Ірис:{uk:'Ірис',ru:'Ирис',en:'Iris'},
 Флюс:{uk:'Флюс',ru:'Флюс',en:'Flux'},Тюбик:{uk:'Тюбик',ru:'Тюбик',en:'Tube'},Латка:{uk:'Латка',ru:'Латка',en:'Patch'},
 Клапан:{uk:'Клапан',ru:'Клапан',en:'Valve'},Шум:{uk:'Шум',ru:'Шум',en:'Noise'},
};
export const PVP_AI_PILOTS=[
 ...['Тор','Шплінт','Дим','Реле','Бляха','Клема','Котушка'].map((id,i)=>({id,name:id,names:PILOT_NAMES[id],style:'balanced',bias:i*.005})),
 ...['Грим','Іскра','Дротик','Клаксон','Кліщ','Радар','Жук'].map((id,i)=>({id,name:id,names:PILOT_NAMES[id],style:'counter',bias:.04-i*.005})),
 ...['Ірис','Флюс','Тюбик','Латка','Клапан','Шум'].map((id,i)=>({id,name:id,names:PILOT_NAMES[id],style:'tricky',bias:-.04+i*.005})),
];
export const pilotDisplayName=(pilot,lang)=>pilot?.names?.[lang==='ua'?'uk':lang]||pilot?.names?.uk||pilot?.name||'';
const bots=PVP_AI_PILOTS;
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
export const duelCommitment=(m,round,choice,nonce)=>createHash('sha256').update(`${m}:${round}:${choice}:${nonce}`).digest('hex');
const hash=duelCommitment;
export function chooseDuelAiMove(bot,history,random=Math.random){
 let choice=DUEL_ACTIONS[Math.floor(random()*3)%3];
 if(bot.style==='counter'&&history.length>=2&&random()<.65){const counts=Object.fromEntries(DUEL_ACTIONS.map(a=>[a,history.slice(-4).filter(h=>h.playerChoice===a).length]));const frequent=DUEL_ACTIONS.reduce((best,a)=>counts[a]>counts[best]?a:best,DUEL_ACTIONS[0]);choice=DUEL_ACTIONS.find(a=>DUEL_BEATS[a]===frequent);}
 if(bot.style==='tricky'&&history.length&&random()<.5)choice=DUEL_BEATS[history.at(-1).playerChoice];
 return choice;
}
const maxBotBias=Math.max(...bots.map(bot=>Math.abs(bot.bias)));
// Market merchants who also duel: Tor (smith) and Grym (hunter). A win against them
// can pay a small prize funded from their realised market profit (pvp-bounty.js).
const MERCHANT_BOTS={smith:'Тор',hunter:'Грим'};
for(const [agentKey,name] of Object.entries(MERCHANT_BOTS))Object.assign(bots.find(b=>b.name===name),{agentKey,merchant:true});
export function createDuelService({random=Math.random,now=Date.now,bounty=null}={}){
 const sessions=new Map();
 const profiles=new Map();
 function progress(profile){
  if(profile.readyAt&&profile.readyAt<=now()){
   const restored=1+Math.floor((now()-profile.readyAt)/PVP_COOLDOWN_MS);
   profile.attempts=Math.min(PVP_SERIES_SIZE,profile.attempts+restored);
   profile.readyAt=profile.attempts===PVP_SERIES_SIZE?0:profile.readyAt+restored*PVP_COOLDOWN_MS;
  }
  return profile;
 }
 function finish(match,result,at=now()){
  match.status='finished';match.result=result;
  const p=match.profile;
  const direction=result==='win'?1:result==='loss'?-1:0;
  const difficulty=(1+direction*match.bot.bias/maxBotBias)/2;
  const points=Math.round(PVP_MIN_RATING_CHANGE+difficulty*(PVP_MAX_RATING_CHANGE-PVP_MIN_RATING_CHANGE));
  match.rating=Math.max(0,p.rating+direction*points);
  match.ratingDelta=match.rating-p.rating;
  p.rating=match.rating;
  p.played=true;
  p.history.unshift({id:match.id,opponent:match.bot.name,result,delta:match.ratingDelta,at});
  p.history.length=Math.min(p.history.length,12);
  if(!p.attempts&&!p.readyAt)p.readyAt=at+PVP_COOLDOWN_MS;
  // Prize only on a real win; the ledger re-checks profit share and caps at payout.
  if(match.bounty&&bounty)match.bounty={...match.bounty,award:result==='win'?bounty.award({matchId:match.id,playerKey:match.key,agentKey:match.bot.agentKey}):null};
 }
 function current(key){
  const match=sessions.get(key);
  if(match&&match.expiresAt<=now()){
   if(match.status==='active')finish(match,'loss',match.expiresAt);
   sessions.delete(key);return null;
  }
  return match;
 }
 function commit(m){const choice=chooseDuelAiMove(m.bot,m.history,random);
  m.secret={choice,nonce:randomBytes(20).toString('hex')};m.commitment=hash(m.id,m.round,choice,m.secret.nonce);
 }
 function publicMatch(m){return {id:m.id,round:m.round,status:m.status,result:m.result,rating:m.rating,ratingDelta:m.ratingDelta,ranked:m.ranked,player:{name:m.playerName,...m.player},opponent:{name:m.bot.name,style:m.bot.style,kind:'ai',...m.opponent},commitment:m.commitment,history:m.history.slice(-30),expiresAt:m.expiresAt,bounty:m.bounty?{merchant:m.bounty.merchant,amount:m.bounty.amount,award:m.bounty.award?{amount:m.bounty.award.amount,status:m.bounty.award.status}:m.bounty.award}:null};}
 return {read(key){const m=current(key);return m&&m.status!=='abandoned'?publicMatch(m):null;},
 standings(key){
  current(key);
  const p=profiles.get(key);
  if(p)progress(p);
  const ranked=[...profiles.values()].filter(entry=>entry.played).sort((a,b)=>b.rating-a.rating||a.number-b.number);
  const row=(entry,index)=>({number:entry.number,rating:entry.rating,position:index+1,self:entry===p});
  const ownIndex=ranked.indexOf(p);
  const leaders=ranked.slice(0,10).map(row);
  if(ownIndex>=10)leaders.push(row(p,ownIndex));
  return {rating:p?.rating??0,attempts:p?.attempts??PVP_SERIES_SIZE,readyAt:p?.readyAt??0,serverTime:now(),history:p?.history??[],leaders,
   merchants:bounty?bounty.summary(key).map(({agentKey,merchant,offer})=>({agentKey,merchant,prize:offer?.amount??0})):[]};
 },
 start(key,preset,{merchant}={}){
  for(const k of sessions.keys())current(k);
  if(profiles.size>=100&&!profiles.has(key))fail('TOO_MANY_DUELS');
  const existing=current(key);if(existing?.status==='active')return publicMatch(existing);
  const profile=demoDuelProfile(preset),stats=duelStats(profile);
  const p=progress(profiles.get(key)||{number:profiles.size+1,rating:0,attempts:PVP_SERIES_SIZE,readyAt:0,opponents:new Set(),history:[]});
  if(!p.attempts)fail('PVP_COOLDOWN');
  let bot;
  if(merchant!==undefined&&merchant!==null){
   bot=bots.find(b=>b.merchant&&b.agentKey===merchant);if(!bot)fail('UNKNOWN_MERCHANT');
  }else{
   const previous=p.opponents.size===bots.length?p.lastOpponent:null;
   if(previous)p.opponents.clear();
   const eligible=bots.filter(bot=>!p.opponents.has(bot.name)&&bot.name!==previous);
   bot=eligible[Math.floor(random()*eligible.length)%eligible.length];
  }
  p.attempts--;p.opponents.add(bot.name);p.lastOpponent=bot.name;
  if(!p.readyAt)p.readyAt=now()+PVP_COOLDOWN_MS;
  profiles.set(key,p);
  const opponent={...stats,attack:Math.round(stats.attack*(1+bot.bias)),maxHp:Math.round(stats.maxHp*(1+bot.bias))};
  const m={id:randomUUID(),playerName:profile.nickname,round:1,status:'active',ranked:true,profile:p,rating:p.rating,ratingDelta:0,player:{...stats,hp:stats.maxHp},opponent:{...opponent,hp:opponent.maxHp},bot,key,history:[],expiresAt:now()+30*60000};
  // Offer is a snapshot shown before the fight; the payout itself is decided in finish().
  const offer=bot.merchant&&bounty?bounty.quote(key,bot.agentKey):null;
  m.bounty=offer?{merchant:offer.merchant,amount:offer.amount,award:undefined}:null;
  commit(m);sessions.set(key,m);return publicMatch(m);
 },
 choose(key,{matchId,round,choice}){const m=current(key);if(!m)fail('DUEL_EXPIRED');if(m.id!==matchId)fail('WRONG_DUEL');if(!DUEL_ACTIONS.includes(choice))fail('INVALID_CHOICE');
  const prior=m.history.find(h=>h.round===round);if(prior){if(prior.playerChoice!==choice)fail('ROUND_ALREADY_PLAYED');return publicMatch(m);}
  if(m.status!=='active'||m.round!==round)fail('STALE_ROUND');
  const enemy=m.secret.choice,winner=choice===enemy?'draw':DUEL_BEATS[choice]===enemy?'player':'opponent';
  const damage=winner==='player'?m.player.attack:winner==='opponent'?m.opponent.attack:0;
  if(winner==='player')m.opponent.hp=Math.max(0,m.opponent.hp-damage);if(winner==='opponent')m.player.hp=Math.max(0,m.player.hp-damage);
  m.history.push({round,playerChoice:choice,opponentChoice:enemy,winner,damage,commitment:m.commitment,nonce:m.secret.nonce});
  if(!m.player.hp||!m.opponent.hp)finish(m,m.player.hp?'win':'loss');
  else if(m.round>=30)finish(m,'draw');else{m.round++;commit(m);}return publicMatch(m);
 },abandon(key){const match=current(key);if(match?.status==='active'){finish(match,'loss');match.status='abandoned';}}};
}
