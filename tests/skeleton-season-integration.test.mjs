import test from 'node:test';
import assert from 'node:assert/strict';
import { battlePassView, claimAllBattlePassRewards, grantBattlePassGift } from '../server/utils/battlePass.js';
import { getShopPaymentProduct } from '../src/lib/shopCatalog.js';
import { createPaymentService } from '../server/services/payment-service.js';
import { SKELETON_BP_EQUIPMENT, resolveBoneCurse } from '../src/lib/skeletonBattlePassSet.js';
import { calculateEquipmentEffects } from '../src/lib/equipmentEffects.js';
import { BP_MAX_XP } from '../src/lib/battlePass.js';

const now = Date.parse('2026-11-10T00:00:00Z');
const seasonId = 'test-2026-11-04';

test('Stars gift activates the recipient once and season claims grant gear and gums', async () => {
  const buyer = { id: 'buyer' };
  const recipient = { id: 'recipient' };
  const transactions = new Map();
  let grants = 0;
  const payments = createPaymentService({
    now: () => new Date(now),
    fetchRates: async () => ({ tonUsd: '2', nearUsd: '5', starsPerUsd: 100 }),
    db: {
      createTransaction: async row => (transactions.set(row.id, row), row),
      findTransactionById: async id => transactions.get(id),
      findTransactionByHash: async () => null,
      updateTransaction: async (id, patch) => transactions.set(id, { ...transactions.get(id), ...patch }),
    },
    grantReward: async ({userId,itemId,transaction}) => {
      assert.equal(userId,buyer.id);
      const product = getShopPaymentProduct(itemId);
      assert.equal(product.giftRecipientId,recipient.id);
      grantBattlePassGift(recipient,product,transaction,now);
      grants++;
    },
  });
  const order = await payments.purchase({ itemId: `bp_gift:${seasonId}:legendary:${recipient.id}`, userId: buyer.id, paymentMethod: 'telegram_stars' });
  const confirmation = { orderId: order.id, telegramPaymentChargeId: 'test-charge', amount: order.starsAmountLocked };
  await payments.confirmStarsPayment(confirmation);
  await payments.confirmStarsPayment(confirmation);
  assert.equal(grants,1);
  assert.equal(battlePassView(recipient,now).tier,'legendary');
  assert.equal(battlePassView(buyer,now).tier,'free');
  recipient.battle_pass.xp = BP_MAX_XP;
  claimAllBattlePassRewards(recipient,now);
  assert.ok(recipient.enhancement_gums.normal > 0 && recipient.enhancement_gums.improved > 0);
  for (const item of Object.values(SKELETON_BP_EQUIPMENT)) assert.ok(recipient.inventory_items.some(entry=>entry.id===item.id));
  assert.ok(!recipient.battle_pass.claims.includes('legendary:70'));
});

test('skeleton gear stats resolve from IDs and curse cannot refresh while active', () => {
  const player = { equipped_items: Object.fromEntries(Object.values(SKELETON_BP_EQUIPMENT).map(item=>[item.slot,item.id])) };
  const { effects } = calculateEquipmentEffects(player);
  assert.equal(effects.fingerDamageFlat,360);
  assert.equal(effects.bossDamageFlat,450);
  assert.deepEqual(resolveBoneCurse(player,100,now,()=>0),{damage:110,applied:true});
  const original = player.bone_curse;
  player.equipped_items = {};
  assert.deepEqual(resolveBoneCurse(player,100,now+1000,()=>0),{damage:110,applied:false});
  assert.equal(player.bone_curse,original);
  assert.equal(resolveBoneCurse(player,100,original.expiresAt,()=>0).damage,100);
});
