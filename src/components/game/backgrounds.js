import { translateUiText } from '@/lib/uiTextTranslations';
import epicBackground from '@/assets/hero/bp epic set/setbp1-bg+anim.png';
import legendaryBackground from '@/assets/hero/bp leg set/setbp2-background.png';
import heroBackground from '@/assets/optimized/camp/hero-background.webp';
import bossFightBackground from '@/assets/boss/boss_1/boss1_bck/background.png';
import bossTwoFightBackground from '@/assets/boss/boss_1/boss1_bck/background_b2.png';
import bossThreeFightBackground from '@/assets/optimized/all/boss/boss_1/boss1_bck/background3.webp';
import bossFourFightBackground from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/background4.webp';
import bossFiveFightBackground from '@/assets/optimized/all/boss/boss_1/boss1_bck/background5.webp';
import bossSixFightBackground from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/background-kosmo.webp';
import { GAME_CONFIG, getLocalizedBossName } from '@/lib/gameConfig';
import { BOSS_BACKGROUND_REWARDS } from '@/lib/lootBoxes';
import { SHKRABAN_ENABLED, SHKRABAN_BACKGROUND_ID, SHKRABAN_ROOT } from '@/lib/shkrabanContent';

export const CAMP_BACKGROUNDS = {
  'bp-legendary': {id:'bp-legendary',name:'Лавова печера',source:legendaryBackground,unlockLabel:'Legendary Battle Pass · рівень 40'},
  'bp-epic': { id: 'bp-epic', name: 'Воронячий вихор', source: epicBackground, unlockLabel: 'Epic Battle Pass · рівень 40' },
  garage: {
    id: 'garage',
    name: 'Гараж',
    source: heroBackground,
    unlockLabel: 'Стартовий фон',
  },
  'boss-fight': {
    id: 'boss-fight',
    name: 'Сцена бою з босом',
    source: bossFightBackground,
    bossId: 'heli',
    animatedScene: 'boss1',
    unlockLabel: 'Рідкісний дроп з Недоважка',
  },
  'boss-2-fight': {
    id: 'boss-2-fight',
    name: 'Сцена бою з Міллю',
    source: bossTwoFightBackground,
    bossId: 'tank',
    animatedScene: 'boss2',
    unlockLabel: 'Рідкісний дроп з Міллі',
  },
  'boss-3-fight': {
    id: 'boss-3-fight',
    name: 'Сцена бою з Шорком',
    source: bossThreeFightBackground,
    bossId: 'chinook',
    animatedScene: 'boss3',
    unlockLabel: 'Рідкісний дроп з Шорка',
  },
  'boss-4-fight': {
    id: 'boss-4-fight',
    name: 'Сцена бою з Глистою',
    source: bossFourFightBackground,
    bossId: 'boss4',
    animatedScene: 'boss4',
    unlockLabel: 'Рідкісний дроп з Глисти',
  },
  'boss-5-fight': {
    id: 'boss-5-fight',
    name: 'Сцена бою зі Спорголом',
    source: bossFiveFightBackground,
    bossId: 'boss5',
    animatedScene: 'boss5',
    unlockLabel: 'Рідкісний дроп зі Споргола',
  },
  'boss-6-fight': {
    id: 'boss-6-fight',
    name: 'Сцена бою із Засмоктом',
    source: bossSixFightBackground,
    bossId: 'boss6',
    animatedScene: 'boss6',
    unlockLabel: 'Рідкісний дроп із Засмокта',
  },
  'boss-7-fight': {
    id: 'boss-7-fight', name: 'Храм Клеопатреш', source: '/boss7-scene/arena.webp', bossId: 'boss7', animatedScene: 'boss7', unlockLabel: 'Рідкісний дроп з Клеопатреш',
  },
  ...(SHKRABAN_ENABLED ? {
    [SHKRABAN_BACKGROUND_ID]: {
      id: SHKRABAN_BACKGROUND_ID, name: 'Дах піратського ефіру',
      source: `${SHKRABAN_ROOT}/boss-rooftop-city-v2.webp`, bossId: 'boss8',
      unlockLabel: 'Рідкісний дроп зі Шкрябана',
    },
  } : {}),
};

export function getCampBackgroundById(backgroundId) {
  return CAMP_BACKGROUNDS[backgroundId] || CAMP_BACKGROUNDS.garage;
}

export function getUnlockedCampBackgrounds(profile) {
  const unlocked = profile?.unlocked_backgrounds;
  if (Array.isArray(unlocked) && unlocked.length > 0) {
    return Array.from(new Set(['garage', ...unlocked.filter((backgroundId) => Boolean(CAMP_BACKGROUNDS[backgroundId]))]));
  }

  return ['garage'];
}

export function getBossBackgroundDropDescription(boss, language = 'uk', isUnlocked = false) {
  if (!boss) return '';

  const locale = language === 'ru' || language === 'en' ? language : 'uk';
  const bossName = getLocalizedBossName(boss, locale);
  const chance = `${Math.round((BOSS_BACKGROUND_REWARDS[boss.id]?.dropChance || 0) * 100)}%`;

  if (isUnlocked) {
    return {
      uk: `Отримано з боса «${bossName}»`,
      ru: `Получено с босса «${bossName}»`,
      en: `Received from «${bossName}»`,
    }[locale];
  }

  return {
    uk: `Можна отримати: ${chance} шанс після перемоги над босом «${bossName}»`,
    ru: `Можно получить: шанс ${chance} после победы над боссом «${bossName}»`,
    en: `Available as a ${chance} drop after defeating «${bossName}»`,
  }[locale];
}

export function getCampBackgroundName(background,language) {
 if(background?.bossId) {
  const name=getLocalizedBossName(GAME_CONFIG.BOSSES.find(boss=>boss.id===background.bossId),language);
  return language==='en'?`Battle Scene: ${name}`:language==='ru'?`Сцена боя: ${name}`:`Сцена бою: ${name}`;
 }
 return translateUiText(background?.name,language);
}
