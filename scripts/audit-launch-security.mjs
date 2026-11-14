// Isolated audit: real route handlers, synthetic players, no DB, files or network writes.
import { Readable } from 'node:stream';
import { createHmac } from 'node:crypto';

for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING', 'LOCAL_GAME_STATE_PATH', 'ADMIN_TELEGRAM_IDS', 'ADMIN_EMAILS', 'TELEGRAM_WEBHOOK_SECRET']) process.env[key] = '';
process.env.NODE_ENV = 'production';
process.env.SECURITY_AUDIT_SYNTHETIC = 'true';
process.env.PAYMENT_RATES_REFRESH_MS = '0';
process.env.TELEGRAM_BOT_TOKEN = 'isolated-audit-placeholder';
process.env.ADMIN_TOKEN = 'isolated-audit-placeholder';
process.env.VITE_TELEGRAM_USE_MOCK = 'false';
globalThis.fetch = async () => { throw new Error('Network disabled in security audit'); };

const { handleRequest } = await import('../server/app.js');
const { store } = await import('../server/data/store.js');
const { paymentDb } = await import('../server/data/payment-db.js');
const { getSessionFromHeaders, verifyTelegramInitData } = await import('../server/utils/telegramAuth.js');
const { createPaymentService } = await import('../server/services/payment-service.js');
const { createNearPaymentService } = await import('../server/services/near-payment.js');
const { getShopCatalog } = await import('../src/lib/shopCatalog.js');

function signedData(authDate) {
  const data = new URLSearchParams({ auth_date: String(authDate), user: JSON.stringify({ id: 990000001, username: 'audit_fixture' }) });
  const check = [...data].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
  data.set('hash', createHmac('sha256', secret).update(check).digest('hex'));
  return data.toString();
}

async function call(method, url, body = {}, headers = {}) {
  const request = Readable.from([Buffer.from(JSON.stringify(body))]);
  Object.assign(request, { method, url, headers: { host: 'audit.invalid', ...headers } });
  let status = 0;
  let payload;
  const response = {
    statusCode: 200,
    once() {},
    writeHead(code) { status = code; this.statusCode = code; },
    end(data) { payload = data ? JSON.parse(data) : null; },
  };
  await handleRequest(request, response);
  return { status, payload };
}

