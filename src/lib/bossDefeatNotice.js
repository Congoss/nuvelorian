export function bossDefeatNotice(box, language = 'uk') {
  if (!box?.bossDefeated && box?.rewardFormula !== 'boss_v2') return '';
  const name = box.lastHitPlayerName;
  if (language === 'ru') return 'Босс побеждён!' + (name ? ' Последний удар нанёс: ' + name + '.' : '');
  if (language === 'en') return 'Boss defeated!' + (name ? ' Final hit by: ' + name + '.' : '');
  return 'Бос переможений!' + (name ? ' Останній удар завдав: ' + name + '.' : '');
}
