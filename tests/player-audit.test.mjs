import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {withPlayerAudit,trackPlayer,auditBody,auditXp,auditResult,readPlayerAudit} from '../server/utils/playerAudit.js';
test('audit stores deltas, XP source and safe references without credentials',async()=>{
 process.env.PLAYER_AUDIT_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'player-audit-'));
 const player={id:'test',level:1,xp:0,tentacles:5};
 await withPlayerAudit({url:'/loot/claim',method:'POST'},{statusCode:200},async()=>{trackPlayer(player);auditBody({instanceId:'reward-1',token:'secret'});auditXp(player,20);player.xp=20;player.tentacles=9});
 const rows=await readPlayerAudit('test');assert.equal(rows.length,1);assert.equal(rows[0].before.xp,0);assert.equal(rows[0].after.xp,20);assert.equal(rows[0].xpGrants[0].amount,20);assert.equal(rows[0].refs.instanceId,'reward-1');assert.ok(!JSON.stringify(rows).includes('secret'));
 assert.equal((await readPlayerAudit('test','2099')).length,0);assert.equal((await readPlayerAudit('missing')).length,0);
});
test('audit preserves nested action references and combat results without credentials',async()=>{
 const player={id:'nested',xp:0,tentacles:0};
 await withPlayerAudit({url:'/api/players/nested',method:'PATCH'},{statusCode:200},async()=>{
  trackPlayer(player);auditBody({task:{id:'mission-1'},count:8,playerAction:{type:'shop-fixed',itemId:'box',token:'secret'}});
  player.tentacles=100;auditResult({reward:{tentacles:100},hit:{damage:123},fight:{id:'fight',boss_id:'boss7',current_hp:100,max_hp:3000000},token:'secret'});
 });
 const [row]=await readPlayerAudit('nested');assert.equal(row.refs.taskId,'mission-1');assert.equal(row.refs.count,'8');assert.equal(row.refs.actionType,'shop-fixed');assert.equal(row.result.hit.damage,123);assert.equal(row.result.fight.bossId,'boss7');assert.equal(row.before.tentacles,0);assert.equal(row.after.tentacles,100);assert(!JSON.stringify(row).includes('secret'));
});