const results = [];
function check(name, protectedOrCorrect, evidence) {
  results.push({ check: name, status: protectedOrCorrect ? 'PASS' : 'FAIL', evidence });
}
const originalLog = console.log;
const originalInfo = console.info;
console.log = console.info = () => {};
try {
  const unsigned = { 'x-telegram-user-id': '990000001' };
  check('Reject unsigned Telegram identity in production', !getSessionFromHeaders(unsigned), 'Raw user-id header, no initData');
  check('Reject expired signed initData', !verifyTelegramInitData(signedData(1)).ok, 'Valid test HMAC, auth_date=1');
  const headers = { ...unsigned, 'x-telegram-init-data': signedData(Math.floor(Date.now() / 1000)) };
  check('Bind identity to signed user.id', getSessionFromHeaders({ ...headers, 'x-telegram-user-id': '990000002' })?.telegramId !== '990000002', 'Signed user and header ID differ');

  const bootstrap = await call('POST', '/players/bootstrap', {}, headers);
  if (bootstrap.status !== 200) throw new Error(`Cannot bootstrap isolated fixture: ${bootstrap.status}`);
  const player = store.players.find((entry) => entry.telegram_id === '990000001');
  if (!player) throw new Error('Fixture player missing');
  const beforePremium = player.premium;
  const patch = await call('PATCH', `/players/${player.id}`, { premium: 7654321, talent_points: 999, weapon_cooldowns: {} }, headers);
  check('Reject client currency/talent edits', player.premium !== 7654321 && player.talent_points !== 999, { status: patch.status, premium: player.premium, beforePremium });

  player.weapon_cooldowns = { knuckle: new Date().toISOString() };
  const spawned = await call('POST', '/boss-fights/spawn', { bossId: 'heli' }, headers);
  check('New boss clears server-owned weapon cooldowns', spawned.status === 201 && Object.keys(player.weapon_cooldowns || {}).length === 0, { status: spawned.status });

  const create = await call('POST', '/boss-fights', { id: 'audit-forged-fight', boss_id: 'chinook', status: 'active', max_hp: 1000, current_hp: 1000 });
  check('Reject anonymous fight creation', create.status === 401 || create.status === 403, { status: create.status });
  const edit = await call('PATCH', '/boss-fights/audit-forged-fight', { current_hp: 0, status: 'dead' });
  check('Reject anonymous fight edits', edit.status === 401 || edit.status === 403, { status: edit.status });
  const damage = await call('POST', '/boss-damage-logs', { fight_id: 'audit-forged-fight', damage: 1000000, player_email: player.created_by });
  check('Reject anonymous damage log creation', damage.status === 401 || damage.status === 403, { status: damage.status });

  player.pending_boss_boxes = [];
  const openedBefore = Number(player.opened_boxes_total || 0);
  const lootA = await call('POST', '/loot/claim', { boxType: 'standard_boss', bossId: 'chinook', fightId: 'audit-nonexistent-a' }, headers);
  const lootB = await call('POST', '/loot/claim', { boxType: 'standard_boss', bossId: 'chinook', fightId: 'audit-nonexistent-b' }, headers);
  check('Require owned box and real fight for loot', player.opened_boxes_total === openedBefore, { statuses: [lootA.status, lootB.status], unownedBoxesOpened: player.opened_boxes_total - openedBefore });

  const replayInstanceId = 'audit-owned-box-replay';
  player.pending_boss_boxes = [{ boxType: 'standard_boss', bossId: 'heli', fightId: spawned.payload?.data?.id, instanceId: replayInstanceId, rewardFormula: 'boss_v2', rewardSnapshot: [{ type: 'tentacles', qty: 5 }] }];
  const firstClaim = await call('POST', '/loot/claim', { instanceId: replayInstanceId }, headers);
  const replayClaim = await call('POST', '/loot/claim', { instanceId: replayInstanceId }, headers);
  check('Replay a granted box without double credit', firstClaim.status === 200 && replayClaim.status === 200 && replayClaim.payload?.data?.replayed === true && player.opened_boxes_total === openedBefore + 1 && player.tentacles >= 5, { statuses: [firstClaim.status, replayClaim.status], replayed: replayClaim.payload?.data?.replayed });

  player.energy = 100;
  const mission = await call('POST', `/players/${player.id}/tasks/complete`, { task: { id: 'p4-u01-audit', energy: 1, tentacles: 100000, successRate: 1 } }, headers);
  check('Resolve quest rewards from server catalog', mission.payload?.data?.gainedTentacles !== 100000, { status: mission.status, gainedTentacles: mission.payload?.data?.gainedTentacles, spentEnergy: mission.payload?.data?.spentEnergy });

  const publicList = await call('GET', '/players');
  const publicPlayer = publicList.payload?.data?.find((entry) => entry.id === player.id);
  check('Public profiles exclude private economy/inventory', !publicPlayer || (!Object.hasOwn(publicPlayer, 'premium') && !Object.hasOwn(publicPlayer, 'weapon_inventory')), { status: publicList.status, exposesPremium: Object.hasOwn(publicPlayer || {}, 'premium'), exposesInventory: Object.hasOwn(publicPlayer || {}, 'weapon_inventory') });

  player.is_banned = true;
  const banned = await call('PATCH', `/players/${player.id}`, { premium: 7654322 }, headers);
  check('Enforce ban on profile mutations', banned.status === 401 || banned.status === 403, { status: banned.status, premium: player.premium });
  player.is_banned = false;

  const item = getShopCatalog().gemPacks.find((entry) => Number(entry.cdm) > 0);
  let fakeOrder = { id: 'audit-stars-order', user_id: player.id, item_id: item.id, payment_method: 'telegram_stars', status: 'pending', stars_amount_locked: 99 };
  paymentDb.findTransactionById = async () => ({ ...fakeOrder });
  paymentDb.findTransactionByHash = async () => null;
  paymentDb.updateTransaction = async (_id, patch) => { fakeOrder = { ...fakeOrder, ...patch }; return fakeOrder; };
  paymentDb.appendEvent = async () => {};
  const premiumBeforeWebhook = player.premium;
  const webhook = await call('POST', '/telegram/webhook', { message: { successful_payment: { invoice_payload: fakeOrder.id, total_amount: 99, currency: 'XTR', telegram_payment_charge_id: 'synthetic-audit-charge' } } });
  check('Fail closed when webhook secret is unset', player.premium === premiumBeforeWebhook, { status: webhook.status, premiumGranted: player.premium - premiumBeforeWebhook });

  let rewardCalls = 0;
  const pending = { id: 'audit-race-order', user_id: 'fixture', item_id: 'fixture', status: 'pending', ton_amount_locked: '1.00', payment_method: 'ton' };
  const service = createPaymentService({ tonReceiver: 'audit-receiver', db: { findTransactionById: async () => pending, findTransactionByHash: async () => null, updateTransaction: async (_id, patch) => Object.assign(pending, patch), appendEvent: async () => {} }, grantReward: async () => { rewardCalls += 1; } });
  await Promise.all(Array.from({ length: 2 }, () => service.confirmTonPayment({ orderId: pending.id, txHash: 'audit-race-hash', amount: '1.00', recipient: 'audit-receiver' })));
  check('Credit concurrent confirmations once', rewardCalls === 1, { rewardCalls });

  const near = createNearPaymentService({ fetchImpl: async () => ({ ok: true, json: async () => ({ result: { status: { SuccessValue: '' }, transaction: { receiver_id: 'receiver.near', signer_id: 'sender.near', actions: [{ Transfer: { deposit: '100' } }] } } }) }) });
  const nearResult = await near.verifyNearTransaction({ txHash: 'audit-near-hash', senderAccountId: 'sender.near', receiverAccountId: 'receiver.near', expectedYoctoAmount: '100' });
  check('Accept successful NEAR transfer with empty SuccessValue', nearResult.confirmed, { confirmed: nearResult.confirmed });
} finally {
  console.log = originalLog;
  console.info = originalInfo;
}
for (const result of results) console.log(JSON.stringify(result));
const failed = results.filter((result) => result.status === 'FAIL').length;
console.log(`Security audit: ${results.length - failed} passed, ${failed} failed. Synthetic data only.`);
process.exitCode = failed ? 1 : 0;
