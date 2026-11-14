(()=>{
const old=document.querySelector('.lottery-pet');old.style.setProperty('display','none','important');
const rig=document.createElement('div');rig.className='lottery-pet-rig';
for(const name of ['tail','ear-left','ear-right','body']){
 const layer=document.createElement('div');layer.className='pet-part pet-'+name;
 layer.innerHTML=`<img src="pet-${name}.png?v=2" alt=""><img class="turquoise-glow" src="pet-${name}-glow.png?v=2" alt="">`;
 rig.append(layer);
}
old.after(rig);
const css=document.createElement('style');css.textContent=`
.lottery-pet-rig{position:absolute;left:-2%;bottom:3%;width:43%;aspect-ratio:1230/1278;z-index:4;pointer-events:none}
.pet-part,.pet-part img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.pet-part{will-change:transform}
.pet-ear-left{transform-origin:28% 38%;animation:ear-left 6.7s ease-in-out infinite}
.pet-ear-right{transform-origin:65% 38%;animation:ear-right 8.1s ease-in-out infinite}
.pet-tail{transform-origin:77% 86%;animation:tail-swish 4.6s ease-in-out infinite}
.turquoise-glow{filter:drop-shadow(0 0 3px #4affe0);animation:turquoise-pulse 3.4s ease-in-out infinite;mix-blend-mode:screen}
@keyframes ear-left{0%,30%,55%,100%{transform:rotate(0deg)}36%{transform:rotate(-4deg)}41%{transform:rotate(2deg)}47%{transform:rotate(-1.5deg)}}
@keyframes ear-right{0%,58%,85%,100%{transform:rotate(0deg)}65%{transform:rotate(3deg)}71%{transform:rotate(-2deg)}78%{transform:rotate(1deg)}}
@keyframes tail-swish{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(4deg)}}
@keyframes turquoise-pulse{0%,100%{opacity:.12}50%{opacity:.65}}
.motion-paused .pet-part,.motion-paused .turquoise-glow{animation-play-state:paused}
`;
document.head.append(css);
const toggle=document.querySelector('#show-pet');const sync=()=>{rig.hidden=!toggle.checked;};toggle.addEventListener('change',sync);sync();
})();
