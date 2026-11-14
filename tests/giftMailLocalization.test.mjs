import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/components/game/MailPanel.jsx', 'utf8').replace(/\r\n/g, '\n');
const start = source.indexOf('function localizedGiftText(');
const end = source.indexOf('\n}\n\nfunction buildMailItems', start) + 2;
assert.ok(start >= 0 && end > start, 'localized mail helper should be present');
const context = vm.createContext({});
vm.runInContext(`${source.slice(start, end)}\nglobalThis.localizedGiftText = localizedGiftText;`, context);

test('mail localization handles nested locales and suppresses already corrupted object strings', () => {
  const nested = {
    uk: { uk: 'Тема UA', en: 'Subject EN', ru: 'Тема RU' },
    en: { uk: 'Тема UA', en: 'Subject EN', ru: 'Тема RU' },
    ru: { uk: 'Тема UA', en: 'Subject EN', ru: 'Тема RU' },
  };
  assert.equal(context.localizedGiftText(nested, 'uk-UA'), 'Тема UA');
  assert.equal(context.localizedGiftText(nested, 'ru'), 'Тема RU');
  assert.equal(context.localizedGiftText(nested, 'en'), 'Subject EN');
  assert.equal(context.localizedGiftText('[object Object]', 'ru', 'Bonus'), 'Bonus');
});
