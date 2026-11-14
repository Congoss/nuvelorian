import bronzeMedalBos1 from '@/assets/optimized/boss-mobile/9cffb492b34f.webp';
import silverMedalBos1 from '@/assets/optimized/boss-mobile/9a27f0c3c02f.webp';
import goldMedalBos1 from '@/assets/optimized/boss-mobile/1b5a5ad4b5d5.webp';
import bronzeMedal from '@/assets/optimized/boss-mobile/f088bc735b6d.webp';
import silverMedal from '@/assets/optimized/boss-mobile/489608d62f1f.webp';
import goldMedal from '@/assets/optimized/boss-mobile/e0483d6191b1.webp';
import bronzeMothMedal from '@/assets/optimized/boss-mobile/abe08a3864eb.webp';
import silverMothMedal from '@/assets/optimized/boss-mobile/b7688762753f.webp';
import goldMothMedal from '@/assets/optimized/boss-mobile/3ef1bcc03c7f.webp';
import bronzeShorkMedal from '@/assets/optimized/boss-mobile/b8c32f7890fe.webp';
import silverShorkMedal from '@/assets/optimized/boss-mobile/36e54255461e.webp';
import goldShorkMedal from '@/assets/optimized/boss-mobile/8ab75562faeb.webp';
import bronzeWormMedal from '@/assets/optimized/boss-mobile/be83ed7cc469.webp';
import silverWormMedal from '@/assets/optimized/boss-mobile/42baaf673fe0.webp';
import goldWormMedal from '@/assets/optimized/boss-mobile/298e85a6e3f3.webp';
import bronzeSuckholeMedal from '@/assets/optimized/boss-mobile/c3886edff395.webp';
import silverSuckholeMedal from '@/assets/optimized/boss-mobile/3a49c3f219ca.webp';
import goldSuckholeMedal from '@/assets/optimized/boss-mobile/c93fada0db8c.webp';
import bronzeShkrabanMedal from '@/assets/optimized/boss-mobile/3599536565b8.webp';
import silverShkrabanMedal from '@/assets/optimized/boss-mobile/6b80ed278786.webp';
import goldShkrabanMedal from '@/assets/optimized/boss-mobile/b9c829990938.webp';
import bronzeSporgolMedal from '@/assets/optimized/boss-mobile/766e11ee66b3.webp';
import silverSporgolMedal from '@/assets/optimized/boss-mobile/90bee99b3224.webp';
import goldSporgolMedal from '@/assets/optimized/boss-mobile/260f64bc333e.webp';
import { GAME_CONFIG, getLocalizedBossName } from '@/lib/gameConfig';
import { getBossKillCount, BOSS_MEDAL_THRESHOLDS } from '@/lib/bossMedals';
const HELI_MEDAL_ASSETS = {
  bronze: bronzeMedalBos1,
  silver: silverMedalBos1,
  gold: goldMedalBos1,
};
const BOSS_MEDAL_ASSETS = {
  heli: HELI_MEDAL_ASSETS,
  tank: { bronze: bronzeMothMedal, silver: silverMothMedal, gold: goldMothMedal },
  chinook: { bronze: bronzeShorkMedal, silver: silverShorkMedal, gold: goldShorkMedal },
  boss4: { bronze: bronzeWormMedal, silver: silverWormMedal, gold: goldWormMedal },
  boss5: { bronze: bronzeSporgolMedal, silver: silverSporgolMedal, gold: goldSporgolMedal },
  boss6: { bronze: bronzeSuckholeMedal, silver: silverSuckholeMedal, gold: goldSuckholeMedal },
  boss8: { bronze: bronzeShkrabanMedal, silver: silverShkrabanMedal, gold: goldShkrabanMedal },
};
const DEFAULT_MEDAL_ASSETS = {
  bronze: bronzeMedal,
  silver: silverMedal,
  gold: goldMedal,
};
export default function AdminBossMedals({player, language='uk'}) {
 const labels={uk:{kills:'Перемог',bronze:'Бронза',silver:'Срібло',gold:'Золото'},ru:{kills:'Побед',bronze:'Бронза',silver:'Серебро',gold:'Золото'},en:{kills:'Wins',bronze:'Bronze',silver:'Silver',gold:'Gold'}}[language] || {kills:'Wins',bronze:'Bronze',silver:'Silver',gold:'Gold'};
 return <div className="mt-4 grid gap-3 sm:grid-cols-2">{GAME_CONFIG.BOSSES.map(boss=>{
  const kills=getBossKillCount(player,boss.id), images=BOSS_MEDAL_ASSETS[boss.id]||DEFAULT_MEDAL_ASSETS;
  return <div key={boss.id} className="rounded-xl border border-white/10 bg-black/15 p-3"><div className="flex justify-between gap-2"><strong>{getLocalizedBossName(boss,language)}</strong><span>{labels.kills}: <b className="text-cyan-300">{kills}</b></span></div><div className="mt-3 flex justify-around gap-2">{Object.entries(BOSS_MEDAL_THRESHOLDS).map(([tier,threshold])=><div key={tier} className="text-center"><img src={images[tier]} alt={labels[tier]} className={'mx-auto h-14 w-14 object-contain '+(kills>=threshold?'':'opacity-25 grayscale')}/><div className="mt-1 text-xs">{labels[tier]} · {kills>=threshold?'✓':kills+'/'+threshold}</div></div>)}</div></div>
 })}</div>;
}
