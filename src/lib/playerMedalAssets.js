import bronzeCleopatraMedal from '@/assets/boss-ui/bronze-cleopatrash.png';
import { CHEESE_BOSS_MEDALS, GUM_QUEEN_BOSS_MEDALS, SOLDIER_BOSS_MEDALS, KANGAROO_BOSS_MEDALS } from './shipBossMedals';
import silverCleopatraMedal from '@/assets/boss-ui/silver-cleopatrash.png';
import goldCleopatraMedal from '@/assets/boss-ui/gold-cleopatrash.png';
import bronzeMedalBos1 from '@/assets/optimized/camp/medal-bronze-bos1.webp';
import silverMedalBos1 from '@/assets/optimized/camp/medal-silver-bos1.webp';
import goldMedalBos1 from '@/assets/optimized/camp/medal-gold-bos1.webp';
import bronzeMedal from '@/assets/optimized/camp/medal-bronze-medal.webp';
import silverMedal from '@/assets/optimized/camp/medal-silver-medal.webp';
import goldMedal from '@/assets/optimized/camp/medal-gold-medal.webp';
import bronzeMothMedal from '@/assets/optimized/camp/medal-bronze-Moth.webp';
import silverMothMedal from '@/assets/optimized/camp/medal-silver-moth.webp';
import goldMothMedal from '@/assets/optimized/camp/medal-gold-moth.webp';
import bronzeShorkMedal from '@/assets/optimized/camp/medal-bronze-Shork.webp';
import silverShorkMedal from '@/assets/optimized/camp/medal-silver-Shork.webp';
import goldShorkMedal from '@/assets/optimized/camp/medal-gold-Shork.webp';
import bronzeWormMedal from '@/assets/optimized/camp/medal-bronze-Worm.webp';
import silverWormMedal from '@/assets/optimized/camp/medal-silver-worm.webp';
import goldWormMedal from '@/assets/optimized/camp/medal-gold-Worm.webp';
import bronzeSuckholeMedal from '@/assets/optimized/camp/medal-bronze-Suckhole.webp';
import silverSuckholeMedal from '@/assets/optimized/camp/medal-silver-Suckhole.webp';
import goldSuckholeMedal from '@/assets/optimized/camp/medal-gold-Suckhole.webp';
import bronzeShkrabanMedal from '@/assets/optimized/camp/medal-bronze-Shkraban.webp';
import silverShkrabanMedal from '@/assets/optimized/camp/medal-silver-Shkraban.webp';
import goldShkrabanMedal from '@/assets/optimized/camp/medal-gold-Shkraban.webp';
import bronzeSporgolMedal from '@/assets/optimized/camp/medal-bronze-Sporgol.webp';
import silverSporgolMedal from '@/assets/optimized/camp/medal-silver-Sporgol.webp';
import goldSporgolMedal from '@/assets/optimized/camp/medal-gold-Sporgol.webp';

const HELI_MEDAL_IMGS = {
  bronze: bronzeMedalBos1,
  silver: silverMedalBos1,
  gold: goldMedalBos1,
};

export const DEFAULT_MEDAL_IMGS = {
  bronze: bronzeMedal,
  silver: silverMedal,
  gold: goldMedal,
};

export const BOSS_MEDAL_IMGS = {
  'ship-hull': CHEESE_BOSS_MEDALS,
  'ship-engine': SOLDIER_BOSS_MEDALS,
  'ship-hangar': KANGAROO_BOSS_MEDALS,
  'ship-portal': GUM_QUEEN_BOSS_MEDALS,
  heli: HELI_MEDAL_IMGS,
  tank: { bronze: bronzeMothMedal, silver: silverMothMedal, gold: goldMothMedal },
  chinook: { bronze: bronzeShorkMedal, silver: silverShorkMedal, gold: goldShorkMedal },
  boss4: { bronze: bronzeWormMedal, silver: silverWormMedal, gold: goldWormMedal },
  boss5: { bronze: bronzeSporgolMedal, silver: silverSporgolMedal, gold: goldSporgolMedal },
  boss6: { bronze: bronzeSuckholeMedal, silver: silverSuckholeMedal, gold: goldSuckholeMedal },
  boss7: { bronze: bronzeCleopatraMedal, silver: silverCleopatraMedal, gold: goldCleopatraMedal },
  boss8: { bronze: bronzeShkrabanMedal, silver: silverShkrabanMedal, gold: goldShkrabanMedal },
};

