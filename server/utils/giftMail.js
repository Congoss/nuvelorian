import { grantHalloweenPumpkins, halloweenActive } from '../../src/lib/halloweenEvent.js';
import { BOSS_KEY_REWARDS, getBossKeyReward } from '../../src/lib/bossKeyRewards.js';
export const GIFT_REWARD_FIELDS = new Set([
  'enhancement_gum_normal','enhancement_gum_improved','enhancement_gum_premium',
  'halloween_pumpkin', 'tentacles', 'xp', 'premium', 'energy', 'stat_strength',
  'small_poison', 'medium_poison', 'large_poison', 'roulette_bonus_spins',
  ...BOSS_KEY_REWARDS.map(reward=>reward.field),
]);

function localizedMailText(value, language, depth = 0) {
  if (depth > 3 || value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (typeof value !== 'object' || Array.isArray(value)) return '';
  const candidates = language === 'uk'
    ? [value.uk, value.ua, value.en, value.ru]
    : language === 'ru'
      ? [value.ru, value.en, value.uk, value.ua]
      : [value.en, value.uk, value.ua, value.ru];
  for (const candidate of candidates) {
    const text = localizedMailText(candidate, language, depth + 1);
    if (text) return text;
  }
  return '';
}

export function normalizeGiftMailContent(value, fallback, maxLength) {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim().slice(0, maxLength) || fallback;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const localized = Object.fromEntries(['uk', 'ru', 'en'].map((language) => [
      language,
      localizedMailText(value, language).slice(0, maxLength),
    ]));
    if (Object.values(localized).some(Boolean)) return localized;
  }
  return fallback;
}

export function normalizeGiftRewards(rows = []) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 12) {
    throw Object.assign(new Error('Choose between 1 and 12 gift rewards'), { statusCode: 400, code: 'GIFT_INVALID' });
  }
  const rewards = rows.map((row) => ({ field: String(row?.field || ''), amount: Number(row?.amount) }));
  if (rewards.some(({ field, amount }) => !GIFT_REWARD_FIELDS.has(field) || !Number.isSafeInteger(amount) || amount <= 0)) {
    throw Object.assign(new Error('Invalid gift resource'), { statusCode: 400, code: 'GIFT_INVALID' });
  }
  return rewards;
}

export function claimGiftMail(player, mailId, grantXp = () => {}) {
  const id = String(mailId || '').trim();
  const mails = Array.isArray(player?.gift_mail) ? player.gift_mail : [];
  const mail = mails.find((entry) => String(entry?.id || '') === id);
  if (!mail) return { alreadyClaimed: true, rewards: [] };

  const rewards = Array.isArray(mail.rewards) && mail.rewards.length ? normalizeGiftRewards(mail.rewards) : [];
  if (rewards.some(row => row.field === 'halloween_pumpkin') && !halloweenActive()) {
    throw Object.assign(new Error('Halloween pumpkin reward is only available during the event'), { statusCode: 400, code: 'HALLOWEEN_CLOSED' });
  }
  for (const { field, amount } of rewards) {
    const bossKey=getBossKeyReward(field);
    if(bossKey){player.keycards={...(player.keycards||{}),[bossKey.location]:Number(player.keycards?.[bossKey.location]||0)+amount};}
    else if(field.startsWith('enhancement_gum_')){const gum=field.slice('enhancement_gum_'.length);player.enhancement_gums={...player.enhancement_gums,[gum]:Number(player.enhancement_gums?.[gum]||0)+amount};}
    else if (field.endsWith('_poison')) {
      const inventoryKey = field.replace('_', '-');
      player.weapon_inventory = {
        ...(player.weapon_inventory || {}),
        [inventoryKey]: Number(player.weapon_inventory?.[inventoryKey] || 0) + amount,
      };
    } else if (field === 'halloween_pumpkin') grantHalloweenPumpkins(player, amount);
    else if (field === 'xp') grantXp(player, amount);
    else player[field] = Number(player[field] || 0) + amount;
  }
  player.gift_mail = mails.filter((entry) => String(entry?.id || '') !== id);
  return { alreadyClaimed: false, rewards, legacy: rewards.length === 0 };
}
