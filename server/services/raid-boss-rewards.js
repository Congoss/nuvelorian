export function calculateRaidRewardAmounts(damage, poisonUsed, rates) {
  const damageValue = Math.max(0, Number(damage) || 0);
  const poisonMultiplier = Number(poisonUsed) > 0 ? 1.5 : 1;
  return (Array.isArray(rates) ? rates : [])
    .map(({ field, rate }) => ({ field, amount: Math.round(damageValue / 1000 * Number(rate) * poisonMultiplier) }))
    .filter((reward) => reward.amount > 0);
}

export function getRaidRewardMailCopy(language) {
  const normalizedLanguage = String(language || 'en').toLowerCase().split(/[-_]/)[0];
  if (normalizedLanguage === 'ru') return { title: 'Награда за рейд-босса', text: 'Награда за участие в битве с рейд-боссом.' };
  if (normalizedLanguage === 'uk' || normalizedLanguage === 'ua') return { title: 'Нагорода за рейд-боса', text: 'Нагорода за участь у битві з рейд-босом.' };
  return { title: 'Raid boss reward', text: 'Reward for participating in the Raid Boss battle.' };
}
