import {useEffect,useRef,useState} from 'react';
import {X} from 'lucide-react';
import {HALLOWEEN,halloweenActive} from '@/lib/halloweenEvent';
import pumpkin from '@/assets/ui/halloween-pumpkin.webp';
import poster from '@/assets/ui/halloween-welcome-cartoon.webp';
import pirateHead from '@/assets/ui/halloween-pirate-head.webp';
import topOneGift from '@/assets/ui/mad-pumpkin-8093.webp';
import topTwoGift from '@/assets/ui/evil-eye-54086.webp';
import topThreeGift from '@/assets/ui/witch-hat-71230.webp';
import './halloweenWelcome.css';
const dismissed=new Set();
const giftPreviews=[
 ['MadPumpkin-8093',topOneGift],['EvilEye-54086',topTwoGift],['WitchHat-71230',topThreeGift]
];
const copy={
uk:{title:'ЗНОВУ ГАРБУЗИ. ЯКОГО БІСА?',intro:'Космос величезний. А ти знову працюєш за овочі.',play:'Бий босів, виконуй завдання та лови рибу — збирай гарбузи серед нагород.',gear:'Моторошний шмот',pet:'Дивний вихованець',gifts:'Telegram-подарунки',shop:'Обмінюй гарбузи на Halloween-шмот і вихованця. Хочеш Telegram-подарунки? Пробивайся в топ рейтингу активності.',button:'Гаразд, погнали',close:'Закрити'},
ru:{title:'ОПЯТЬ ТЫКВЫ. КАКОГО ХРЕНА?',intro:'Космос огромный. А ты снова работаешь за овощи.',play:'Бей боссов, выполняй задания и лови рыбу — собирай тыквы среди наград.',gear:'Жуткий шмот',pet:'Странный питомец',gifts:'Telegram-подарки',shop:'Меняй тыквы на Halloween-шмот и питомца. Хочешь Telegram-подарки? Пробивайся в топ рейтинга активности.',button:'Ладно, погнали',close:'Закрыть'},
en:{title:'PUMPKINS AGAIN. WHAT THE HELL?',intro:'Space is huge. And here you are, working for vegetables again.',play:'Fight bosses, complete tasks and go fishing — collect pumpkins among your rewards.',gear:'Spooky gear',pet:'Weird pet',gifts:'Telegram gifts',shop:'Trade pumpkins for Halloween gear and a pet. Want Telegram gifts? Fight your way to the top of the activity leaderboard.',button:'Fine, let’s go',close:'Close'}};
export default function HalloweenWelcome({profile,ready,onEnter}){
 const dialog=useRef(null);const [closed,setClosed]=useState(false);
 const key=HALLOWEEN.id+':'+profile?.id;const text=copy[profile?.language]||copy.uk;
 const available=Boolean(ready&&profile?.id&&halloweenActive()&&!closed&&!dismissed.has(key));
 useEffect(()=>{const node=dialog.current;if(available&&node&&!node.open)node.showModal();if(!available&&node?.open)node.close();return()=>{if(node?.open)node.close();};},[available]);
 const close=()=>{dismissed.add(key);setClosed(true);dialog.current?.close();};
 return <dialog ref={dialog} style={{'--halloween-poster': `url(${poster})`}} className="halloween-welcome" aria-labelledby="halloween-welcome-title" onCancel={event=>{event.preventDefault();close();}}>
 <div className="halloween-welcome-art"><button type="button" autoFocus className="halloween-welcome-close" aria-label={text.close} onClick={close}><X size={21}/></button></div>
 <div className="halloween-welcome-body"><span className="halloween-welcome-tag">HALLOWEEN 2026 · VOID FLUSH</span><h2 id="halloween-welcome-title">{text.title}</h2><p className="halloween-welcome-intro">{text.intro}</p><div className="halloween-welcome-mascot"><img className="halloween-welcome-pumpkin" src={pumpkin} alt=""/></div><p className="halloween-welcome-play">{text.play}</p>
 <div className="halloween-welcome-prizes">
  <div><img className="halloween-welcome-prize-main" src={pirateHead} alt=""/><span>{text.gear}</span></div>
  <div><img className="halloween-welcome-prize-main halloween-welcome-prize-pet" src={pumpkin} alt=""/><span>{text.pet}</span></div>
  <div><span className="halloween-welcome-gift-stack">{giftPreviews.map(([slug,image])=><a key={slug} href={'https://t.me/nft/'+slug} target="_blank" rel="noopener noreferrer"><img src={image} alt=""/></a>)}</span><span>{text.gifts}</span></div>
 </div>
 <p>{text.shop}</p><button type="button" className="halloween-welcome-enter" onClick={()=>{close();onEnter();}}>{text.button} →</button></div></dialog>;
}
