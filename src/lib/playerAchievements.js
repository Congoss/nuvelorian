export function getAchievementLanguage(language = 'uk') {
  const code = String(language || 'uk').trim().toLowerCase().split(/[-_]/)[0];
  return code === 'ru' ? 'ru' : code === 'en' ? 'en' : 'uk';
}
export const PLAYER_ACHIEVEMENTS = [
  {
    id: 'fishing_trash_5',
    uk: ['Екоактивіст мимоволі', 'Ти прийшов по вечерю. Планета записала тебе у волонтери. Відмову загубили десь між покришкою та пакетом.'],
    ru: ['Экоактивист поневоле', 'Ты пришёл за ужином. Планета записала тебя в волонтёры. Отказ потеряли где-то между покрышкой и пакетом.'],
    en: ['Accidental Eco-Activist', 'You came for dinner. The planet signed you up as a volunteer. Your refusal got lost somewhere between a tire and a plastic bag.'],
  },
  {
    "id": "greed_saved",
    "uk": [
      "Жаба схвалила витрати",
      "Внутрішня жаба заблокувала останню покупку. Вперше її запросили на святкування."
    ],
    "ru": [
      "Жаба одобрила расходы",
      "Внутренняя жаба заблокировала последнюю покупку. Впервые её пригласили на праздник."
    ],
    "en": [
      "Stinginess Saves Lives",
      "Your inner cheapskate vetoed the last expense. For once, it got invited to the celebration."
    ]
  },
  {
    "id": "still_breathing",
    "uk": [
      "Медично майже овоч",
      "Патологоанатом уже вдягнув рукавички. Тепер стоїть, чекає і дратується."
    ],
    "ru": [
      "Медицински почти овощ",
      "Патологоанатом уже надел перчатки. Теперь стоит, ждёт и раздражается."
    ],
    "en": [
      "Clinically Almost a Vegetable",
      "The coroner already put the gloves on. Now he is waiting, increasingly annoyed."
    ]
  },
  {
    "id": "hands_off",
    "uk": [
      "Це вже без мене",
      "Ти відійшов. Організм продовжив вашу дискусію й навів останній аргумент."
    ],
    "ru": [
      "Это уже без меня",
      "Ты отошёл. Организм продолжил вашу дискуссию и привёл последний аргумент."
    ],
    "en": [
      "My Work Here Is Done",
      "You stepped away. Biology continued the debate and delivered the final argument."
    ]
  },
  {
    "id": "ten_fingers",
    "uk": [
      "Колективний тицид",
      "Комісія з особистого простору зібралася в повному складі. Засідання потерпілий не пережив."
    ],
    "ru": [
      "Коллективный тыцид",
      "Комиссия по личному пространству собралась в полном составе. Заседание пострадавший не пережил."
    ],
    "en": [
      "Death by Committee",
      "The personal-space committee reached full attendance. The subject did not survive the meeting."
    ]
  },
  {
    "id": "three_empty_casts",
    "uk": [
      "Вода перемогла всуху",
      "Місцеві риби провели три засідання. Твою кандидатуру відхилили одноголосно."
    ],
    "ru": [
      "Вода победила всухую",
      "Местные рыбы провели три заседания. Твою кандидатуру отклонили единогласно."
    ],
    "en": [
      "Water Wins by a Landslide",
      "The local fish held three meetings. Your application was rejected unanimously."
    ]
  },
  {
    "id": "halloween_hunter_500",
    "uk": [
      "Овочевий переворот",
      "Спочатку ти збирав урожай. Тепер урожай вимагає представництва в галактичному сенаті."
    ],
    "ru": [
      "Овощной переворот",
      "Сначала ты собирал урожай. Теперь урожай требует представительства в галактическом сенате."
    ],
    "en": [
      "Vegetable Coup",
      "First you collected the harvest. Now it demands representation in the galactic senate."
    ]
  },
  {
    "id": "generous_soul",
    "uk": [
      "Капіталізм тебе помітив",
      "Всесвіт почув шелест із твого гаманця. Раніше він удавав, що не вдома."
    ],
    "ru": [
      "Капитализм тебя заметил",
      "Вселенная услышала шорох из твоего кошелька. Раньше она притворялась, что её нет дома."
    ],
    "en": [
      "Capitalism Noticed You",
      "The universe heard your wallet rustle. Until now, it pretended nobody was home."
    ]
  },
  {
    "id": "almost_finished",
    "uk": [
      "Майже — це теж ні",
      "Пацієнт уже бачив світло. Потім глянув на годинник і передумав."
    ],
    "ru": [
      "Почти — это тоже нет",
      "Пациент уже видел свет. Потом взглянул на часы и передумал."
    ],
    "en": [
      "Almost Is Still No",
      "The patient had seen the light. Then checked the clock and reconsidered."
    ]
  },
  {
    "id": "full_set_plus_15",
    "uk": [
      "Гарантія втекла першою",
      "Виробник просив зупинитися. Потім благав. Тепер його номер не обслуговується."
    ],
    "ru": [
      "Гарантия сбежала первой",
      "Производитель просил остановиться. Потом умолял. Теперь его номер не обслуживается."
    ],
    "en": [
      "Warranty Left the Galaxy",
      "The manufacturer asked you to stop. Then begged. That number is no longer in service."
    ]
  },
  {
    "id": "first_full_set",
    "uk": [
      "Смітник haute couture",
      "Усе з однієї колекції. Колекцію винесли у вівторок, але це деталі."
    ],
    "ru": [
      "Мусорка haute couture",
      "Всё из одной коллекции. Коллекцию вынесли во вторник, но это детали."
    ],
    "en": [
      "Dumpster Haute Couture",
      "All from the same collection. It went out with Tuesday’s trash, but details, details."
    ]
  },
  {
    "id": "positive_karma_500",
    "uk": [
      "Нудить від твоєї святості",
      "Твоя репутація вже допомагає стареньким переходити дорогу без твоєї участі."
    ],
    "ru": [
      "Тошнит от твоей святости",
      "Твоя репутация уже помогает старушкам переходить дорогу без твоего участия."
    ],
    "en": [
      "Your Halo Makes Me Sick",
      "Your reputation is helping old ladies cross the road without you even being there."
    ]
  },
  {
    "id": "negative_karma_100",
    "uk": [
      "Опади особистого характеру",
      "Метеослужба наполягає: хмар немає. Проблема явно локальна."
    ],
    "ru": [
      "Осадки личного характера",
      "Метеослужба настаивает: облаков нет. Проблема явно локальная."
    ],
    "en": [
      "Personal Precipitation",
      "The weather service insists there are no clouds. This is clearly a local problem."
    ]
  },
  {
    "id": "gum_no_upgrade_10",
    "uk": [
      "Орбіта без прогресу",
      "Щелепа вже на наступному рівні. Решта спорядження просить не квапити події."
    ],
    "ru": [
      "Орбита без прогресса",
      "Челюсть уже на следующем уровне. Остальное снаряжение просит не торопить события."
    ],
    "en": [
      "Orbiting Nowhere",
      "Your jaw has already leveled up. The rest of your gear would rather take things slowly."
    ]
  }
];
export const ACHIEVEMENT_REWARDS = {
  fishing_trash_5: { smallPoison: 30, mediumPoison: 20, largePoison: 5, spins: 10 },
  "greed_saved": {
    "smallPoison": 60,
    "mediumPoison": 40,
    "largePoison": 20
  },
  "still_breathing": {
    "largePoison": 10,
    "spins": 50
  },
  "hands_off": {
    "mediumPoison": 40,
    "largePoison": 30,
    "spins": 25
  },
  "ten_fingers": {
    "smallPoison": 100,
    "mediumPoison": 50,
    "largePoison": 25,
    "spins": 10
  },
  "three_empty_casts": {
    "smallPoison": 20,
    "mediumPoison": 10,
    "spins": 5
  },
  "halloween_hunter_500": {
    "smallPoison": 50,
    "mediumPoison": 30,
    "largePoison": 15,
    "spins": 20
  },
  "generous_soul": {
    "mediumPoison": 20,
    "largePoison": 10,
    "spins": 10
  },
  "almost_finished": {
    "smallPoison": 20,
    "mediumPoison": 15,
    "largePoison": 5,
    "spins": 10
  },
  "full_set_plus_15": {
    "smallPoison": 100,
    "mediumPoison": 75,
    "largePoison": 50,
    "spins": 50
  },
  "first_full_set": {
    "smallPoison": 30,
    "mediumPoison": 20,
    "largePoison": 5,
    "spins": 10
  },
  "positive_karma_500": {
    "smallPoison": 50,
    "mediumPoison": 40,
    "largePoison": 20,
    "spins": 25
  },
  "negative_karma_100": {
    "smallPoison": 30,
    "mediumPoison": 20,
    "largePoison": 10,
    "spins": 15
  },
  "gum_no_upgrade_10": {
    "smallPoison": 30,
    "mediumPoison": 20,
    "largePoison": 10,
    "spins": 15
  }
};
export const ACHIEVEMENT_CAPACITY = 34;
