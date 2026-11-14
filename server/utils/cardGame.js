import { kyivDayKey } from "../../src/lib/kyivDay.js";
import {randomInt,randomUUID} from 'node:crypto';
import {CARD_PRIZES} from '../../src/lib/cardGameConfig.js';
const fail=(code,statusCode=409)=>{throw Object.assign(new Error(code),{code,statusCode});};
export const newCardState=()=>({version:1,starterGranted:false,bonus:0,dailyUsed:null,shownDate:null,paid1:0,paid3:0,payments:{},requests:{},round:null});
const day=now=>kyivDayKey(now);
export function cardStateView(state,now=Date.now()) {
 const r=state.round;
 return {free:state.bonus+(state.dailyUsed===day(now)?0:1),bonus:state.bonus,dailyAvailable:state.dailyUsed!==day(now),paid1:state.paid1,paid3:state.paid3,showDaily:state.shownDate!==day(now),round:r?{id:r.id,mode:r.mode,status:r.status,selected:r.selected,cards:r.mode===3||r.status!=='pending'?r.cards:null}:null};
}
export function creditCardPayment(state,transaction) {
 if(!transaction||transaction.status!=='success'||!['card_play_1','card_play_3'].includes(transaction.item_id))fail('CARD_PAYMENT_INVALID',400);
 if(state.payments[transaction.id])return;
 state[transaction.item_id==='card_play_1'?'paid1':'paid3']++;
 state.payments[transaction.id]=transaction.item_id;
}
function grant(player,state,[kind,icon,amount]) {
 if(kind==='freegame')state.bonus+=amount;
 else if(kind==='gum'||kind==='better')player.enhancement_gums={...player.enhancement_gums,[icon]:Number(player.enhancement_gums?.[icon]||0)+amount};
 else if(['small','medium','large'].includes(kind))player.weapon_inventory={...player.weapon_inventory,[icon]:Number(player.weapon_inventory?.[icon]||0)+amount};
 else {const field=({energy:'energy',spin:'roulette_bonus_spins',paper:'premium',tentacles:'tentacles'})[kind];if(!field)fail('CARD_REWARD_INVALID',500);player[field]=Number(player[field]||0)+amount;}
}
export function applyCardCommand(state,player,command,body={}, {now=Date.now(),rng=()=>randomInt(1000000)/1000000}={}) {
 if(command==='state')return;
 if(command==='shown'){state.shownDate=day(now);return;}
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId||''))fail('REQUEST_ID_REQUIRED',400);
 if(command==='begin'){
  if(![1,3].includes(body.mode))fail('CARD_MODE_INVALID',400);
  if(state.requests[body.requestId])return;
  if(state.round&&state.round.status!=='claimed')return;
  if(body.mode===3){if(state.paid3<1)fail('CARD_PAYMENT_REQUIRED');state.paid3--;}
  else if(state.dailyUsed!==day(now))state.dailyUsed=day(now);
  else if(state.bonus>0)state.bonus--;
  else if(state.paid1>0)state.paid1--;
  else fail('CARD_PAYMENT_REQUIRED');
  const cards=Array.from({length:4},()=>{let roll=rng()*100;return [...(CARD_PRIZES.find(p=>(roll-=p[3])<0)||CARD_PRIZES.at(-1))].slice(0,3);});
  state.round={id:randomUUID(),mode:body.mode,cards,status:'pending',selected:[]};
  state.requests[body.requestId]=state.round.id;
  // Retain every begin receipt: a late retry must never debit a new play.
  return;
 }
 const r=state.round;
 if(!r||r.id!==body.roundId)fail('CARD_ROUND_NOT_FOUND',404);
 if(command==='choose'){
  if(r.mode!==1)fail('CARD_MODE_INVALID',400);
  if(!Number.isInteger(body.index)||body.index<0||body.index>3)fail('CARD_SELECTION_INVALID',400);
  if(r.status!=='pending'){if(r.selected[0]!==body.index)fail('CARD_SELECTION_LOCKED');return;}
  r.selected=[body.index];r.status='chosen';return;
 }
 if(command==='claim'){
  if(r.status==='claimed')return;
  if(r.mode===1&&r.status!=='chosen')fail('CARD_SELECTION_REQUIRED');
  const selected=r.mode===1?r.selected:body.selected;
  if(!Array.isArray(selected)||selected.length!==r.mode||new Set(selected).size!==r.mode||selected.some(i=>!Number.isInteger(i)||i<0||i>3))fail('CARD_SELECTION_INVALID',400);
  selected.forEach(index=>grant(player,state,r.cards[index]));
  r.selected=[...selected];r.status='claimed';return;
 }
 fail('CARD_COMMAND_INVALID',400);
}
