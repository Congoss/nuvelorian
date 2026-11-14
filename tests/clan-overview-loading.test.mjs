import test from 'node:test';
import assert from 'node:assert/strict';
import {QueryClient, QueryObserver} from '@tanstack/react-query';
import {clanOverviewQueries} from '../src/lib/clanOverviewQueries.js';
test('clan prefetch and screen share a single request; cached roster is available immediately',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});let requests=0,finish;const avatars=[];
 const api={listClanMembers:()=>{requests++;return new Promise(resolve=>{finish=resolve;});}};
 const options=clanOverviewQueries({id:'p',clan_id:'a'},api,src=>avatars.push(src)).members;
 try{
  const prefetch=client.prefetchQuery(options);const opening=client.fetchQuery(options);
  assert.equal(requests,1);finish([{id:'m',avatar:'avatar.webp',battle_pass_view:{tier:'legendary'}}]);
  await Promise.all([prefetch,opening]);
  assert.equal(client.getQueryData(options.queryKey)[0].battle_pass_view.tier,'legendary');
  await client.fetchQuery(options);assert.equal(requests,1);assert.deepEqual(avatars,['avatar.webp']);
 }finally{client.clear();}
});
test('clan membership and account changes cannot reuse another roster',()=>{
 const api={};const a=clanOverviewQueries({id:'p',clan_id:'a'},api);
 assert.notDeepEqual(a.members.queryKey,clanOverviewQueries({id:'p',clan_id:'b'},api).members.queryKey);
 assert.notDeepEqual(a.members.queryKey,clanOverviewQueries({id:'other',clan_id:'a'},api).members.queryKey);
 assert.equal(clanOverviewQueries({id:'p'},api).members.enabled,false);
});
test('background refetch keeps visible members and mutation invalidation refreshes them',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});let finish,calls=0;
 const options=clanOverviewQueries({id:'p',clan_id:'a'},{listClanMembers:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}}).members;
 client.setQueryData(options.queryKey,[{id:'old'}]);const observer=new QueryObserver(client,options);const stop=observer.subscribe(()=>{});
 try{const refresh=client.invalidateQueries({queryKey:['clan-overview','p','a']});assert.equal(client.getQueryData(options.queryKey)[0].id,'old');assert.equal(calls,1);finish([{id:'new'}]);await refresh;assert.equal(client.getQueryData(options.queryKey)[0].id,'new');}finally{stop();observer.destroy();client.clear();}
});
