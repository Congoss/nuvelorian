const ERRORS = [
 ['GATEWAY_UNAVAILABLE','Зв’язок із грою перервався. Стан бою оновлюється.','Связь с игрой прервалась. Состояние боя обновляется.','Connection to the game was interrupted. Battle state is refreshing.'],
 ['REMOTE_INVALID_RESPONSE','Не вдалося отримати відповідь гри. Стан оновлюється.','Не удалось получить ответ игры. Состояние обновляется.','Could not receive the game response. State is refreshing.'],
 ['RATE_LIMITED','Зачекайте трохи й повторіть дію.','Подождите немного и повторите действие.','Please wait a moment and try again.'],
 ['TOO_MANY_REQUESTS','Зачекайте трохи й повторіть дію.','Подождите немного и повторите действие.','Please wait a moment and try again.'],
 ['NO_BONUS_SPINS','Недостатньо бонусних прокрутів','Недостаточно бонусных прокруток','Not enough bonus spins'],
 ['SHIP_REQUEST_TIMEOUT','Відповідь затримується. Повторіть запит, щоб перевірити удар без повторного списання.','Ответ задерживается. Повторите запрос, чтобы проверить удар без повторного списания.','The response is delayed. Retry to check the attack without paying twice.'],
 ['BOSS_FIGHT_NOT_ACTIVE','Цей бій уже завершився. Оновіть чат.','Этот бой уже завершился. Обновите чат.','This battle has ended. Refresh the chat.'],
 ['BOSS_FIGHT_INVITE_REQUIRED','Запрошення до цього бою більше не доступне для вашого клану.','Приглашение в этот бой больше недоступно вашему клану.','This battle invitation is no longer available to your clan.'],
 ['RESOURCE_PACK_UNAVAILABLE','Цей пак уже придбано або ще не відкрито','Этот пак уже куплен или ещё не открыт','This pack has already been purchased or is not unlocked yet'],

 ['SHIP_RENAME_LEADER_ONLY','Перейменувати корабель може лише лідер клану','Переименовать корабль может только лидер клана','Only the clan leader can rename the ship'],
 ['SHIP_RENAME_USED','Безкоштовне перейменування вже використано','Бесплатное переименование уже использовано','The free rename has already been used'],
 ['SHIP_NAME_INVALID','Назва: 2–32 символи без керівних символів','Название: 2–32 символа без управляющих символов','Name must contain 2–32 characters without control characters'],
 ['SHIP_TEST_ACCESS_REQUIRED','Для корабля потрібен доступ тестера','Для корабля нужен доступ тестера','Tester access is required for the ship'],
 ['SHIP_TEST_PASSWORD_INVALID','Неправильний пароль тестера','Неверный пароль тестера','Incorrect tester password'],
 ['SHIP_TEST_RATE_LIMIT','Забагато спроб. Повторіть через 15 хвилин.','Слишком много попыток. Повторите через 15 минут.','Too many attempts. Try again in 15 minutes.'],
 ['SHIP_TEST_DISABLED','Тестування корабля ще не відкрите','Тестирование корабля ещё не открыто','Ship testing is not open yet'],
 ['SHIP_FIGHT_NOT_FOUND','Бій корабля не знайдено','Бой корабля не найден','Ship battle not found'],
 ['SHIP_FIGHT_NOT_ACTIVE','Бій уже завершено. Оновіть стан корабля.','Бой уже завершён. Обновите состояние корабля.','This battle has ended. Refresh the ship.'],
 ['SHIP_MODULE_NOT_FOUND','Відсік корабля не знайдено','Отсек корабля не найден','Ship sector not found'],
 ['SHIP_SECTOR_NOT_BUILT','Спочатку збудуйте цей відсік','Сначала постройте этот отсек','Build this sector first'],
 ['SHIP_SECTOR_UNAVAILABLE','Цей відсік поки недоступний або вже збудований','Этот отсек пока недоступен или уже построен','This sector is locked or already built'],
 ['SHIP_STORAGE_UNAVAILABLE','Збереження тимчасово недоступне. Повторіть запит.','Сохранение временно недоступно. Повторите запрос.','Saving is temporarily unavailable. Retry the request.'],
 ['SHIP_CURRENCY_UNAVAILABLE','Виберіть щупальці, Stars або NEAR','Выберите щупальца, Stars или NEAR','Choose tentacles, Stars or NEAR'],
 ['SHIP_CONTRIBUTION_TOO_LARGE','Сума перевищує залишок вартості будівництва','Сумма превышает оставшуюся стоимость строительства','The amount exceeds the remaining construction cost'],
 ['CLAN_MEMBERSHIP_REQUIRED','Потрібно бути учасником цього клану','Нужно состоять в этом клане','You must belong to this clan'],
 ['REQUEST_ID_REUSED','Цей запит уже використано з іншими параметрами','Этот запрос уже использован с другими параметрами','This request ID was already used with different parameters'],
 ['REQUEST_ID_REQUIRED','Не вдалося створити запит. Оновіть сторінку.','Не удалось создать запрос. Обновите страницу.','Could not create the request. Reload the page.'],
 ['SKILL_COOLDOWN_ACTIVE','Атака ще перезаряджається','Атака ещё перезаряжается','This attack is still on cooldown'],
 ['NO_POISON_INVENTORY','Недостатньо отрути в інвентарі','Недостаточно яда в инвентаре','Not enough poison in your inventory'],
 ['INVALID_MULTIPLIER','Недопустима кількість атак','Недопустимое количество атак','Invalid attack quantity'],
 ['NOT_ENOUGH_RESOURCES','Недостатньо ресурсів','Недостаточно ресурсов','Not enough resources'],
 ['INVALID_AMOUNT','Вкажіть коректну додатну кількість','Укажите корректное положительное количество','Enter a valid positive quantity'],
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
 if (/too[ _-]+many[ _-]+requests/i.test(String(message))) code='RATE_LIMITED';
 const row=ERRORS.find(entry=>entry[0]===code || entry.slice(1).includes(message));
 if(!row)return message;
 const lang=String(language).split('-')[0];
 return row[lang==='ru'?2:lang==='ua'||lang==='uk'?1:3];
}
