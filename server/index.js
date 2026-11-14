import { processRaidRankRewards, createApp, processClanTimers, processPendingNearPayments, processTalentBleedTicks } from './app.js';
import { serverConfig } from './config.js';
import { tryServeStatic } from './static.js';
import { processTelegramReminderTick } from './services/telegram-reminders.js';
import { processAllHolderDrops } from './services/holder-drops.js';

if (process.env.NODE_ENV === 'production') {
  const required = ['DATABASE_URL', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', 'ADMIN_TOKEN'];
  const missing = required.filter((key) => !String(process.env[key] || '').trim());
  if (missing.length) {
    throw new Error(`Missing production configuration: ${missing.join(', ')}`);
  }
}

const server = createApp({ serveStatic: tryServeStatic });

server.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`Server listening on http://${serverConfig.host}:${serverConfig.port}`);
});

setInterval(() => processTalentBleedTicks(), 1000).unref();
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
