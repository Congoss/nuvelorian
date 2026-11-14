// Independent animated scenery. The character and exported frames keep their alpha.
const stage=document.querySelector('.stage'),select=document.querySelector('#background');
const canvas=document.createElement('canvas');canvas.className='backdrop';canvas.width=1024;canvas.height=1536;canvas.setAttribute('aria-label','Живий космос і механізми гаража');stage.prepend(canvas);
const ctx=canvas.getContext('2d');
const source=new Image();source.src='cartoon-garage.webp';await source.decode();
const image=document.createElement('canvas');image.width=canvas.width;image.height=canvas.height;
image.getContext('2d').drawImage(source,0,0,image.width,image.height);
const style=document.createElement('style');style.textContent='.stage.cartoon{background:#14151b}.stage canvas.backdrop{position:absolute;inset:0;z-index:0;width:100%;height:100%;max-width:100%;object-fit:contain;pointer-events:none}.stage:not(.cartoon) canvas.backdrop{display:none}aside{min-width:0}aside select{min-width:0;max-width:175px}';document.head.append(style);
style.textContent+='.stage.cartoon canvas.backdrop{filter:brightness(.72) saturate(.88)}';
select.add(new Option('Мультгараж · живий космос','cartoon',true,true),0);
select.addEventListener('change',()=>stage.classList.toggle('cartoon',select.value==='cartoon'));
select.value='cartoon';select.dispatchEvent(new Event('change'));
const stars=Array.from({length:33},(_,i)=>({x:Math.sin(i*73.17)*123,y:Math.cos(i*31.49)*130,r:i%9===0?5:1.3+(i%3)*.5,phase:i*1.73}));
function sparkle(x,y,r,alpha){ctx.globalAlpha=alpha;ctx.fillStyle='#fff1ff';ctx.beginPath();ctx.moveTo(x,y-r*2);ctx.quadraticCurveTo(x+r*.4,y-r*.4,x+r*1.3,y);ctx.quadraticCurveTo(x+r*.4,y+r*.4,x,y+r*2);ctx.quadraticCurveTo(x-r*.4,y+r*.4,x-r*1.3,y);ctx.quadraticCurveTo(x-r*.4,y-r*.4,x,y-r*2);ctx.fill();ctx.globalAlpha=1;}
function cosmos(t){
 ctx.save();ctx.beginPath();ctx.ellipse(880,300,133,138,0,0,Math.PI*2);ctx.clip();
 const sky=ctx.createRadialGradient(928,353,5,880,300,195);sky.addColorStop(0,'#38205c');sky.addColorStop(1,'#160d30');ctx.fillStyle=sky;ctx.fillRect(740,155,280,292);
 for(const s of stars){const x=880+((s.x+t*(1.4+s.r*.25)+150)%300+300)%300-150,y=300+s.y+Math.sin(t*.12+s.phase)*2;const alpha=.55+.4*Math.sin(t*(.7+s.r*.05)+s.phase)**2;if(s.r>4)sparkle(x,y,s.r,alpha);else{ctx.globalAlpha=alpha;ctx.fillStyle='#f8eaff';ctx.beginPath();ctx.arc(x,y,s.r,0,7);ctx.fill();ctx.globalAlpha=1;}}
 // The original illustrated planet is its own rigid moving disk.
 const px=920+Math.sin(t*.18)*12,py=320+Math.sin(t*.24)*8;
 ctx.save();ctx.translate(px,py);ctx.rotate(t*.075);ctx.beginPath();ctx.arc(0,0,39,0,7);ctx.clip();ctx.drawImage(image,884,278,80,80,-40,-40,80,80);ctx.restore();
 // A small cartoon ship crosses the window, behind the planet, every 16 seconds.
 const flight=((t+5)%16)/16;const sx=716+flight*338,sy=260+Math.sin(flight*Math.PI)*25;
 ctx.save();ctx.translate(sx,sy);ctx.strokeStyle='#080e20';ctx.lineWidth=2.5;ctx.fillStyle='#f4ab49';ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(-27-4*Math.sin(t*18),-5);ctx.lineTo(-22,0);ctx.lineTo(-27,5);ctx.closePath();ctx.fill();ctx.fillStyle='#a899c3';ctx.beginPath();ctx.ellipse(0,0,18,6,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#56ead6';ctx.beginPath();ctx.ellipse(0,-5,9,7,0,Math.PI,0);ctx.fill();ctx.stroke();ctx.restore();
 const meteor=(t+2)%11;if(meteor<.75){const k=meteor/.75;ctx.strokeStyle='#90fff1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(795+k*210,190+k*160);ctx.lineTo(775+k*210,175+k*160);ctx.stroke();}
 ctx.restore();
}
function tank(x,y,w,h,t,phase){ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,9);ctx.clip();ctx.fillStyle='#56ba09';ctx.fillRect(x,y,w,h);ctx.fillStyle='#8be700';ctx.beginPath();ctx.moveTo(x,y+h*.45);for(let i=0;i<=w;i+=4)ctx.lineTo(x+i,y+h*.4+Math.sin(i*.027+t*1.3)*h*.11);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.fill();for(let i=0;i<9;i++){const px=x+9+(i*37.9+phase)%Math.max(10,w-18),py=y+h-((t*(13+i%3*4)+i*23+phase)%h);ctx.fillStyle='#c6fc15';ctx.strokeStyle='#dcff36';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,3+(i%4)*3,0,7);ctx.fill();ctx.stroke();}ctx.fillStyle='#bdfcff66';ctx.fillRect(x+6,y+8,w-12,6);ctx.restore();}
function machinery(t){
 // Rotate only the inner fan disk, keeping its bolted housing fixed.
 ctx.save();ctx.beginPath();ctx.ellipse(900,1008,80,88,0,0,7);ctx.clip();ctx.translate(900,1008);ctx.rotate(t*1.25);ctx.drawImage(image,812,916,176,184,-88,-92,176,184);ctx.restore();
 tank(373,34,253,94,t,0);tank(10,627,94,126,t,37);
 const colors=['#ff42ae','#83f016','#ffe719','#17ebdf','#ff8e1a','#d921c4'];
 for(let i=0;i<6;i++){const x=868+(i%3)*48,y=580+Math.floor(i/3)*46,lit=Math.sin(t*(1.5+i*.29)+i*1.8)>.05;ctx.globalAlpha=lit?.48:.66;ctx.fillStyle=lit?colors[i]:'#172b34';ctx.beginPath();ctx.arc(x,y,13,0,7);ctx.fill();ctx.globalAlpha=1;if(lit){ctx.fillStyle='#fff9';ctx.beginPath();ctx.arc(x-4,y-5,3,0,7);ctx.fill();}}
 ctx.save();ctx.beginPath();ctx.rect(860,678,80,57);ctx.clip();ctx.fillStyle='#142c32';ctx.fillRect(860,678,80,57);ctx.strokeStyle='#315358';ctx.lineWidth=1;for(let x=860;x<941;x+=16){ctx.beginPath();ctx.moveTo(x,678);ctx.lineTo(x,735);ctx.stroke();}ctx.strokeStyle='#9bff18';ctx.lineWidth=3;ctx.beginPath();for(let x=0;x<=80;x++){const y=706+Math.sin(x*.24-t*4)*11+Math.sin(x*.08+t)*3;if(x===0)ctx.moveTo(860+x,y);else ctx.lineTo(860+x,y);}ctx.stroke();ctx.restore();
 ctx.save();ctx.beginPath();ctx.rect(575,195,65,45);ctx.clip();ctx.fillStyle='#205659';ctx.fillRect(575,195,65,45);ctx.strokeStyle='#62fff2';ctx.lineWidth=3;ctx.shadowColor='#39f7ec';ctx.shadowBlur=9;ctx.beginPath();ctx.moveTo(577,218);for(let i=1;i<=7;i++)ctx.lineTo(577+i*8,218+(i%2?1:-1)*(6+Math.sin(t*16+i*3)*6));ctx.stroke();ctx.restore();
 // A faint pulse in the bubblegum gadget's transparent pink bulb.
 ctx.globalAlpha=.1+.12*(.5+.5*Math.sin(t*2));ctx.fillStyle='#ffb4eb';ctx.beginPath();ctx.arc(282,812,26,0,7);ctx.fill();ctx.globalAlpha=1;
}
let last=-1;
function render(){const state=window.gumQueenPreview,t=state?.time||0,stamp=t+':'+state?.original;if(select.value==='cartoon'&&stamp!==last){ctx.clearRect(0,0,1024,1536);ctx.drawImage(image,0,0,1024,1536);if(!state?.original){cosmos(t);machinery(t);}last=stamp;}requestAnimationFrame(render);}
requestAnimationFrame(render);
