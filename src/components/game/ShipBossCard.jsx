import {isShipBossReleased} from '@/lib/shipBossPresentation';
import {getShipGumDropRates} from '@/lib/shipGumDrops';
import BossPortraitHp from './BossPortraitHp';
import {CHEESE_BOSS_MEDALS, SOLDIER_BOSS_MEDALS, KANGAROO_BOSS_MEDALS, GUM_QUEEN_BOSS_MEDALS} from '@/lib/shipBossMedals';
import MarkerFrame from './MarkerFrame';
import GameTextureButton from './GameTextureButton';
import { getResourceIcon } from '@/lib/resourceIcons';
import { getShipBossRewardFund } from '@/lib/shipBossRewards';
import { getBossMedalProgress, getUnlockedBossMedals } from '@/lib/bossMedals';
import bronze from '@/assets/optimized/boss-mobile/9cffb492b34f.webp';
import silver from '@/assets/optimized/boss-mobile/9a27f0c3c02f.webp';
import gold from '@/assets/optimized/boss-mobile/1b5a5ad4b5d5.webp';
import AvatarWithFrame from './AvatarWithFrame';
import './shipBossCard.css';

const text={
 uk:{attack:'У БІЙ',winner:'Останній переможець',sector:'Сектор',medals:['Бронзова медаль','Срібна медаль','Золота медаль'],buff:'Баф сектора',details:'ПРОКАЧУВАННЯ'},
 ru:{attack:'В БОЙ',winner:'Последний победитель',sector:'Сектор',medals:['Бронзовая медаль','Серебряная медаль','Золотая медаль'],buff:'Баф сектора',details:'ПРОКАЧКА'},
 en:{attack:'FIGHT',winner:'Last winner',sector:'Sector',medals:['Bronze medal','Silver medal','Gold medal'],buff:'Sector buff',details:'UPGRADES'},
};
export default function ShipBossCard({activeFight,module,name,portrait,sector,language,onAttack,battleAvailable=true,medalWins,lastWinner,lastWinnerProfile}) {
 const w=text[language]||text.uk;
 const comingSoon=!isShipBossReleased(module.id);
 const soonLabel=({uk:'НЕЗАБАРОМ',ru:'СКОРО',en:'SOON'})[language]||'SOON';
 const lootText=({uk:{title:'Дроп · до',gum:'Жуйки',normal:'Звичайна',improved:'Покращена',hint:'За внесок від 1% HP. Особистий шанс; максимум одна жуйка.',fund:'Максимум за 100% урону до добового зниження. Фонд ділиться за внеском.'},ru:{title:'Дроп · до',gum:'Жвачки',normal:'Обычная',improved:'Улучшенная',hint:'При вкладе от 1% HP. Личный шанс; максимум одна жвачка.',fund:'Максимум за 100% урона до суточного снижения. Фонд делится по вкладу.'},en:{title:'Loot · up to',gum:'Gums',normal:'Ordinary',improved:'Improved',hint:'Requires 1% HP damage. Personal chance; at most one gum.',fund:'Maximum for 100% damage before daily reduction. Fund is split by contribution.'}})[language]||null;
 const loot=lootText||{title:'Loot · up to',gum:'Gums',normal:'Ordinary',improved:'Improved',hint:'Requires 1% HP damage. Personal chance; at most one gum.',fund:'Maximum for 100% damage before daily reduction. Fund is split by contribution.'};
 const fund=getShipBossRewardFund(module.level);
 const gumRates=getShipGumDropRates(module.id);
 const rewardTitle=({uk:'НАГОРОДА',ru:'НАГРАДА',en:'REWARD'})[language]||'REWARD';
 const gumHelp=({uk:'Жуйки — матеріали для заточки спорядження. Звичайна — базовий матеріал, покращена — для вищого шансу успіху. '+loot.hint,ru:'Жвачки — материалы для заточки снаряжения. Обычная — базовый материал, улучшенная — для более высокого шанса успеха. '+loot.hint,en:'Gums are equipment enhancement materials. Ordinary gum is the basic material; improved gum gives a higher success chance. '+loot.hint})[language]||loot.hint;
 const unlockLabel=({uk:`Добудуйте сектор ${module.level}`,ru:`Достройте сектор ${module.level}`,en:`Complete sector ${module.level}`})[language]||`Complete sector ${module.level}`;
 const format=n=>Intl.NumberFormat(language==='ru'?'ru':language==='en'?'en':'uk',{notation:'compact',maximumFractionDigits:1}).format(n);
 const wins=medalWins??sector.wins;
 const medals=getUnlockedBossMedals(wins),progress=getBossMedalProgress(wins,language);
 const next=wins<10?0:wins<50?1:2;
 const medalAssets=module.id==='hull'?CHEESE_BOSS_MEDALS:module.id==='engine'?SOLDIER_BOSS_MEDALS:module.id==='hangar'?KANGAROO_BOSS_MEDALS:module.id==='portal'?GUM_QUEEN_BOSS_MEDALS:{bronze,silver,gold};
 return <MarkerFrame id={`ship-boss-${module.id}`} variant="transparent" className={`boss-picker-card ship-roster-card ${sector.built&&!comingSoon?'':'ship-roster-locked'}`} innerClassName="boss-picker-layout">
  <div aria-hidden="true" className="ship-roster-card-background" style={{backgroundImage:`linear-gradient(90deg,rgba(5,12,7,.62),rgba(5,12,7,.76) 48%,rgba(5,12,7,.52)),url(${module.id==='hull'?'/ship-cheese-boss/cheese-workshop-v3.webp':module.id==='engine'?'/ship-soldier-boss/growth-room-v2.webp':module.id==='hangar'?'/ship-kangaroo-boss/background-clear.webp':module.id==='portal'?'/ship-gum-queen/cartoon-garage.webp':'/clan-ship-buffs/boss-card-wall-v1.webp'})`}}/>
  <div className="boss-picker-portrait-column flex flex-col items-center gap-3">
   <div className="boss-portrait-with-hp"><img className="boss-portrait-image" src={portrait} alt={name}/>
   <BossPortraitHp max={activeFight?.max_hp || module.level*2000000} current={activeFight?.status === 'active' ? activeFight.current_hp : module.level*2000000} language={language}/></div>
   <GameTextureButton type="button" tone={sector.built&&!comingSoon?'yellow':'gray'} onClick={onAttack} disabled={comingSoon || !sector.built || !battleAvailable}><span className="ship-control-content">{comingSoon?soonLabel:sector.built?w.attack:({uk:'ЗАКРИТО',ru:'ЗАКРЫТО',en:'LOCKED'})[language]||'LOCKED'}</span></GameTextureButton>
  </div>
  <div className="boss-picker-details">
   <div className="ship-roster-card-info">
    <p>{name}</p><p>{comingSoon?soonLabel:sector.built?`${wins}/${progress.target} · ${w.medals[next]}`:unlockLabel}</p>
    <div className="ship-roster-card-medals">{Object.entries(medalAssets).map(([tier,src],i)=><img key={tier} data-medal-tier={tier} src={src} alt={w.medals[i]} title={w.medals[i]} className={medals[tier]?'':'is-locked'}/>)}</div>
    <div className="ship-roster-gum-drops" title={loot.hint} aria-label={loot.gum}>
     {[['normal',0,Math.round(gumRates.normalChance*100),loot.normal],['improved',50,Math.round(gumRates.improvedChance*100),loot.improved]].map(([id,position,chance,label])=><span key={id} title={`${label}: ${chance}%. ${loot.hint}`}><i role="img" aria-label={label} style={{backgroundPosition:`${position}% center`}}/><b>{chance}%</b></span>)}
     <details className="ship-gum-help"><summary aria-label={loot.gum}>?</summary><div className="ship-gum-help-popup"><button type="button" aria-label={language==='ru'?'Закрыть':language==='en'?'Close':'Закрити'} onClick={event=>event.currentTarget.closest('details').removeAttribute('open')}>×</button><p>{gumHelp}</p></div></details>
    </div>
    <small>{w.sector} {module.level} · {module.name}</small>
   </div>
   <div className="boss-picker-rewards ship-roster-card-buff">
    <p className="ship-reward-title">{rewardTitle}</p>
    <div className="ship-roster-loot-grid" title={loot.fund}>{Object.entries(fund).filter(([type])=>type!=='xp').map(([type,qty])=><span key={type} title={`${type==='strength'?'CA':type}: ${qty.toLocaleString()}`}><img src={getResourceIcon(type)} alt={type==='strength'?'CA':type}/><b>{format(qty)}</b></span>)}</div>
   </div>
   <div className="boss-picker-winner ship-roster-card-winner">
    <p>{w.winner}</p>
    {sector.wins>0?<><span className="boss-last-winner-pulsar"><AvatarWithFrame className="boss-last-winner-avatar" src={lastWinnerProfile?.avatar} alt={lastWinnerProfile?.name || lastWinner || ''} /></span><small>{lastWinnerProfile?.name || lastWinner || (medalWins===undefined?'LOCAL_TESTER':'—')}</small></>:<div className="boss-last-winner-unknown">?</div>}
   </div>
  </div>
 </MarkerFrame>;
}
