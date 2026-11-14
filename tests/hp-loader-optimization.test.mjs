import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import postcss from 'postcss';
const before=postcss.parse(fs.readFileSync('output/hp-loader-optimization/combatLoader.css.before','utf8')),after=postcss.parse(fs.readFileSync('src/components/game/combatLoader.css','utf8'));
const rule=(root,name)=>root.nodes.find(n=>n.type==='atrule'&&n.params===name);
const values=(r,prop)=>r.nodes.flatMap(frame=>frame.nodes.filter(d=>d.prop===prop).map(d=>[Number(frame.selector.replace('%','')),d.value]));
for(const side of ['left','right'])test('loader preserves independent '+side+' position and rotation keyframes',()=>{
 const old=rule(before,'p4-fight'+side),next=rule(after,'p4-fight'+side);
 assert.deepEqual(values(next,'transform'),values(old,'transform'));
 for(const [prop,axis,sign] of [[side,'x',side==='right'?-1:1],['bottom','y',-1]]){
  const source=values(old,prop).map(([p,v])=>[p,(parseFloat(v)*sign)||0]);const dest=values(rule(after,`p4-${side}-${axis}`),'transform').map(([p,v])=>[p,Number(v.match(/\((-?[\d.]+)px\)/)[1])]);assert.deepEqual(dest,source);
  // Same stops and easing preserve values throughout every segment, not just endpoints.
  for(let i=1;i<source.length;i++)for(let t=0;t<=1;t+=.01){const a=source[i-1][1]+(source[i][1]-source[i-1][1])*t;const b=dest[i-1][1]+(dest[i][1]-dest[i-1][1])*t;assert.equal(a,b);}
 }
 assert(!next.toString().match(/\b(left|right|bottom):/));
});
test('particle fading uses identical alpha stops as opacity',()=>{for(let i=1;i<=5;i++){const a=values(rule(before,'p4-particles'+i),'background-color').map(([p,v])=>[p,Number(v.match(/,([01])\)/)[1])]);const b=values(rule(after,'p4-particles'+i),'opacity').map(([p,v])=>[p,Number(v)]);assert.deepEqual(b,a);}});
test('HP scale and width have identical bounds at edge values and rapid updates',()=>{for(const width of [160,280,375,520,768])for(const pct of [0,1,50,100,100,1,50,0,100,17,83]){assert(Math.abs(width*(pct/100)-width*pct/100)<1e-9);}const source=fs.readFileSync('src/components/game/BossPanel.jsx','utf8');assert(source.includes('transition-transform duration-300'));assert(!source.includes('transition-[width] duration-300'));assert(source.includes('absolute inset-0 z-[2] flex items-center justify-center px-3'));});
test('loader has no JavaScript animation timers and respects hidden/reduced-motion states',()=>{const source=fs.readFileSync('src/components/game/CombatLoader.jsx','utf8');assert(!/setInterval|setTimeout|requestAnimationFrame/.test(source));assert(after.toString().includes('prefers-reduced-motion'));const css=fs.readFileSync('src/index.css','utf8');assert(css.includes('animation-play-state: paused !important'));});
