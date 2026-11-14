import greed from '@/assets/achievements/greed_saved.webp';
import breathing from '@/assets/achievements/still_breathing.webp';
import bleed from '@/assets/achievements/hands_off.webp';
import fingers from '@/assets/achievements/ten_fingers.webp';
import halloween from '@/assets/achievements/halloween_hunter_500.webp';
import fishing from '@/assets/achievements/three_empty_casts.webp';
import donation from '@/assets/achievements/generous_soul.webp';
import almost from '@/assets/achievements/almost_finished.webp';
import upgraded from '@/assets/achievements/full_set_plus_15_v3.webp';
import fullSet from '@/assets/achievements/first_full_set_v2.webp';
import positive from '@/assets/achievements/positive_karma_500_v2.webp';
import negative from '@/assets/achievements/negative_karma_100_v3.webp';
import gum from '@/assets/achievements/gum_no_upgrade_10.webp';
import fishingTrash from '@/assets/achievements/fishing_trash_5.webp';
import { useAnimationsEnabled } from '@/lib/animationPreference';
export const ACHIEVEMENT_ART = { fishing_trash_5: fishingTrash, greed_saved: greed, still_breathing: breathing, hands_off: bleed, ten_fingers: fingers, halloween_hunter_500: halloween, three_empty_casts: fishing, generous_soul: donation, almost_finished: almost, full_set_plus_15: upgraded, first_full_set: fullSet, positive_karma_500: positive, negative_karma_100: negative, gum_no_upgrade_10: gum };
export default function AchievementBadge({ id, locked = false, animated = false }) {
  const animations = useAnimationsEnabled();
  const src = ACHIEVEMENT_ART[id] || greed;
  if (locked) return <div className="relative h-full w-full"><span className="absolute inset-0 bg-[#535b51]" style={{mask:`url(${greed}) center / contain no-repeat`,WebkitMask:`url(${greed}) center / contain no-repeat`}} /><span className="absolute inset-0 flex items-center justify-center text-[clamp(24px,8vw,42px)] font-black text-[#aab2a4] [text-shadow:0_2px_2px_#000]">?</span></div>;
  return <div className={`clan-emblem-wrapper ${animated && animations ? 'has-rarity' : ''}`} style={{width:'100%',height:'100%','--clan-rarity-color':'#27ead1','--clan-emblem-mask':`url("${src}")`}}>
    {animated && animations && <><span aria-hidden="true" className="emblem-rarity-outline" /><span aria-hidden="true" className="emblem-rarity-glow" /><span aria-hidden="true" className="emblem-rarity-pulsar" /></>}
    <img src={src} alt="" className="emblem-image h-full w-full object-contain" />
  </div>;
}
