export function getUnreadMailCount(profile) {
  const giftReadIds = new Set((profile?.gift_mail_read_ids || []).map(String));
  const clanReadIds = new Set((profile?.clan_mail_read_ids || []).map(String));
  const gifts = (Array.isArray(profile?.gift_mail) ? profile.gift_mail : [])
    .filter((mail) => mail?.id && !giftReadIds.has(String(mail.id))).length;
  const clan = (Array.isArray(profile?.clan_mail) ? profile.clan_mail : [])
    .filter((mail) => mail?.id && !clanReadIds.has(String(mail.id))).length;
  const boxes = Array.isArray(profile?.pending_boss_boxes) ? profile.pending_boss_boxes.length : 0;
  return gifts + clan + boxes;
}

export function getClanMailReadIds(profile) {
  const existing = Array.isArray(profile?.clan_mail_read_ids) ? profile.clan_mail_read_ids.map(String) : [];
  const ids = (Array.isArray(profile?.clan_mail) ? profile.clan_mail : []).map(mail => String(mail?.id || '')).filter(Boolean);
  return [...new Set([...existing, ...ids])].slice(-200);
}

export function getGiftMailReadIds(profile) {
  const existing = Array.isArray(profile?.gift_mail_read_ids) ? profile.gift_mail_read_ids.map(String) : [];
  const ids = (Array.isArray(profile?.gift_mail) ? profile.gift_mail : []).map((mail) => String(mail?.id || '')).filter(Boolean);
  return [...new Set([...existing, ...ids])].slice(-200);
}
