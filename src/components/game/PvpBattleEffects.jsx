import bossCloud from '@/assets/boss/poision.gif';
import knockoutArt from '@/assets/pvp/knockout-v1.webp';

const copy={uk:{player:'ТИ ВИГРАВ РАУНД',opponent:'ТИ ПРОГРАВ РАУНД',draw:'НІЧИЯ'},ru:{player:'ТЫ ВЫИГРАЛ РАУНД',opponent:'ТЫ ПРОИГРАЛ РАУНД',draw:'НИЧЬЯ'},en:{player:'ROUND WON',opponent:'ROUND LOST',draw:'DRAW'}};
const bubbleCopy = {
 uk: {player:'Є КОНТАКТ!', opponent:'ОЙ, ВСЕ!', draw:'НІЧИЯ'},
 ru: {player:'ЕСТЬ КОНТАКТ!', opponent:'ОЙ, ВСЁ!', draw:'НИЧЬЯ'},
 en: {player:'CONTACT!', opponent:'OH, CRAP!', draw:'DRAW'},
};
export const pvpRoundOutcome=(language,winner)=>(copy[language]||copy.uk)[winner]||'';
export function PvpDefeatSmoke(){return <div className="pvp-skunk-smoke" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{'--puff':i,'--drift':`${(i%3-1)*14}px`}}/>)}<span>☠</span></div>;}
export default function PvpBattleEffects({round,finished=false,language='uk'}){
 if(!round)return null;
 const t = bubbleCopy[language] || bubbleCopy.uk;
 const draw = round.winner === 'draw';
 return <div key={round.round} className={`pvp-battle-fx ${round.winner}`} aria-hidden="true">
  <div className="pvp-outcome-wash"/>
  {finished ? <div className="pvp-knockout"><img src={knockoutArt} alt=""/></div> : <div className="pvp-round-callout">
   <img src={bossCloud} alt="" className="pvp-boss-cloud" />
   <span>{t[round.winner]}</span>
  </div>}
  {!draw && <div className="pvp-critical-impact">
   <svg viewBox="0 0 72 72" className="pvp-boss-flash" fill="none">
    <path d="m36 7 5 19 17-10-10 17 17 5-20 4 7 18-16-13-12 16 3-21-20-4 20-7-8-17 14 12Z" fill="#ffd66a" fillOpacity=".7" stroke="#fff4c4" strokeWidth="2"/>
    <path d="m9 11 8 8m40 36 7 7M7 57l9-7m41-37 8-7" stroke="#ffebae" strokeWidth="3" strokeLinecap="round"/>
   </svg>
   <b>−{round.damage.toLocaleString(language === 'uk' ? 'uk-UA' : language)}</b>
  </div>}
 </div>;
}
