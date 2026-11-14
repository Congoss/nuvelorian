import {activeBossFights} from './combatIndexes.js';
export function assertSingleBossFight(store,player,allowedId=null,now=Date.now()){
 const live=f=>f?.status==='active'&&Number(f.current_hp)>0&&(!f.ends_at||Date.parse(f.ends_at)>now);
 const personal=activeBossFights(store.bossFights||[]).find(f=>live(f)&&String(f.id)!==String(allowedId)&&(Boolean(player.created_by)&&String(f.opened_by_email||'').toLowerCase()===String(player.created_by).toLowerCase()||(f.invited_player_ids||[]).map(String).includes(String(player.id))));
 const ship=(store.clans||[]).flatMap(c=>Object.values(c.ship?.fights||{})).find(f=>live(f)&&String(f.id)!==String(allowedId)&&(!(f.escaped_player_ids||[]).map(String).includes(String(player.id)))&&(f.participants?.[player.id]||(f.joined_player_ids||[]).map(String).includes(String(player.id))));
 if(personal||ship)throw Object.assign(new Error('Finish your current boss fight before starting another.'),{code:'BOSS_FIGHT_ALREADY_ACTIVE',statusCode:409});
}
