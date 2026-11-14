// Real touch gestures against the app, with every API request isolated from player data.
// Run with the local Vite server: node scripts/test-mobile-scroll.mjs
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseURL = process.env.SCROLL_TEST_URL || 'http://127.0.0.1:4173';
const widths = (process.env.SCROLL_TEST_WIDTHS || '320,375,390,412,548').split(',').map(Number);
const probe = process.env.SCROLL_TEST_PROBE === '1';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const player = {
  id: 'scroll-test-fixture', nickname: 'scroll_fixture', language: 'en', level: 19,
  energy: 100, max_energy: 100, scrap: 1000, premium: 10, stat_strength: 599,
  xp: 0, xp_to_next_level: 100, last_energy_update: new Date().toISOString(),
  task_completions: {}, collection_items: [], inventory_items: [], equipped_items: {},
  battle_pass_view: { active: true, level: 3, levelXp: 0, tier: 'free', claims: [], tickets: 0, daysLeft: 20 },
};
const results = [];

try {
  for (const width of widths) {
    const height = width <= 320 ? 568 : width <= 375 ? 667 : 844;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await context.addInitScript(({ height }) => {
      window.__swipesDisabled = false;
      window.Telegram = { WebApp: {
        platform: 'ios', version: '8.0', initData: 'fixture',
        initDataUnsafe: { user: { id: 999999991, first_name: 'Fixture' } },
        viewportHeight: height, viewportStableHeight: height,
        isVersionAtLeast: () => true, ready() {}, expand() {}, onEvent() {},
        disableVerticalSwipes() { window.__swipesDisabled = true; },
      } };
    }, { height });
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      // Block external services and mock ALL data requests, including bootstrap/sync writes.
      if (['fetch', 'xhr'].includes(request.resourceType())) {
        let data = [];
        if (url.pathname.endsWith('/players/bootstrap')) data = { player, bootstrap: { player } };
        else if (url.pathname.endsWith('/boss-fights/active')) data = null;
        else if (url.pathname.endsWith('/players/me')) data = player;
        else if (url.pathname.includes('/players/scroll-test-fixture')) data = player;
        else if (url.pathname.endsWith('/auth/me')) data = { player };
        return route.fulfill({ json: { data } });
      }
      if (url.origin !== baseURL) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => { errors.push(error.message); console.error(error.stack); });
    await page.goto(baseURL);
    await page.getByRole('button', { name: 'Quests', exact: true }).waitFor({ timeout: 30000 });
    const cdp = await context.newCDPSession(page);
    const check = (condition, message) => { if (!probe) assert.ok(condition, message); };

    async function swipe(target, direction, name) {
      await target.evaluate((node) => {
        let parent = node.parentElement;
        while (parent && !(/auto|scroll/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight)) parent = parent.parentElement;
        if (!parent) return;
        const box = node.getBoundingClientRect();
        const area = parent.getBoundingClientRect();
        if (box.bottom < area.top + 100 || box.top > Math.min(area.bottom, innerHeight - 140)) {
          parent.scrollTop += (box.top + box.bottom) / 2 - (area.top + Math.min(area.bottom, innerHeight - 140)) / 2;
        }
      });
      const box = await target.boundingBox();
      assert.ok(box, `${name}: target exists`);
      const point = { x: Math.round(box.x + box.width / 2), y: Math.round(Math.max(100, Math.min(height - 140, box.y + box.height / 2))) };
      const before = await page.evaluate(({ x, y }) => {
        const hit = document.elementFromPoint(x, y);
        let node = hit;
        while (node && !(/auto|scroll/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight)) node = node.parentElement;
        if (!node) throw new Error(`No scrollable ancestor: ${hit?.outerHTML.slice(0, 200)} at ${x},${y}`);
        document.querySelector('[data-scroll-probe]')?.removeAttribute('data-scroll-probe');
        node.setAttribute('data-scroll-probe', '');
        return { top: node.scrollTop, touchAction: getComputedStyle(hit).touchAction, hit: hit.tagName, header: document.querySelector('.game-shell').firstElementChild.getBoundingClientRect().top };
      }, point);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 1 }] });
      for (let step = 1; step <= 12; step++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x, y: point.y + direction * 120 * step / 12, id: 1 }] });
        await page.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(400);
      const after = await page.evaluate(() => ({
        top: document.querySelector('[data-scroll-probe]').scrollTop,
        header: document.querySelector('.game-shell').firstElementChild.getBoundingClientRect().top,
        body: document.scrollingElement.scrollTop,
      }));
      const moved = direction < 0 ? after.top > before.top + 30 : after.top < before.top - 30;
      results.push({ width, name, before: before.top, after: after.top, hit: before.hit, touchAction: before.touchAction, moved });
      if (probe) console.log(JSON.stringify(results.at(-1)));
      check(moved, `${width}px ${name}: swipe did not scroll (${before.top} -> ${after.top})`);
      check(after.header === before.header && after.body === 0, `${name}: header/body moved`);
    }

    await page.getByRole('button', { name: 'Quests', exact: true }).tap();
    const firstCard = page.getByRole('button', { name: /PACKAGE WITHOUT RECIPIENT/ });
    await firstCard.waitFor();
    await swipe(firstCard.locator('p').first(), -1, 'quest card text');
    const scroller = page.locator('[data-scroll-probe]');
    await scroller.evaluate((node) => { node.scrollTop = 0; });
    await swipe(firstCard.locator('img').first(), -1, 'quest card image');
    await scroller.evaluate((node) => { node.scrollTop = 0; });
    await swipe(page.getByRole('button', { name: /COLORLESS PLANET/ }), -1, 'locked quest card');
    await scroller.evaluate((node) => { node.scrollTop = node.scrollHeight; });
    await swipe(scroller.locator('button').last(), 1, 'return from quest list bottom');
    await scroller.evaluate((node) => { node.scrollTop = 0; });
    if (process.env.SCROLL_TEST_SCREENSHOT && width === 390) await page.screenshot({ path: process.env.SCROLL_TEST_SCREENSHOT });
    await firstCard.tap();
    await page.getByRole('button', { name: /back to locations/i }).waitFor();
    const inner = page.locator('.game-shell .overflow-y-auto').last();
    await inner.evaluate((node) => { node.scrollTop = node.scrollHeight; node.setAttribute('data-scroll-probe', ''); });
    await swipe(inner.locator('button').last(), 1, 'quest artifacts');
    await page.getByRole('button', { name: 'Bosses', exact: true }).tap();
    await page.getByText(/^choose boss$/i).waitFor();
    await swipe(page.getByText(/^underweight$/i).first(), -1, 'boss list');
    await page.getByRole('button', { name: 'Hero', exact: true }).tap();
    await page.getByRole('button', { name: 'BATTLE PASS', exact: true }).tap();
    await page.locator('.bp-row').first().waitFor();
    await page.locator('.bp-scene').evaluate((node) => { node.scrollTop = 500; });
    await swipe(page.locator('.bp-row').nth(3).locator('button').last(), -1, 'battle pass reward');
    await page.locator('.bp-scene').evaluate((node) => { node.scrollTop = node.scrollHeight; });
    await swipe(page.locator('.bp-row').last().locator('button').last(), 1, 'return from battle pass bottom');
    check(await page.evaluate(() => window.__swipesDisabled), 'Telegram collapse swipe was not disabled');
    check(errors.length === 0, errors.join('\n'));
    console.log(JSON.stringify({ width, errors, results: results.filter((result) => result.width === width) }));
    await context.close();
  }
} finally {
  await browser.close();
}
