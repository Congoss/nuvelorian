export function getClanJoinState(profile, clan, language = 'uk') {
  const lang = language === 'ru' || language === 'en' ? language : 'uk';
  const copy = {
    uk: { member: 'ВИ В ЦЬОМУ КЛАНІ', occupied: 'ВИ ВЖЕ В КЛАНІ', request: 'ПОДАТИ ЗАЯВУ', join: 'ВСТУПИТИ', closed: 'КЛАН ЗАКРИТИЙ' },
    ru: { member: 'ВЫ В ЭТОМ КЛАНЕ', occupied: 'ВЫ УЖЕ В КЛАНЕ', request: 'ПОДАТЬ ЗАЯВКУ', join: 'ВСТУПИТЬ', closed: 'КЛАН ЗАКРЫТ' },
    en: { member: 'YOU ARE IN THIS CLAN', occupied: 'ALREADY IN A CLAN', request: 'APPLY', join: 'JOIN', closed: 'CLAN CLOSED' },
  }[lang];
  const hasClan = Boolean(profile?.clan_id || profile?.clan_name);
  const ownClan = hasClan && ((profile?.clan_id && clan?.id && String(profile.clan_id) === String(clan.id)) || (profile?.clan_name && clan?.name && profile.clan_name.trim().toLowerCase() === clan.name.trim().toLowerCase()));
  const type = clan?.join_type || 'open';
  return { disabled: hasClan || type === 'invite', label: ownClan ? copy.member : hasClan ? copy.occupied : type === 'request' ? copy.request : type === 'invite' ? copy.closed : copy.join };
}
