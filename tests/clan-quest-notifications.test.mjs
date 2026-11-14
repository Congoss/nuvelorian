import test from 'node:test';import assert from 'node:assert/strict';
import {completedPlayerClanQuests,clanQuestCompletionMessage} from '../src/lib/clanQuestNotifications.js';
test('completion notifications select only rewarded quests belonging to the player',()=>{
 const quests=[{id:'own',status:'COMPLETED',owner_id:'p',rewards_granted_at:'now'},{id:'helped',status:'COMPLETED',owner_id:'other',participants:['p'],rewards_granted_at:'now'},{id:'other',status:'COMPLETED',owner_id:'other',rewards_granted_at:'now'},{id:'pending',status:'COMPLETED',owner_id:'p'},{id:'active',status:'ACTIVE',owner_id:'p',rewards_granted_at:'now'}];
 assert.deepEqual(completedPlayerClanQuests(quests,'p').map(q=>q.id),['own','helped']);assert.deepEqual(completedPlayerClanQuests(null,'p'),[]);
 for(const lang of ['uk','ru','en']){const message=clanQuestCompletionMessage(lang);assert.ok(message.title&&message.description);}
});
