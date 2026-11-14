import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
await fs.mkdir('output/clan-ship', { recursive: true });
try {
  for (const [name, viewport] of [['desktop', { width: 1200, height: 1100 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/clan-ship-preview?editor=1');
    await page.waitForSelector('.ship-tools');
    await page.waitForFunction(() => [...document.querySelectorAll('.ship-editor img')].every((img) => img.complete && img.naturalWidth > 0));
    assert.equal(await page.locator('[data-part]').count(), 15);
    await page.waitForSelector('.ship-live');
    assert.equal(await page.locator('.ship-fx').count(), 13, 'all modules and hull have effects');
    const radarPose = await page.locator('.ship-art-radar').evaluate(e => getComputedStyle(e).transform);
    await page.waitForTimeout(1200);
    assert.notEqual(await page.locator('.ship-art-radar').evaluate(e => getComputedStyle(e).transform), radarPose);
    await page.getByLabel('Живий корабель').uncheck();
    assert.equal(await page.locator('.ship-fx').count(), 0);
    await page.getByLabel('Живий корабель').check();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForSelector('.ship-motion-off');
    assert.equal(await page.locator('.ship-fx').count(), 0, 'reduced motion respected');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForSelector('.ship-live');
    await page.evaluate(() => document.querySelector('.ship-editor').scrollTo({ top: 0, behavior: 'instant' }));
    assert.ok((await page.locator('.ship-preview').boundingBox()).height > 650, 'ship panel must not collapse on mobile');
    assert.ok((await page.locator('.ship-header').boundingBox()).y >= 0, 'header visible on initial load');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'horizontal overflow');
    await page.getByLabel('X', { exact: true }).fill('420');
    await page.reload();
    await page.waitForSelector('.ship-tools');
    assert.equal(await page.getByLabel('X', { exact: true }).inputValue(), '420', 'position persisted');
    await page.getByRole('button', { name: 'Скинути позиції' }).click();
    await page.getByLabel('Вибрати деталь').selectOption('habitat');
    const before = Number(await page.getByLabel('X', { exact: true }).inputValue());
    await page.locator('[data-part="habitat"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(Number(await page.getByLabel('X', { exact: true }).inputValue()), before + 1);
    await page.getByLabel('Вибрати деталь').selectOption('core');
    const beforeProgress = await page.locator('.ship-progress b').innerText();
    await page.getByRole('button', { name: 'ВНЕСТИ', exact: true }).click();
    assert.notEqual(await page.locator('.ship-progress b').innerText(), beforeProgress);
    assert.equal(await page.locator('.ship-working').count(), 2);
    const firstPose = await page.locator('.worker-left .ship-hammer-arm').evaluate((e) => getComputedStyle(e).transform);
    await page.waitForTimeout(180);
    const nextPose = await page.locator('.worker-left .ship-hammer-arm').evaluate((e) => getComputedStyle(e).transform);
    assert.notEqual(firstPose, nextPose, 'hammer visibly changes pose');
    await page.waitForTimeout(2500);
    assert.equal(await page.locator('.ship-working').count(), 0, 'animation stops');
    await page.getByLabel('Вибрати деталь').selectOption('garden');
    assert.equal(await page.getByRole('button', { name: 'ВНЕСТИ', exact: true }).isDisabled(), true, 'future module locked');
    await page.getByRole('button', { name: 'Скинути позиції' }).click();
    await page.getByLabel('Рухати деталі').uncheck();
    await page.evaluate(() => { document.querySelector('.ship-editor').scrollTo({ top: 0, behavior: 'instant' }); window.scrollTo({ top: 0, behavior: 'instant' }); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `output/clan-ship/preview-${name}.png`, fullPage: true });
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Експорт JSON' }).click();
    const download = await downloadPromise;
    const dest = `output/clan-ship/test-layout-${name}.json`;
    await download.saveAs(dest);
    const json = JSON.parse(await fs.readFile(dest, 'utf8'));
    assert.equal(json.version, 1);
    assert.equal(Object.keys(json.layout).length, 15);
    await page.locator('input[type=file]').setInputFiles(dest);
    await page.waitForFunction(() => document.querySelector('[role=status]')?.textContent.includes('імпортовано'));
    assert.match(await page.locator('[role=status]').innerText(), /імпортовано/);
    assert.deepEqual(errors, []);
    console.log(`${name}: assets, layout, persistence, keyboard, contribution, animation, locks, JSON passed`);
    await page.close();
  }
} finally { await browser.close(); }


