import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewsDraft, newsRecipients, processNewsQueue, telegramNewsPayload, recordNewsReturn } from '../server/services/telegram-news.js';
const texts={uk:'Новина',ru:'Новость',en:'News'};
const players=[{id:'p',telegram_id:'100001',language:'ru'},{id:'q',telegram_id:'100002',language:'en'},{id:'duplicate',telegram_id:'100001'},{id:'ban',telegram_id:'100003',is_banned:true},{id:'web'}];
test('news preview is a frozen draft, validates all languages and deduplicates recipients',()=>{
 const job=createNewsDraft(players,{texts,photo:'https://example.com/news.jpg',segment:'all'});
 assert.equal(job.status,'draft');assert.equal(job.recipients.length,2);assert.ok(job.recipients.every(r=>r.status==='pending'));
 assert.throws(()=>createNewsDraft(players,{texts:{uk:'only'},segment:'all'}),/TEXT_REQUIRED/);
 assert.throws(()=>createNewsDraft(players,{texts:{...texts,en:'x'.repeat(1025)},photo:'https://example.com/x',segment:'all'}),/1024/);
 assert.equal(newsRecipients([{telegram_id:'9',last_seen_at:'2026-10-01'}],'inactive',Date.parse('2026-10-28')).length,1);
 const payload=telegramNewsPayload(job,{chatId:'100001',language:'ru'});assert.equal(payload.caption,'Новость');assert.equal(payload.reply_markup.inline_keyboard[0][0].text,'Играть');assert.ok(payload.reply_markup.inline_keyboard[0][0].url.includes('startapp=news_'));
});
test('draft or missing bot token never sends; queued recipients persist before send and pay once',async()=>{
 const job=createNewsDraft(players,{texts,segment:'all'});const store={newsCampaigns:[job]};let sends=0,writes=0;
 const options={token:'test',persist:async()=>{writes++;},send:async(j,r)=>{assert.equal(r.status,'sending');assert.ok(writes>0);sends++;return sends;}};
 await processNewsQueue(store,options);assert.equal(sends,0);
 job.status='queued';await processNewsQueue(store,{...options,token:''});assert.equal(sends,0);
 await processNewsQueue(store,options);assert.equal(sends,2);assert.equal(job.status,'completed');
 await processNewsQueue(store,options);assert.equal(sends,2);
});
test('ambiguous delivery is not retried and Telegram 429 waits before retry',async()=>{
 const job=createNewsDraft([{id:'p',telegram_id:'100001'}],{texts,segment:'all'});job.status='queued';const store={newsCampaigns:[job]};let attempts=0;
 await processNewsQueue(store,{token:'test',persist:async()=>{},send:async()=>{attempts++;throw Error('network');}});
 assert.equal(job.recipients[0].status,'uncertain');await processNewsQueue(store,{token:'test',persist:async()=>{},send:async()=>{attempts++;}});assert.equal(attempts,1);
 const retry=createNewsDraft([{telegram_id:'100001'}],{texts,segment:'all'});retry.status='queued';
 await processNewsQueue({newsCampaigns:[retry]},{token:'test',persist:async()=>{},send:async()=>{throw Object.assign(Error('rate'),{telegramCode:429,retryAfter:20});}});
 assert.equal(retry.recipients[0].status,'pending');assert.ok(retry.recipients[0].notBefore>Date.now());
});
test('persist failure prevents sending and restart does not resend in-flight recipients',async()=>{
 const job=createNewsDraft([{telegram_id:'100001'}],{texts,segment:'all'});job.status='queued';let sent=false;
 await assert.rejects(processNewsQueue({newsCampaigns:[job]},{token:'test',persist:async()=>{throw Error('storage');},send:async()=>{sent=true;}}));assert.equal(sent,false);
 await processNewsQueue({newsCampaigns:[job]},{token:'test',persist:async()=>{},send:async()=>{sent=true;}});assert.equal(sent,false);assert.equal(job.recipients[0].status,'uncertain');
});
test('campaign button returns are attributed to delivered recipients once',()=>{
 const job=createNewsDraft([{id:'p',telegram_id:'100001'}],{texts,segment:'all'});job.recipients[0].status='sent';job.recipients[0].sentAt=new Date().toISOString();
 const store={newsCampaigns:[job]};const tag='news_'+job.id.replaceAll('-','');recordNewsReturn(store,{id:'p',telegram_id:'100001'},tag);recordNewsReturn(store,{id:'p',telegram_id:'100001'},tag);recordNewsReturn(store,{id:'x',telegram_id:'100002'},tag);
 assert.deepEqual(Object.keys(job.returns),['p']);
});
