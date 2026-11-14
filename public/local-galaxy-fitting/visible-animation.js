(()=>{
const stage=document.querySelector('.stage'),pet=document.querySelector('.lottery-pet');
const style=document.createElement('style');style.textContent=`
.lottery-pet{width:43%!important;left:-2%!important;animation:none!important;transform:none!important;aspect-ratio:1;object-fit:contain}
.living-cosmos{position:absolute;inset:0;z-index:2;pointer-events:none;mask-size:100% 100%;-webkit-mask-size:100% 100%;overflow:hidden}
.living-cosmos::before{content:'';position:absolute;inset:-18%;background:url('cosmic-texture.png') repeat;background-size:160px 160px;opacity:.72;animation:galaxy-travel 8s linear infinite;will-change:transform}
.living-cosmos::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 25% 30%,#e9ffff 0 1px,transparent 2px),radial-gradient(circle at 65% 60%,#8cffff 0 2px,transparent 3px);background-size:39px 43px,67px 71px;animation:star-travel 5s linear infinite;opacity:.8}
@keyframes galaxy-travel{from{transform:translate(-20px,-20px) rotate(-8deg)}to{transform:translate(35px,35px) rotate(8deg)}}
@keyframes star-travel{from{background-position:0 0,0 0}to{background-position:39px -43px,-67px -71px}}
.motion-paused .living-cosmos::before,.motion-paused .living-cosmos::after{animation-play-state:paused}
`;document.head.append(style);
const layers=[];
for(const slot of ['head','armor','hands','legs','boots','weapon']){
 const layer=document.createElement('div');layer.className='living-cosmos';layer.style.maskImage=layer.style.webkitMaskImage=`url('cosmic-mask-${slot}.png')`;
 layer.dataset.slot=slot;stage.append(layer);layers.push(layer);
}
const label=document.createElement('label');label.innerHTML='<input type="checkbox" checked> Рух космосу';document.querySelector('aside').append(label);
const toggle=label.querySelector('input');
let timer=null,index=0;const sequence=[[0,1800],[1,130],[0,160],[1,100],[0,1200],[2,650],[3,900],[0,1400]];
const frames=Array.from({length:4},(_,i)=>{const im=new Image();im.src=`pet-frame-${i}.png`;return im;});
function step(){pet.src='lottery-pet.png';}
function sync(){
 for(const layer of layers)layer.hidden=selected[layer.dataset.slot]!=='galaxy'||!toggle.checked;
 document.body.classList.toggle('motion-paused',document.hidden||!toggle.checked);
 if(timer)clearTimeout(timer);timer=null;
 if(!document.hidden&&toggle.checked)step();
}
document.addEventListener('visibilitychange',sync);toggle.addEventListener('change',sync);document.querySelector('#controls').addEventListener('change',sync);
pet.src='lottery-pet.png';sync();
})();
