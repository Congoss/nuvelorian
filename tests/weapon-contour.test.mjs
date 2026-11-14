import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWeaponContour} from '../src/lib/weaponContour.js';
for(const kind of ['vertical','diagonal','fork'])test('weapon silhouette anchors and morphable bolts: '+kind,()=>{
 const width=282,height=480,data=new Uint8ClampedArray(width*height*4);
 for(let y=50;y<430;y++)for(let x=20;x<260;x++){
  const center=kind==='diagonal'?40+y*.4:140;
  const solid=Math.abs(x-center)<5||(kind==='fork'&&y<180&&(Math.abs(x-110)<4||Math.abs(x-170)<4));
  if(solid)data[(y*width+x)*4+3]=255;
 }
 const result=buildWeaponContour(data,width,height);
 assert.equal(result.anchors.length,160);assert.equal(result.bolts.length,6);
 for(const [x,y,nx,ny]of result.anchors){const px=Math.round(x*width/100),py=Math.round(y*height/100);assert.equal(data[(py*width+px)*4+3],255);assert.ok(Math.abs(Math.hypot(nx,ny)-1)<1e-8);}
 const lengths=result.bolts.map(path=>path.match(/[ML]/g).length);assert.ok(lengths.every(n=>n===lengths[0]));assert.ok(result.bolts.every(path=>!path.includes('NaN')));
});
test('empty artwork has no flames or lightning geometry',()=>assert.deepEqual(buildWeaponContour(new Uint8ClampedArray(282*480*4)),{anchors:[],bolts:[]}));
