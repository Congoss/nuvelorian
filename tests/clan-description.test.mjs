import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localizeClanDescription } from '../src/lib/clanDescription.js';
const texts = ['uk','ru','en'].map(lang => JSON.parse(readFileSync(new URL('../src/i18n/locales/' + lang + '.json', import.meta.url))).clan_panel.clan_create_description_default);
test('stored default descriptions translate to each viewer language, custom text stays unchanged', () => {
  for (const stored of texts) for (const viewer of texts) assert.equal(localizeClanDescription(stored, () => viewer), viewer);
  assert.equal(localizeClanDescription('Наш власний опис', () => 'translation'), 'Наш власний опис');
});
