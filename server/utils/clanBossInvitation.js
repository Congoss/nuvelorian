const key=value=>String(value||'').trim().toLowerCase();
const name=value=>key(value).replace(/\s+/g,' ');
export function hasClanBossInvitation(player,fight,messages=[]) {
 if(!player||!fight||fight.solo===true)return false;
 const matches=(clanId,clanName)=>clanId&&player.clan_id?key(clanId)===key(player.clan_id):Boolean(name(clanName)&&name(clanName)===name(player.clan_name));
 if(fight.clan_invite_sent_at&&(fight.clan_invite_clan_id||fight.clan_invite_clan_name))return matches(fight.clan_invite_clan_id,fight.clan_invite_clan_name);
 return messages.some(message=>message.kind==='boss_fight_invite'&&message.channel==='clan'&&String(message.bossFightInvite?.fightId)===String(fight.id)&&matches(message.bossFightInvite?.clanId||message.clan_id,message.clan));
}
export function isJoinableBossFight(fight,now=Date.now()) {
 const deadline=Date.parse(fight?.ends_at||'');
 return Boolean(fight&&fight.status==='active'&&Number(fight.current_hp)>0&&(!Number.isFinite(deadline)||deadline>now));
}
