import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAffiliateLink, buildReferralLink } from '../src/lib/referralLinks.js';
import { referralPage } from '../server/utils/referralPage.js';
import { prepareReferralMessage } from '../server/utils/referralMessage.js';

test('each player keeps their own affiliate token alongside their game referral code', () => {
  const a = {referral_code:'player-a',telegram_affiliate_url:'https://t.me/planet_4bot?start=_tgr_TestAffiliateA'};
  const b = {referral_code:'player-b',telegram_affiliate_url:'https://t.me/planet_4bot?ref=TestAffiliateB'};
  const first = new URL(buildReferralLink(a));const second = new URL(buildReferralLink(b));
  assert.equal(first.searchParams.get('startapp'),'ref_player-a');
  assert.equal(first.searchParams.get('ref'),'TestAffiliateA');
  assert.equal(second.searchParams.get('startapp'),'ref_player-b');
  assert.equal(second.searchParams.get('ref'),'TestAffiliateB');
  assert.equal(buildReferralLink({telegram_id:'123'}),'https://t.me/planet_4bot?startapp=ref_123');
  assert.equal(new URL(buildReferralLink(a,' @planet_4bot ')).pathname,'/planet_4bot');
});

test('reject ordinary game links, other bots, unsafe URLs and ambiguous tokens', () => {
  for (const value of [null,{},[], 'https://t.me/otherbot?ref=TestAffiliateA',
    'https://t.me/planet_4bot?startapp=ref_player-a', 'http://t.me/planet_4bot?ref=TestAffiliateA',
    'https://t.me.evil.test/planet_4bot?ref=TestAffiliateA', 'javascript:alert(1)',
    'https://user:password@t.me/planet_4bot?ref=TestAffiliateA',
    'https://t.me/planet_4bot?ref=A&ref=B', 'https://t.me/planet_4bot?ref=%3Cscript%3E']) {
    assert.throws(()=>parseAffiliateLink(value),/INVALID_TELEGRAM_AFFILIATE_LINK/);
  }
});

test('prepared Telegram message and invitation page use the same combined destination', async () => {
  const player={telegram_id:'123',referral_code:'player-a',telegram_affiliate_url:'https://t.me/planet_4bot?start=_tgr_TestAffiliateA'};
  let body;
  await prepareReferralMessage({player,token:'test-only',fetchImpl:async(_url,options)=>{
    body=JSON.parse(options.body);return {ok:true,json:async()=>({ok:true,result:{id:'test'}})};
  }});
  const target=body.result.reply_markup.inline_keyboard[0][0].url;
  assert.equal(target,buildReferralLink(player));
  assert.ok(referralPage('player-a','uk',player.telegram_affiliate_url).includes(`href="${target.replaceAll('&','&amp;')}"`));
});

