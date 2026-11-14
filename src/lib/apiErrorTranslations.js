const ERRORS = [
  [
    "PROMO_NOT_FOUND",
    "Промокод не знайдено або він неактивний",
    "Промокод не найден или неактивен",
    "Promo code not found or inactive"
  ],
  [
    "PROMO_ALREADY_USED",
    "Промокод уже використано на цьому акаунті",
    "Промокод уже использован на этом аккаунте",
    "This promo code has already been used on this account"
  ],
  [
    "PROMO_LIMIT_REACHED",
    "Ліміт активацій промокоду вичерпано",
    "Лимит активаций промокода исчерпан",
    "Promo code activation limit reached"
  ],
  [
    "TALENT_RESET_EMPTY",
    "Немає витрачених очок талантів",
    "Нет потраченных очков талантов",
    "No spent talent points to reset"
  ],
  [
    "TALENT_RESET_FUNDS",
    "Потрібно 50 паперу",
    "Нужно 50 T-Pape",
    "You need 50 T-Pape"
  ],
  [
    "BP_REWARD_UNAVAILABLE",
    "Нагорода ще недоступна",
    "Награда пока недоступна",
    "This reward is not available yet"
  ],
  [
    "PUDDLE_CLEANUP_REQUIRED",
    "Ти стоїш в калюжі, за собою подивитись не можеш, а вже на боса лізеш. Спочатку приберися.",
    "Стоишь в луже, за собой убрать не можешь, а уже на босса лезешь. Сначала приберись.",
    "You are standing in your own puddle and already picking a fight with a boss. Clean up your mess first."
  ],
  [
    "BOSS_FIGHT_ALREADY_ACTIVE",
    "💀 Срака не трісне з двома босами одночасно битися?! Спочатку добий першого!",
    "💀 Жопа не треснет с двумя боссами одновременно драться?! Сначала добей первого!",
    "💀 Think your ass can handle two bosses at once?! Finish the first one, dumbass!"
  ],
  [
    "BOSS_ESCAPE_COOLDOWN",
    "Після втечі атаки босів будуть заблоковані на 30 хвилин",
    "После побега атаки боссов будут заблокированы на 30 минут",
    "Boss attacks are blocked for 30 minutes after escaping"
  ]
];
export function localizeApiError(code, message, language = 'en') {
 const row=ERRORS.find(entry=>entry[0]===code || entry.slice(1).includes(message));
 if(!row)return message;
 const lang=String(language).split('-')[0];
 return row[lang==='ru'?2:lang==='ua'||lang==='uk'?1:3];
}
