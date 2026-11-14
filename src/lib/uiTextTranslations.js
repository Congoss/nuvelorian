import i18n from '../i18n/index.js';
const TEXT = {
 "Аксесуари":["Accessories","Аксессуары"],
 "Анімація":["Animation","Анимация"],
 "РЕЙД":["RAID","РЕЙД"],
 "Лавова печера":["Lava Cave","Лавовая пещера"],
 "Воронячий вихор":["Raven Vortex","Вороний вихрь"],
 "Гараж":["Garage","Гараж"],
 "Сцена бою з босом":["Boss Battle Scene","Сцена боя с боссом"],
 "Стартовий фон":["Starter background","Стартовый фон"],
 "Legendary Battle Pass · рівень 40":["Legendary Battle Pass · level 40","Legendary Battle Pass · уровень 40"],
 "Epic Battle Pass · рівень 40":["Epic Battle Pass · level 40","Epic Battle Pass · уровень 40"],
 "Legendary Battle Pass · рівень 50":["Legendary Battle Pass · level 50","Legendary Battle Pass · уровень 50"],
 "Epic Battle Pass · рівень 50":["Epic Battle Pass · level 50","Epic Battle Pass · уровень 50"],
 "Перша зміна безкоштовна":["First change is free","Первое изменение бесплатно"],
 "Зміна нікнейма: 500 T-Pape":["Nickname change: 500 T-Pape","Изменение никнейма: 500 T-Pape"],
  "Я СПРАВЛЮСЬ": [
    "I CAN HANDLE IT",
    "Я СПРАВЛЮСЬ"
  ],
  "Боса знищено": [
    "Boss defeated",
    "Босс уничтожен"
  ],
  "Перший ривок": [
    "First Push",
    "Первый рывок"
  ],
  "Витрать 100 енергії": [
    "Spend 100 energy",
    "Потрать 100 энергии"
  ],
  "Дай ляпаса гравцю": [
    "Slap a player",
    "Дай пощёчину игроку"
  ],
  "Відкрий будь-який бокс": [
    "Open any box",
    "Открой любой бокс"
  ],
  "Підніми першу силу": [
    "Reach 25 power",
    "Достигни 25 силы"
  ],
  "Нанеси 100 урону босу": [
    "Deal 100 damage to a boss",
    "Нанеси 100 урона боссу"
  ],
  "Вступи у клан": [
    "Join a clan",
    "Вступи в клан"
  ],
  "⚔️ Рейд": [
    "⚔️ Raid",
    "⚔️ Рейд"
  ],
  "Скан": [
    "Scan",
    "Скан"
  ],
  "Рейд коштує": [
    "Raid costs",
    "Рейд стоит"
  ],
  "| Краде": [
    "| Steals",
    "| Крадёт"
  ],
  "відкритого брухту": [
    "unprotected tentacles",
    "незащищённых щупалец"
  ],
  "Рейд на": [
    "Raid on",
    "Рейд на"
  ],
  "успішний!": [
    "successful!",
    "успешен!"
  ],
  "провалено!": [
    "failed!",
    "провален!"
  ],
  "брухту": [
    "tentacles",
    "щупалец"
  ],
  "Втрачено": [
    "Lost",
    "Потеряно"
  ],
  "Немає цілей. Грай перший!": [
    "No targets yet. Be the first to play!",
    "Нет целей. Играй первым!"
  ],
  "Рів.": [
    "Lv.",
    "Ур."
  ],
  "Заявку подано": [
    "Application sent",
    "Заявка отправлена"
  ],
  "Не вдалося вступити": [
    "Could not join",
    "Не удалось вступить"
  ],
  "Клановий профіль": [
    "Clan profile",
    "Профиль клана"
  ],
  "УЧАСНИКИ": [
    "MEMBERS",
    "УЧАСТНИКИ"
  ],
  "Закрити топ": [
    "Close rankings",
    "Закрыть рейтинг"
  ],
  "Помилка": [
    "Error",
    "Ошибка"
  ],
  "Космобатя": [
    "Space Dad",
    "Космобатя"
  ],
  "Супутник": [
    "Satellite",
    "Спутник"
  ],
  "Космодід": [
    "Space Grandpa",
    "Космодед"
  ],
  "Стажер": [
    "Intern",
    "Стажёр"
  ],
  "Редагувати нікнейм": [
    "Edit nickname",
    "Изменить никнейм"
  ],
  "Не вдалося змінити нікнейм": [
    "Could not change nickname",
    "Не удалось изменить никнейм"
  ],
  "Помилка завантаження": [
    "Loading error",
    "Ошибка загрузки"
  ],
  "Спробуй оновити гру.": [
    "Try reloading the game.",
    "Попробуй перезагрузить игру."
  ],
  "Оновити": [
    "Reload",
    "Обновить"
  ],
  "Безкоштовно": [
    "Free",
    "Бесплатно"
  ],
  "Нема спінів": [
    "No spins",
    "Нет спинов"
  ]
};
export function translateUiText(value, language = i18n.language) {
 const key=String(value || '').trim(); const translated=TEXT[key];
 if(!translated)return value;
 const lang=String(language || 'en').split('-')[0];
 return lang==='en'?translated[0]:lang==='ru'?translated[1]:value;
}
