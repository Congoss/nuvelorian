import test from 'node:test';import assert from 'node:assert/strict';import{bossMedalLayout}from'../src/lib/bossMedalLayout.js';
test('medal rows fit mobile, desktop and short landscape scenes with whole scroll rows',()=>{
 for(const height of [260,400,560,700,900,1200])for(const width of [280,375,520])for(const top of [height*.2,Math.min(height*.6,200)])for(const count of [0,1,3,4,6,8]){
  const result=bossMedalLayout({height,width,top,count});assert.ok(result.count>=4&&result.count<=6);assert.equal(result.height%result.size,0);assert.equal(result.height,Math.min(count,result.count)*result.size);assert.ok(result.height<=Math.max(4,Math.floor(height-top-height*.12-12)));assert.ok(result.size<=76);
 }
});
test('hidden scenes do not overwrite valid measured layout',()=>{assert.equal(bossMedalLayout({height:0,width:520,top:0,count:8}),null);assert.equal(bossMedalLayout({height:700,width:0,top:200,count:8}),null);});
test('medals stop above the chat launcher and bottom navigation',()=>{
 for(const height of [500,680,800])for(const bottomInset of [140,180,220]){
  const top=210,result=bossMedalLayout({height,width:520,top,count:11,bottomInset});
  assert(top+result.height+12<=height-bottomInset);
  assert.equal(result.height%result.size,0);
 }
});
