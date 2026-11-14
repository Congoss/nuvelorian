import { isOlderCombatSnapshot } from './combatSnapshotOrder.js';
// Polls and attacks may return combat fields only; keep appearance and equipment from open.
export function mergeShipCombatResponse(previous,next){
 // Ship bosses never heal within a fight. A late poll/open response must not
 // roll back confirmed damage, inventory or talent flags from a newer attack.
 if (isOlderCombatSnapshot(previous, next)) return previous;
 const merged=!previous||!next ? next||previous : {...previous,...next,player:{...previous.player,...next.player}};
 const fight=merged?.fight;
 // Confirmed zero HP is terminal, including compact sync responses.
 if(fight?.status==='active'&&fight.current_hp!=null&&Number(fight.current_hp)<=0)return {...merged,fight:{...fight,current_hp:0,status:'dead'}};
 return merged;
}
export function projectPendingShipFight(fight,damage){
 if(!fight||fight.status!=='active'||!(damage>0))return fight;
 // A lethal tap may show 0 HP at once, but the fight stays 'active' and
 // client_projected: victory and rewards still wait for server confirmation.
 const hp=Number(fight.current_hp);
 return {...fight,current_hp:Math.max(0,hp-damage),client_projected:true};
}
