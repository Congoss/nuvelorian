import test from 'node:test';
import assert from 'node:assert/strict';
import {chatIndicators,markChatRead,markReleaseRead} from '../src/lib/chatReadState.js';
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};};
const message={id:'m',created_at:'2026-10-28T12:00:00Z'};
const patch={...message,releaseVersion:'3.27'};
test('reading clan chat does not clear unread world chat or a patch',()=>{
 const s=storage();markChatRead([message],'p','clan',s);
 assert.deepEqual(chatIndicators([message],'p','clan',s),{unread:false,patch:false});
 assert.deepEqual(chatIndicators([message,patch],'p','world',s),{unread:true,patch:true});
 markChatRead([message,patch],'p','world',s);
 assert.deepEqual(chatIndicators([message,patch],'p','world',s),{unread:false,patch:true});
 markReleaseRead('p','3.27',s);
 assert.deepEqual(chatIndicators([message,patch],'p','world',s),{unread:false,patch:false});
});
test('read status survives reload per account; a newer patch relights the lamp',()=>{
 const s=storage();markReleaseRead('p','3.27',s);
 assert.equal(chatIndicators([patch],'p','world',s).patch,false);
 assert.equal(chatIndicators([patch],'another','world',s).patch,true);
 assert.equal(chatIndicators([{...patch,releaseVersion:'3.28'}],'p','world',s).patch,true);
 assert.equal(chatIndicators([{...message,own:true},{...message,system:true}],'p','world',s).unread,false);
});
test('unavailable browser storage does not break chat or hide unread patches',()=>{
 const s={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert.doesNotThrow(()=>markReleaseRead('p','3.27',s));assert.doesNotThrow(()=>markChatRead([message],'p','world',s));
 assert.equal(chatIndicators([patch],'p','world',s).patch,true);
});

test('claimed current release and unread historical releases do not keep the lamp lit',()=>{
 const s=storage(),old={...patch,releaseVersion:'3.26',created_at:'2026-10-27T12:00:00Z'};
 assert.equal(chatIndicators([old,{...patch,rewardClaimed:true}],'p','world',s).patch,false);
 markReleaseRead('p',patch.releaseVersion,s);
 assert.equal(chatIndicators([patch,old],'p','world',s).patch,false);
 const newer={...patch,releaseVersion:'3.28',created_at:'2026-10-29T12:00:00Z'};
 assert.equal(chatIndicators([newer,patch,old],'p','world',s).patch,true);
});
test('reading a patch preserves the separate beacon for unread messages',()=>{
 const s=storage();markReleaseRead('p',patch.releaseVersion,s);
 assert.deepEqual(chatIndicators([patch,message],'p','world',s),{patch:false,unread:true});
 markChatRead([message],'p','world',s);
 assert.deepEqual(chatIndicators([patch,message],'p','world',s),{patch:false,unread:false});
});
