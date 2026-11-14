import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function prepareReleaseMail({ version, fixes }) {
  if (!/^\d+\.\d+$/.test(version || '') || !Array.isArray(fixes) || !fixes.length) throw Error('Provide version and distinct fixes');
  fixes = fixes.filter(fix => fix.scope !== 'admin');
  if (!fixes.length) throw Error('Admin-only release: no player mail or compensation');
  const title = {}, text = {};
  const copy = {
    uk: ['Оновлення', 'Що виправлено:', 'Дякуємо за повідомлення про помилки! Середніх отрут у подарунок:'],
    ru: ['Обновление', 'Что исправлено:', 'Спасибо за сообщения об ошибках! Средних ядов в подарок:'],
    en: ['Update', 'Fixes:', 'Thanks for reporting bugs! Your gift of medium poisons:'],
  };
  for (const language of ['uk', 'ru', 'en']) {
    const lines = fixes.map(fix => {
      if (typeof fix?.[language] !== 'string' || !fix[language].trim()) throw Error(`Missing ${language} translation`);
      return fix[language].trim();
    });
    if (new Set(lines).size !== lines.length) throw Error('Duplicate mini-fix');
    title[language] = `${copy[language][0]} ${version}`;
    text[language] = `${copy[language][1]}\n\n${lines.map((line, index) => `${index + 1}. ${line}`).join('\n')}\n\n${copy[language][2]} ${fixes.length}.`;
    if (title[language].length > 120 || text[language].length > 4000) throw Error('Mail exceeds supported length');
  }
  return { target: {}, gift: { kind: 'resource', title, text, rewards: [{ field: 'medium_poison', amount: fixes.length }] } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw Error('Usage: node scripts/prepare-release-mail.mjs release.json output.json');
  const payload = prepareReleaseMail(JSON.parse(fs.readFileSync(input, 'utf8')));
  fs.writeFileSync(output, JSON.stringify(payload, null, 2) + '\n', { flag: 'wx' });
  console.log(`Mail prepared: ${payload.gift.rewards[0].amount} medium poisons per player; not sent`);
}
