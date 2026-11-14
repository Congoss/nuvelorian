const DEFAULT_DESCRIPTIONS = new Set([
  "Концепт ідеї від лідера клану. Ходимо на босів разом і плануємо вікна шкоди.",
  "Концепт и идея от лидера клана. Ходим на боссов вместе и планируем окна урона.",
  "Concept and idea by the clan leader. We open bosses together and plan damage windows."
]);

export function localizeClanDescription(description, t) {
  return DEFAULT_DESCRIPTIONS.has(String(description || '').trim())
    ? t('clan_panel.clan_create_description_default')
    : description;
}
