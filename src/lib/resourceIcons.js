import smallPoisonIcon from '@/assets/skills/small-poison.png';
import mediumPoisonIcon from '@/assets/skills/medium-poison.png';
import largePoisonIcon from '@/assets/skills/large-poison.png';
import expIcon from '@/assets/ui/EXP.png';
import premiumIcon from '@/assets/optimized/paper.webp';
import tentaclesIcon from '@/assets/optimized/cosmohand.webp';
import strengthIcon from '@/assets/optimized/level.webp';
import energyIcon from '@/assets/ui/energy.png';
import energy25Icon from '@/assets/ui/energy+25.png';
import energy50Icon from '@/assets/ui/energy+50.png';
import energy100Icon from '@/assets/ui/energy+100.png';
import mailIcon from '@/assets/ui/inbox.svg';
import spinIcon from '@/assets/ui/spinx1.png';

const ICONS = {
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

export function getEnergyRewardIcon(amount) {
  const value = Array.isArray(amount) ? Math.max(...amount.map(Number)) : Number(amount);
  if (!Number.isFinite(value) || value < 25) return energyIcon;
  if (value <= 25) return energy25Icon;
  if (value <= 50) return energy50Icon;
  return energy100Icon;
}
