import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:4173/clan-ship-preview');
  await page.waitForSelector('.ship-tools');
  await page.waitForTimeout(1500);
  await page.getByLabel('Рухати деталі').uncheck();
  console.log(await page.evaluate(() => [...document.querySelectorAll('html,body,#root,.ship-editor,.ship-preview,.ship-header')].map(e=>({tag:e.tagName,cls:e.className,scroll:e.scrollTop,h:e.clientHeight,sh:e.scrollHeight,y:e.getBoundingClientRect().y,position:getComputedStyle(e).position,display:getComputedStyle(e).display,align:getComputedStyle(e).alignItems,justify:getComputedStyle(e).justifyContent}))));
  await page.screenshot({ path: 'output/clan-ship/layout-check.png', fullPage: true });
} finally { await browser.close(); }

