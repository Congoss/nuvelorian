import { processNewsQueue } from './services/telegram-news.js';
import { store } from './data/store.js';
import { processRaidRankRewards, createApp, prepareGameState, processClanTimers, processPendingNearPayments, processDurableTalentBleedTicks } from './app.js';
import { serverConfig } from './config.js';
import { tryServeStatic } from './static.js';
import { processTelegramReminderTick } from './services/telegram-reminders.js';
import { processAllHolderDrops } from './services/holder-drops.js';
import { releaseAnnouncements } from './services/release-announcements.js';

if (process.env.NODE_ENV === 'production') {
  const required = ['DATABASE_URL', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', 'ADMIN_TOKEN'];
  const missing = required.filter((key) => !String(process.env[key] || '').trim());
  if (missing.length) {
    throw new Error(`Missing production configuration: ${missing.join(', ')}`);
  }
}

async function start() {
  const startupStarted = Date.now();
  await prepareGameState();
  console.log('[startup] game state ready', { duration_ms: Date.now() - startupStarted });

  const server = createApp({ serveStatic: tryServeStatic });

  server.listen(serverConfig.port, serverConfig.host, () => {
    console.log(`Server listening on http://${serverConfig.host}:${serverConfig.port}`);
    void publishRelease();
  });

  async function publishRelease() {
    try { await releaseAnnouncements.publish(); }
    catch (error) { console.warn('[release] publication failed', { message: error.message }); }
  }
  setInterval(publishRelease, 60000).unref();

  setInterval(() => processDurableTalentBleedTicks().catch(error => console.warn('[combat-bleed] write failed', { message: error.message })), 1000).unref();
  setInterval(() => processRaidRankRewards().catch(error => console.warn('[raid-rank] settlement failed', { message: error.message })), 30000).unref();
  setInterval(() => processClanTimers(), 30000).unref();
  setInterval(() => processTelegramReminderTick(), 60000).unref();
  setInterval(() => processAllHolderDrops().catch((error) => {
    console.warn('[holder-drops] daily scan failed', { code: error?.code || 'HOLDER_DROPS_FAILED', message: error?.message || 'unknown_error' });
  }), 5 * 60 * 1000).unref();
  const reconcileNearPayments = () => {
    processPendingNearPayments().catch((error) => {
      console.warn('[payments] NEAR reconciliation scan failed', { code: error?.code || 'NEAR_RECONCILIATION_FAILED' });
    });
  };
  setTimeout(reconcileNearPayments, 5000).unref();
  setInterval(reconcileNearPayments, 60000).unref();

  setInterval(() => processNewsQueue(store).catch(error => console.warn('[news] worker failed', {message:error.message})), 1000).unref();
}

void start().catch(error => {
  console.error('[startup] initialization failed', error);
  process.exit(1);
});
