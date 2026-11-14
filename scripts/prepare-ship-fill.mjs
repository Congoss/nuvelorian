import sharp from 'sharp';
import fs from 'node:fs';
import {SHIP_MODULES} from '../src/lib/clanShipPreview.js';
const masks={};
for(const {id} of SHIP_MODULES){
 const {data,info}=await sharp(`public/clan-ship-preview/${id}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const rows=Array(info.height).fill(0);
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const alpha=data[(y*info.width+x)*info.channels+info.channels-1];if(alpha>=16)rows[y]+=alpha;}
 const total=rows.reduce((sum,n)=>sum+n,0);
 masks[id]=Array.from({length:101},(_,percent)=>{
  if(percent===0)return 100;if(percent===100)return 0;
  const target=total*percent/100;let sum=0;
  for(let y=info.height-1;y>=0;y--){if(sum+rows[y]>=target)return Number(((y+1-(target-sum)/rows[y])/info.height*100).toFixed(4));sum+=rows[y];}
  return 0;
 });
}
fs.writeFileSync('src/lib/shipConstructionFill.js',`// Generated from visible PNG alpha by scripts/prepare-ship-fill.mjs.\nconst FILL_CUTOFFS=${JSON.stringify(masks)};\nexport function getShipConstructionClip(id,percent){\n const value=Math.max(0,Math.min(100,Number(percent)||0)),points=FILL_CUTOFFS[id];\n if(!points)return 100-value;\n const low=Math.floor(value),high=Math.ceil(value);\n return points[low]+(points[high]-points[low])*(value-low);\n}\n`);
console.log('Generated alpha-weighted fill for',SHIP_MODULES.length,'sectors');
