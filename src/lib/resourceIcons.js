import bossKey8 from '@/assets/boss/boss-keys/key-8.png';
import bossKey7 from '@/assets/boss/boss-keys/key-7.png';
import bossKey6 from '@/assets/boss/boss-keys/key-6.png';
import bossKey5 from '@/assets/boss/boss-keys/key-5.png';
import bossKey4 from '@/assets/boss/boss-keys/key-4.png';
import bossKey3 from '@/assets/boss/boss-keys/key-3.png';
import bossKey2 from '@/assets/boss/boss-keys/key-2.png';
import bossKey1 from '@/assets/boss/boss-keys/key-1.png';
import pumpkinIcon from '@/assets/ui/halloween-pumpkin.webp';
import smallPoisonIcon from '@/assets/skills/small-poison.png';
import mediumPoisonIcon from '@/assets/skills/medium-poison.png';
import largePoisonIcon from '@/assets/skills/large-poison.png';
import expIcon from '@/assets/ui/EXP.png';
import premiumIcon from '@/assets/optimized/paper.webp';
import tentaclesIcon from '@/assets/optimized/cosmohand.webp';
import strengthIcon from '@/assets/optimized/level.webp';
import energyIcon from '@/assets/ui/energy.png';
import mailIcon from '@/assets/ui/inbox.svg';
import spinIcon from '@/assets/ui/spinx1.png';

const ICONS = {
boss_key_heli:bossKey1,boss_key_tank:bossKey2,boss_key_chinook:bossKey3,boss_key_boss4:bossKey4,boss_key_boss5:bossKey5,boss_key_boss6:bossKey6,boss_key_boss7:bossKey7,boss_key_boss8:bossKey8,boss_key_boss9:bossKey8,
  halloween_pumpkin: pumpkinIcon, pumpkins: pumpkinIcon, pumpkin: pumpkinIcon, 'halloween-pumpkin': pumpkinIcon,
  'small-poison': smallPoisonIcon, small_poison: smallPoisonIcon,
  'medium-poison': mediumPoisonIcon, medium_poison: mediumPoisonIcon,
  'large-poison': largePoisonIcon, large_poison: largePoisonIcon,
  tentacles: tentaclesIcon,
  't-pape': premiumIcon,
  dm: tentaclesIcon,
  cdm: premiumIcon,
  premium: premiumIcon,
  stars: premiumIcon,
  ca: strengthIcon,
  strength: strengthIcon,
  power: strengthIcon,
  energy: energyIcon,
  exp: expIcon,
  xp: expIcon,
  mail: mailIcon,
  inbox: mailIcon,
  spin: spinIcon,
  spins: spinIcon,
  roulette: spinIcon,
};

export function getResourceIcon(type) {
  const key = String(type || '').toLowerCase();
  return ICONS[key] || tentaclesIcon;
}

export function getEnergyRewardIcon() { return energyIcon; }
