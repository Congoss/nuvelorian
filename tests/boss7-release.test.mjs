import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';
import { isBossReleased } from '../src/lib/bossAvailability.js';
test('Cleopatrash and Shkraban are released; later bosses remain locked',()=>{
 for(const boss of GAME_CONFIG.BOSSES.slice(0,8))assert.equal(isBossReleased(boss.id),true);
 for(const boss of GAME_CONFIG.BOSSES.slice(8))assert.equal(isBossReleased(boss.id),false);
 assert.equal(isBossReleased('unknown'),false);
 const boss=GAME_CONFIG.BOSSES.find(b=>b.id==='boss7');assert.equal(boss.minLevel,80);assert.equal(boss.maxHp,3000000);
 assert.equal(GAME_CONFIG.BOSSES.find(b=>b.id==='boss8').maxHp,7000000);
});
