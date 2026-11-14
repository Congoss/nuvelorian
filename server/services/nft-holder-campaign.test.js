import test from 'node:test';
import assert from 'node:assert/strict';
import { largePoisonForPl4Balance, normalizeNftHolderCampaign } from './nft-holder-campaign.js';

test('large poison converts full million-token units with 18 decimals', () => {
  assert.equal(largePoisonForPl4Balance('999999999999999999999999', 18), 0);
  assert.equal(largePoisonForPl4Balance('1000000000000000000000000', 18), 1);
  assert.equal(largePoisonForPl4Balance('2500000000000000000000000', 18), 2);
});

test('large poison supports other FT decimal counts and rejects invalid balances', () => {
  assert.equal(largePoisonForPl4Balance('3000000', 0), 3);
  assert.equal(largePoisonForPl4Balance('oops', 18), 0);
});

test('NFT and token drops keep independent enablement and mail templates', () => {
  const config = normalizeNftHolderCampaign({ nftEnabled: true, tokenEnabled: false, nftTitle: 'NFT gift', tokenTitle: 'PL4 gift' });
  assert.equal(config.enabled, true);
  assert.equal(config.nftEnabled, true);
  assert.equal(config.tokenEnabled, false);
  assert.equal(config.nftTitle, 'NFT gift');
  assert.equal(config.tokenTitle, 'PL4 gift');
});
