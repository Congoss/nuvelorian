import test from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';
import {SHIP_MODULES} from '../src/lib/clanShipPreview.js';
import {getShipConstructionClip} from '../src/lib/shipConstructionFill.js';
test('sector fill reveals the paid fraction of visible art, ignoring transparent padding',async()=>{
 for(const {id} of SHIP_MODULES){
  const {data,info}=await sharp(`public/clan-ship-preview/${id}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const rows=Array(info.height).fill(0);
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*info.channels+info.channels-1];if(a>=16)rows[y]+=a;}
  const total=rows.reduce((s,n)=>s+n,0);
  assert.equal(getShipConstructionClip(id,0),100);assert.equal(getShipConstructionClip(id,100),0);
  for(const percent of [10,40,75,99]){
   const cutoff=getShipConstructionClip(id,percent)*info.height/100;
   const visible=rows.reduce((sum,n,y)=>sum+n*Math.max(0,Math.min(1,y+1-cutoff)),0);
   assert(Math.abs(visible/total-percent/100)<.001,`${id} ${percent}%`);
  }
 }
});
