import test from 'node:test';
import assert from 'node:assert/strict';
import {getChatMessageAvatar} from '../src/lib/chatMessageAvatar.js';
test('foreign messages without photos never inherit the viewer avatar',()=>{
 assert.equal(getChatMessageAvatar({own:false},'my-photo','default'),'default');
 assert.equal(getChatMessageAvatar({author:'NEAR user'},'my-photo','default'),'default');
 assert.equal(getChatMessageAvatar({own:true},'my-photo','default'),'my-photo');
 assert.equal(getChatMessageAvatar({own:false,photo_url:'their-photo'},'my-photo','default'),'their-photo');
});
