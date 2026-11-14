import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  for (const [name, viewport] of [['desktop', { width: 1100, height: 1100 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/clan-ship-preview');
    await page.waitForSelector('.ship-build-console');
    await page.waitForFunction(() => [...document.querySelectorAll('img')].every(i => i.complete && i.naturalWidth));
    assert.equal(await page.locator('.ship-tools').count(), 0);
    assert.equal(await page.locator('.ship-module-rail button').count(), 12);
    assert.equal(await page.locator('.ship-part').count(), 15, 'all modules, hull and workers are independent');
    assert.equal(await page.locator('[data-part="garden"] .ship-fx').count(), 0, 'locked modules have no effects');
    assert.equal(await page.locator('.ship-ghost').count(), 9, 'unfinished modules are gray');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole('button', { name: 'Папір', exact: true }).click();
    await page.getByRole('button', { name: 'ВНЕСТИ 10', exact: true }).click();
    assert.match(await page.locator('.ship-resource-bar').innerText(), /920/);
    assert.match(await page.locator('.ship-game-progress b').innerText(), /68,63/);
    assert.equal(await page.locator('.ship-working').count(), 2);
    await page.locator('.ship-boss-card').click();
    assert.match(await page.getByRole('dialog').innerText(), /Завершіть будівництво/);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Відсік 1: Двигун із сантехніки', exact: true }).click();
    await page.locator('.ship-boss-card').click();
    assert.match(await page.getByRole('dialog').innerText(), /бос ще готується/);
    await page.getByLabel('Закрити вікно').click();
    await page.locator('.ship-buff-card').click();
    assert.match(await page.getByRole('dialog').innerText(), /Ефект і значення з’являться пізніше/);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Відсік 6: Оранжерея людожерів', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Папір', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: 'Відсік 4: Мозок корабля', exact: true }).click();
    await page.evaluate(() => document.querySelector('.ship-editor').scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `output/clan-ship/game-scene-${name}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Stars', exact: true }).click();
    await page.getByLabel('Сума внеску').fill('-1');
    assert.equal(await page.locator('.ship-confirm').isDisabled(), true);
    await page.getByLabel('Сума внеску').fill('25');
    await page.screenshot({ path: `output/clan-ship/contribution-${name}.png` });
    assert.deepEqual(errors, []);
    console.log(`${name}: resources, contribution, balance, locks, boss/buff dialogs, layout passed`);
    await page.close();
  }
} finally { await browser.close(); }
