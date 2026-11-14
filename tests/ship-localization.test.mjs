import assert from 'node:assert/strict';
import test from 'node:test';
import {SHIP_MODULES} from '../src/lib/clanShipPreview.js';
import {getShipBossName,SHIP_BATTLE_TEXT} from '../src/lib/shipBattleText.js';
import {localizeApiError} from '../src/lib/apiErrorTranslations.js';
import {paymentText} from '../src/lib/paymentUiText.js';
test('all ship bosses and battle controls have uk, ru and en strings',()=>{
 for(const language of ['uk','ru','en']){
  for(const module of SHIP_MODULES)assert.notEqual(getShipBossName(module.id,language),module.id);
  assert.deepEqual(Object.keys(SHIP_BATTLE_TEXT[language]),Object.keys(SHIP_BATTLE_TEXT.uk));
  for(const value of Object.values(SHIP_BATTLE_TEXT[language]))assert(value.trim().length>0);
  for(const code of ['SHIP_FIGHT_NOT_FOUND','SHIP_STORAGE_UNAVAILABLE','SHIP_SECTOR_NOT_BUILT','SHIP_FIGHT_NOT_ACTIVE'])assert.notEqual(localizeApiError(code,code,language),code);
 }
 assert.notEqual(paymentText('Ready to pay','uk'),'Ready to pay');assert.notEqual(paymentText('Payment complete','ru'),'Payment complete');
});
