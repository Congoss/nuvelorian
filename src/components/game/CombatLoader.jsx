import {useTranslation} from 'react-i18next';
import './combatLoader.css';
import './combatItemLoader.css';
// Original movement: samvgm, https://codepen.io/samvgm/pen/LVzpJW (MIT).
export default function CombatLoader({className='',variant='weapons',compact=false}){
 const {i18n}=useTranslation();
 const lang=i18n.resolvedLanguage||i18n.language;
 const label=lang?.startsWith('ru')?'Загрузка':lang?.startsWith('en')?'Loading':'Завантаження';
 const items=variant==='weapons';
 return <span role="status" aria-label={label} className={`p4-lightsaber-frame ${items?'p4-item-duel':''} ${compact?'p4-loader-compact':''} ${className}`}>
  <span aria-hidden="true" className="p4-lightsaber">
   {[1,2,3,4,5].map(index=><span key={index} className={`ls-particles ls-part-${index}`}/>)}
   <span className="p4-loader-x p4-loader-x-left"><span className="p4-loader-y"><span className="lightsaber ls-left ls-green">{items&&<svg viewBox="0 0 12 44"><path d="M3 10 6 1 9 10V35H3Z" fill="#f2cd34" stroke="#15271d" strokeWidth="1.2"/><path d="m3 10 3-9 3 9Z" fill="#e7d3a0"/><path d="m4.6 5.2 1.4-4.2 1.4 4.2Z" fill="#22312a"/><path d="M5 11V33" stroke="#fff186"/><path d="M7.5 11V33" stroke="#bc8d20"/><path d="M3 34H9V39H3Z" fill="#91b3a5" stroke="#15271d"/><path d="M3 39H9V42Q6 45 3 42Z" fill="#e57c91" stroke="#15271d"/></svg>}</span></span></span>
   <span className="p4-loader-x p4-loader-x-right"><span className="p4-loader-y"><span className="lightsaber ls-right ls-red">{items&&<svg viewBox="0 0 12 44"><path d="M3 9H9V37Q9 43 6 43T3 37Z" fill="#c2eee1" fillOpacity=".18" stroke="#b0dfcf" strokeWidth="1.1"/><path d="M4 21H8V37Q8 41 6 41T4 37Z" fill="#b5e936"/><path d="M3 20Q5 18 7 20T9 20" fill="none" stroke="#dfff78"/><path d="M2 5H10V10H2Z" fill="#d35a53" stroke="#172b20"/><path d="M3 1H9V5H3Z" fill="#a47a3e" stroke="#172b20"/><path d="M4 11V18M4 23V31" stroke="#f2fff0" strokeWidth=".8"/><circle cx="7" cy="32" r=".7" fill="#efffc0"/><circle cx="5.5" cy="36" r=".6" fill="#efffc0"/></svg>}</span></span></span>
  </span>
 </span>;
}
