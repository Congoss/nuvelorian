import { getActiveBattlePassTier } from './battlePass.js';
export function publicClanFields(clan){
 const {ship,...publicFields}=clan;
 return {...publicFields,...(ship?{ship:{name:ship.name||'',progress:ship.progress||{},kills:ship.kills||{}}}:{})};
}
export function publicClanMember(player){
 const fields=['id','username','nickname','avatar','photoUrl','photo_url','level','hero_tier','stat_strength','power','attack_power','clan_power','clan_id','clan_name','clan_logo_id','avatar_frame_id','profile_header_theme','selected_avatar_frame','unlocked_avatar_frames','last_login_date','clan_joined_at','created_date'];
 const tier=getActiveBattlePassTier(player);
 return {...Object.fromEntries(fields.filter(key=>Object.hasOwn(player,key)).map(key=>[key,player[key]])),battle_pass_view:{tier}};
}
