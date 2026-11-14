export const SHIP_BUFFS = [
  {
    "moduleId": "hull",
    "perLevel": 1,
    "unit": "percent",
    "names": {
      "uk": "Нервовий імпульс",
      "ru": "Нервный импульс",
      "en": "Nervous impulse"
    },
    "descriptions": {
      "uk": "Шанс скинути КД Пальця",
      "ru": "Шанс сбросить КД Пальца",
      "en": "Chance to reset Finger cooldown"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "engine",
    "perLevel": 1,
    "unit": "percent",
    "names": {
      "uk": "Запасний грифель",
      "ru": "Запасной грифель",
      "en": "Spare lead"
    },
    "descriptions": {
      "uk": "Шанс скинути КД Олівця",
      "ru": "Шанс сбросить КД Карандаша",
      "en": "Chance to reset Pencil cooldown"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "hangar",
    "perLevel": 30,
    "unit": "flat",
    "names": {
      "uk": "Підсилювач Пальця",
      "ru": "Усилитель Пальца",
      "en": "Finger amplifier"
    },
    "descriptions": {
      "uk": "Шкода Пальця",
      "ru": "Урон Пальца",
      "en": "Finger damage"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "portal",
    "perLevel": 40,
    "unit": "flat",
    "names": {
      "uk": "Заточка Олівця",
      "ru": "Заточка Карандаша",
      "en": "Pencil sharpener"
    },
    "descriptions": {
      "uk": "Шкода Олівця",
      "ru": "Урон Карандаша",
      "en": "Pencil damage"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "core",
    "perLevel": 15,
    "unit": "flat",
    "names": {
      "uk": "Токсична суміш",
      "ru": "Токсичная смесь",
      "en": "Toxic mixture"
    },
    "descriptions": {
      "uk": "Шкода кожного виду отрути",
      "ru": "Урон каждого вида яда",
      "en": "Damage of each poison type"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "lab",
    "perLevel": 0.5,
    "unit": "percent",
    "names": {
      "uk": "Економний дозатор",
      "ru": "Экономный дозатор",
      "en": "Efficient dispenser"
    },
    "descriptions": {
      "uk": "Шанс не витратити отруту",
      "ru": "Шанс не потратить яд",
      "en": "Chance to preserve poison"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "garden",
    "perLevel": 0.5,
    "unit": "seconds",
    "names": {
      "uk": "Незагойна рана",
      "ru": "Незаживающая рана",
      "en": "Open wound"
    },
    "descriptions": {
      "uk": "Тривалість кровотечі Олівця",
      "ru": "Длительность кровотечения Карандаша",
      "en": "Pencil bleed duration"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "reactor",
    "perLevel": 5,
    "unit": "flat",
    "names": {
      "uk": "Погане згортання",
      "ru": "Плохая свёртываемость",
      "en": "Poor clotting"
    },
    "descriptions": {
      "uk": "Шкода кровотечі за секунду",
      "ru": "Урон кровотечения в секунду",
      "en": "Bleed damage per second"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "habitat",
    "perLevel": 30,
    "unit": "reduction",
    "names": {
      "uk": "Автоподача",
      "ru": "Автоподача",
      "en": "Auto feed"
    },
    "descriptions": {
      "uk": "Скорочення КД Олівця",
      "ru": "Сокращение КД Карандаша",
      "en": "Pencil cooldown reduction"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "bridge",
    "perLevel": 5,
    "unit": "reduction",
    "names": {
      "uk": "Розминка суглобів",
      "ru": "Разминка суставов",
      "en": "Joint warmup"
    },
    "descriptions": {
      "uk": "Скорочення КД Пальця",
      "ru": "Сокращение КД Пальца",
      "en": "Finger cooldown reduction"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "radar",
    "perLevel": 20,
    "unit": "flat",
    "names": {
      "uk": "Больова точка",
      "ru": "Болевая точка",
      "en": "Pressure point"
    },
    "descriptions": {
      "uk": "Додаткова шкода криту Пальця й Олівця",
      "ru": "Дополнительный урон крита Пальца и Карандаша",
      "en": "Extra Finger and Pencil critical damage"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "toilet",
    "perLevel": 30,
    "unit": "flat",
    "names": {
      "uk": "Рейдовий підсилювач",
      "ru": "Рейдовый усилитель",
      "en": "Raid amplifier"
    },
    "descriptions": {
      "uk": "Додаткова шкода Пальця й Олівця рейдовим босам",
      "ru": "Дополнительный урон Пальца и Карандаша рейдовым боссам",
      "en": "Extra Finger and Pencil damage to raid bosses"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "jellyfish",
    "perLevel": 100,
    "unit": "flat",
    "names": {
      "uk": "Вітальний удар",
      "ru": "Приветственный удар",
      "en": "Welcome strike"
    },
    "descriptions": {
      "uk": "Додаткова шкода першого удару Пальцем або Олівцем за бій",
      "ru": "Дополнительный урон первого удара Пальцем или Карандашом за бой",
      "en": "Extra damage on the first Finger or Pencil hit per fight"
    },
    "maxLevel": 10
  },
  {
    "moduleId": "bar",
    "perLevel": 1,
    "unit": "daily",
    "names": {
      "uk": "Підпільна аптека",
      "ru": "Подпольная аптека",
      "en": "Underground pharmacy"
    },
    "descriptions": {
      "uk": "Особистий щоденний запас Малої отрути",
      "ru": "Личный ежедневный запас Малого яда",
      "en": "Personal daily Small Poison supply"
    },
    "maxLevel": 10
  }
];
export const shipLanguage = language => ['uk','ru','en'].includes(String(language).split('-')[0]) ? String(language).split('-')[0] : 'uk';
export function getShipBuff(moduleId, level = 0, language = 'uk') {
 const definition = SHIP_BUFFS.find(buff => buff.moduleId === moduleId);
 if (!definition) return null;
 const lang = shipLanguage(language);
 const rank = Math.min(10, Math.max(0, Math.floor(Number(level) || 0)));
 const value = rank * definition.perLevel;
 const number = new Intl.NumberFormat(lang, {maximumFractionDigits: 1}).format(value);
 const suffix = definition.unit === 'percent' ? '%' : ['seconds','reduction'].includes(definition.unit) ? {uk:' с',ru:' сек.',en:' sec'}[lang] : definition.unit === 'daily' ? {uk:' шт./день',ru:' шт./день',en:' /day'}[lang] : '';
 const effect = (definition.unit === 'reduction' ? '−' : '+') + number + suffix;
 return {...definition, level:rank, value, name:definition.names[lang], description:definition.descriptions[lang], effect};
}
