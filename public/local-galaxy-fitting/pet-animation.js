const lotteryPet=document.querySelector('.lottery-pet');
const petStyle=document.createElement('style');
petStyle.textContent=`
.lottery-pet{transform-origin:50% 96%;animation:pet-breathe 3.6s ease-in-out infinite;will-change:transform}
@keyframes pet-breathe{0%,100%{transform:translateY(0) rotate(-1deg) scale(1,1)}50%{transform:translateY(-3px) rotate(1deg) scale(1.025,1.045)}}
.pet-aura{position:absolute;left:0;bottom:3%;width:32%;aspect-ratio:1229/1254;z-index:4;pointer-events:none;transform-origin:50% 96%;animation:pet-breathe 3.6s ease-in-out infinite}
.pet-rune{position:absolute;left:42%;top:27%;width:7%;height:7%;border-radius:50%;background:radial-gradient(ellipse,rgba(120,255,249,.8),rgba(48,216,225,.25) 45%,transparent 72%);animation:pet-rune 2.6s ease-in-out infinite}
@keyframes pet-rune{0%,100%{opacity:.15;transform:scale(.8)}50%{opacity:.85;transform:scale(1.3)}}
body.pet-paused .lottery-pet,body.pet-paused .pet-aura,body.pet-paused .pet-rune{animation-play-state:paused}
`;
document.head.append(petStyle);
const aura=document.createElement('div');aura.className='pet-aura';aura.innerHTML='<i class="pet-rune"></i>';lotteryPet.after(aura);
const petToggle=document.createElement('label');petToggle.innerHTML='<input type="checkbox" checked> Анімація пета';document.querySelector('aside').append(petToggle);
function petMotion(){document.body.classList.toggle('pet-paused',document.hidden||!petToggle.querySelector('input').checked);aura.hidden=lotteryPet.hidden;}
document.addEventListener('visibilitychange',petMotion);petToggle.addEventListener('change',petMotion);document.querySelector('#show-pet').addEventListener('change',petMotion);petMotion();
