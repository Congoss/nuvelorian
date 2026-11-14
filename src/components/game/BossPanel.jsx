import { RaidRankPrize, RaidRankRewardsGuide } from './RaidRankPrizes';
import { RaidBossTwo, RaidBossTwoBackground } from './RaidBossTwo';
import { RAID_BOSS_MAX_HP } from '@/lib/raidBossConfig.js';
import { translateUiText } from '@/lib/uiTextTranslations';
import { resolveTalentAttack } from '@/lib/talentCombat';
import { getCollectionDamageBonus } from '@/lib/gameConfig';
import toxicMarkIcon from '@/assets/ui/toxic-mark.png';
import bloodStatusIcon from '@/assets/ui/blood.png';
import PlayerName from './PlayerName';
import mothStatic from '@/assets/optimized/boss-mobile/moth-static.webp';
import { EVENT_SCHEDULE, eventPhase } from '@/lib/eventSchedule.js';
import { serverNow } from '@/lib/serverClock.js';
import { getBossEscapeCooldownRemaining } from '@/lib/bossEscapeCooldown.js';
import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Loader2, RefreshCw, X } from 'lucide-react';
import ScrambleLockHint from './ScrambleLockHint';
import { useTranslation } from 'react-i18next';
import { GAME_CONFIG, getLocalizedBossName } from '@/lib/gameConfig';
import { buildEffectiveWeapon, getTalentLevels, getTalentProgress } from '@/lib/talents';
import slapIcon from '@/assets/optimized/all/skills/slap.webp';
import forkStrikeIcon from '@/assets/optimized/all/skills/fork-strike.webp';
import smallPoisonIcon from '@/assets/optimized/all/skills/small-poison.webp';
import mediumPoisonIcon from '@/assets/optimized/all/skills/medium-poison.webp';
import largePoisonIcon from '@/assets/optimized/all/skills/large-poison.webp';
import expUiIcon from '@/assets/optimized/boss-mobile/72db0dec1353.webp';
import guideCelebrate from '@/assets/optimized/boss-mobile/1623fca9ab8e.webp';
import guideStopScared from '@/assets/optimized/boss-mobile/685418ace0ca.webp';
import clanHelpGuide from '@/assets/guide/enot-guide-poison.png';
import clanHelpIcon from '@/assets/boss-ui/clan-help.png';
import GameTextureButton from './GameTextureButton';
import { DEFAULT_GUILD_LOGO, GUILD_LOGO_BY_ID } from '@/lib/clanLogos';
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
import grayBox from '@/assets/optimized/all/box/gray-box.webp';
import greenBox from '@/assets/optimized/all/box/green-box.webp';
import blueBox from '@/assets/optimized/all/box/blue-box.webp';
import yellowBox from '@/assets/optimized/all/box/yellow-box.webp';
import redBox from '@/assets/optimized/all/box/red-box.webp';
import boss1Stage1Gif from '@/assets/boss/bos1-stage1.gif';
import boss2Portrait from '@/assets/optimized/all/boss/bos2.webp';
import boss3Portrait from '@/assets/optimized/all/boss/bos3.webp';
import bossIco from '@/assets/optimized/all/boss/boss-ico.webp';
import underweightAvatar from '@/assets/optimized/boss-mobile/3c5eca0b6d15.webp';
import mothAvatar from '@/assets/optimized/boss-mobile/7130af0068f1.webp';
import shorkAvatar from '@/assets/optimized/boss-mobile/12258247a0bd.webp';
import wormAvatar from '@/assets/optimized/boss-mobile/0b48d455dd8d.webp';
import sporgolAvatar from '@/assets/optimized/boss-mobile/36e3f2fb4fd8.webp';
import suckholeAvatar from '@/assets/optimized/boss-mobile/327d35f24334.webp';
import shkrabanAvatar from '@/assets/optimized/boss-mobile/1d413d7b9e7a.webp';
import bossLabBackground from '@/assets/optimized/boss-mobile/9076173c1a49.webp';
import boss3Background from '@/assets/optimized/boss-mobile/313740eaa41d.webp';
import sporgolBgBase from '@/assets/optimized/boss-mobile/7ded8d6c0b9a.webp';
import sporgolBgHand from '@/assets/optimized/boss-mobile/36302596577a.webp';
import sporgolBgMushroom from '@/assets/optimized/boss-mobile/d2b41e2855a2.webp';
import sporgolBgEye from '@/assets/optimized/boss-mobile/d0ce24ed8a56.webp';
import sporgolBgMoon from '@/assets/optimized/boss-mobile/5faad6d4db57.webp';
import sporgolBgPlanets from '@/assets/optimized/boss-mobile/08feecb8a988.webp';
import sporgolBgPupil from '@/assets/optimized/boss-mobile/9bbbc7506fc0.webp';
import boss1BgBase from '@/assets/optimized/boss-mobile/4ab2e61900a2.webp';
import boss1BgStar from '@/assets/optimized/boss-mobile/4b486a2ba6a2.webp';
import boss1BgMeteors from '@/assets/optimized/boss-mobile/35d2cb65a80c.webp';
import boss1BgBlueMonitors from '@/assets/optimized/boss-mobile/270c95b2ea37.webp';
import boss1BgRedMonitor from '@/assets/optimized/boss-mobile/203799b3639c.webp';
import boss1BgRedLights from '@/assets/optimized/boss-mobile/8448eac9ed1b.webp';
import boss1BgTopLight from '@/assets/optimized/boss-mobile/44a1ac7c6c4e.webp';
import boss2BgBase from '@/assets/optimized/boss-mobile/6c7c8320dbe9.webp';
import boss2BgChameleon from '@/assets/optimized/boss-mobile/9468fd8eb4fa.webp';
import boss2BgOutColours from '@/assets/optimized/boss-mobile/1fae983d8f57.webp';
import boss2BgPoint from '@/assets/optimized/boss-mobile/3e9638f3b03b.webp';
import boss2BgRainbow from '@/assets/optimized/boss-mobile/168acc36364f.webp';
import boss2BgSmoke from '@/assets/optimized/boss-mobile/61fa25f08d0c.webp';
import boss2BgSmokeTwo from '@/assets/optimized/boss-mobile/81e822c69bbc.webp';
import shorkBgBase from '@/assets/optimized/boss-mobile/ac69f08d88df.webp';
import shorkBgBigPlanet from '@/assets/optimized/boss-mobile/40d3af014102.webp';
import shorkBgMiniPlanet from '@/assets/optimized/boss-mobile/24b8410af97e.webp';
import shorkBgCrane from '@/assets/optimized/boss-mobile/afd79dcfe56b.webp';
import shorkBgLightboard from '@/assets/optimized/boss-mobile/e58fe64624c1.webp';
import shorkBgScreen from '@/assets/optimized/boss-mobile/1ad34056695b.webp';
import shorkBgLamp from '@/assets/optimized/boss-mobile/90fc56d265ee.webp';
import shorkBgEye from '@/assets/optimized/boss-mobile/9da07a97bc78.webp';
import shorkBgSlime from '@/assets/optimized/boss-mobile/ef313da2f6fd.webp';
import wormBaseLayer from '@/assets/optimized/boss-mobile/26f11d337fb2.webp';
import wormBigEyeLayer from '@/assets/optimized/boss-mobile/42d387b6f975.webp';
import wormStalkEyeLayer from '@/assets/optimized/boss-mobile/eb5cd9673ece.webp';
import wormSawMouthLayer from '@/assets/optimized/boss-mobile/9ff537ac6e27.webp';
import wormSlimeLayer from '@/assets/optimized/boss-mobile/451f4f4539d7.webp';
import wormParasiteLayer from '@/assets/optimized/boss-mobile/bed93e22e1b2.webp';
import wormBellyLayer from '@/assets/optimized/boss-mobile/a8a6745cd83a.webp';
import wormTeethLayer from '@/assets/optimized/boss-mobile/fb0e5ff9ce95.webp';
import sporgolBodyLayer from '@/assets/optimized/boss-mobile/7bf2a7d2ab27.webp';
import sporgolEyeOneLayer from '@/assets/optimized/boss-mobile/b63a09b50567.webp';
import sporgolEyeTwoLayer from '@/assets/optimized/boss-mobile/1a01dad70769.webp';
import sporgolEyeThreeLayer from '@/assets/optimized/boss-mobile/425c3213d415.webp';
import sporgolPupilOneLayer from '@/assets/optimized/boss-mobile/0e69944d9ce2.webp';
import sporgolPupilTwoLayer from '@/assets/optimized/boss-mobile/c13a04a6126c.webp';
import sporgolPupilThreeLayer from '@/assets/optimized/boss-mobile/1f6f6dc3acd1.webp';
import sporgolLargeMushroomLayer from '@/assets/optimized/boss-mobile/918a04063537.webp';
import sporgolSporeOneLayer from '@/assets/optimized/boss-mobile/01b278fa527a.webp';
import sporgolSporeTwoLayer from '@/assets/optimized/boss-mobile/d03c6b767cec.webp';
import sporgolSporeThreeLayer from '@/assets/optimized/boss-mobile/572597d3b044.webp';
import sporgolSporeFourLayer from '@/assets/optimized/boss-mobile/e2505fbd763f.webp';
import sporgolSporeFiveLayer from '@/assets/optimized/boss-mobile/646cdb888a96.webp';
import sporgolSporeSixLayer from '@/assets/optimized/boss-mobile/08aa647a9066.webp';
import sporgolSporeLayer from '@/assets/optimized/boss-mobile/17dc227d0c5f.webp';
import sporgolTongueLayer from '@/assets/optimized/boss-mobile/175f6910bc45.webp';
import sporgolLegLayer from '@/assets/optimized/boss-mobile/deeb5e4ea08a.webp';
import sporgolFootLayer from '@/assets/optimized/boss-mobile/6779abafb15e.webp';
import wormBgBase from '@/assets/optimized/boss-mobile/b085107f1cf6.webp';
import wormBgEyeBase from '@/assets/optimized/boss-mobile/46fcdda631a5.webp';
import wormBgBlinkEye from '@/assets/optimized/boss-mobile/4e0819e1d285.webp';
import wormBgPendulumEye from '@/assets/optimized/boss-mobile/f8044584b1f5.webp';
import wormBgWheel from '@/assets/optimized/boss-mobile/108869d8659d.webp';
import wormBgRedLamp from '@/assets/optimized/boss-mobile/fda5c8026ff8.webp';
import wormBgCone from '@/assets/optimized/boss-mobile/8d191935fa46.webp';
import wormBgCow from '@/assets/optimized/boss-mobile/efc2fd25e6a5.webp';
import wormBgSlime from '@/assets/optimized/boss-mobile/d7657031ace8.webp';
import wormBgWaterfall from '@/assets/optimized/boss-mobile/0bb7eea9869f.webp';
import wormBgPupil from '@/assets/optimized/boss-mobile/b8e454bd2197.webp';
import wormCloudOne from '@/assets/optimized/boss-mobile/5107ddc9a678.webp';
import wormCloudTwo from '@/assets/optimized/boss-mobile/02876a5bfe79.webp';
import wormCloudThree from '@/assets/optimized/boss-mobile/969bf34c07ab.webp';
import wormCloudFour from '@/assets/optimized/boss-mobile/70c41a57fe3b.webp';
import wormCloudFive from '@/assets/optimized/boss-mobile/d984280d2936.webp';
import wormCloudSix from '@/assets/optimized/boss-mobile/3a1887a28182.webp';
import wormCloudSeven from '@/assets/optimized/boss-mobile/07ce32990895.webp';
import wormCloudEight from '@/assets/optimized/boss-mobile/58fc63bec92d.webp';
import wormCloudNine from '@/assets/optimized/boss-mobile/3f92da9b4867.webp';
import wormCloudTen from '@/assets/optimized/boss-mobile/eb751556d3ae.webp';
import wormCloudEleven from '@/assets/optimized/boss-mobile/0b65bb6606f2.webp';
import wormCloudTwelve from '@/assets/optimized/boss-mobile/cb61bff392fe.webp';
import suckholeWormLayer from '@/assets/optimized/boss-mobile/01702dd2ae06.webp';
import suckholeBackground from '@/assets/optimized/boss-mobile/8a9fe644d7b0.webp';
import suckholeBlackHoleLayer from '@/assets/optimized/boss-mobile/457d69a14252.webp';
import suckholeBraLayer from '@/assets/optimized/boss-mobile/e8aedc1681eb.webp';
import suckholeBurgerLayer from '@/assets/optimized/boss-mobile/aad4861ccc74.webp';
import suckholeCatLayer from '@/assets/optimized/boss-mobile/f2787afb885b.webp';
import suckholeCowLayer from '@/assets/optimized/boss-mobile/585665faffbd.webp';
import suckholeDuckLayer from '@/assets/optimized/boss-mobile/a989f1f21eb6.webp';
import suckholeGestureLayer from '@/assets/optimized/boss-mobile/974e2f37a364.webp';
import suckholeGamepadLayer from '@/assets/optimized/boss-mobile/7613c2ab99c9.webp';
import suckholeGreenAssLayer from '@/assets/optimized/boss-mobile/781e1f89fc1d.webp';
import suckholeBigHandLayer from '@/assets/optimized/boss-mobile/8142c297df06.webp';
import suckholeMiniHandLayer from '@/assets/optimized/boss-mobile/684f594b52b4.webp';
import suckholeHandLayer from '@/assets/optimized/boss-mobile/febf4c7c1861.webp';
import suckholeBodyLayer from '@/assets/optimized/boss-mobile/7c1abad7a95a.webp';
import suckholeLegOneLayer from '@/assets/optimized/boss-mobile/80db3eddf766.webp';
import suckholeLegTwoLayer from '@/assets/optimized/boss-mobile/a0021111561e.webp';
import suckholeAntennaLayer from '@/assets/optimized/boss-mobile/33436b3d747e.webp';
import suckholeBeaconLayer from '@/assets/optimized/boss-mobile/4ec17dbd1cbc.webp';
import suckholeEyeLayer from '@/assets/optimized/boss-mobile/4e35077dc863.webp';
import suckholePizzaLayer from '@/assets/optimized/boss-mobile/af28071ee1c4.webp';
import suckholeTentacleLayer from '@/assets/optimized/boss-mobile/fe62192054fd.webp';
import suckholeToiletLayer from '@/assets/optimized/boss-mobile/de21135fbc3f.webp';
import suckholeToiletPaperLayer from '@/assets/optimized/boss-mobile/5b36c38abedd.webp';
import suckholePupilLayer from '@/assets/optimized/boss-mobile/6951141fd712.webp';
import auraB1St1 from '@/assets/optimized/boss-mobile/f118d4e55208.webp';
import bellB1St1 from '@/assets/optimized/boss-mobile/5790b54b5ad3.webp';
import eyesGlowB1St1 from '@/assets/optimized/boss-mobile/2989bcd555d3.webp';
import redEyesGlowB1St1 from '@/assets/optimized/boss-mobile/7c132e5c4904.webp';
import ghostBodyB1St1 from '@/assets/optimized/boss-mobile/d14ed77a4401.webp';
import headB1St1 from '@/assets/optimized/boss-mobile/3917908e4542.webp';
import leftArmB1St1 from '@/assets/optimized/boss-mobile/aa1c0f3672f9.webp';
import rightArmB1St1 from '@/assets/optimized/boss-mobile/c4b52f091201.webp';
import tailB1St1 from '@/assets/optimized/boss-mobile/10b317b52d28.webp';
import auraB1St2 from '@/assets/optimized/boss-mobile/2aa4220eb733.webp';
import bellB1St2 from '@/assets/optimized/boss-mobile/6d98e92753eb.webp';
import eyesGlowB1St2 from '@/assets/optimized/boss-mobile/e109df7ca45c.webp';
import redEyesGlowB1St2 from '@/assets/optimized/boss-mobile/3b7768524a25.webp';
import ghostBodyB1St2 from '@/assets/optimized/boss-mobile/2cb97e84f5fd.webp';
import headB1St2 from '@/assets/optimized/boss-mobile/3681cb03bc53.webp';
import leftArmB1St2 from '@/assets/optimized/boss-mobile/78c6f21d25e4.webp';
import rightArmB1St2 from '@/assets/optimized/boss-mobile/244fe304c77e.webp';
import tailB1St2 from '@/assets/optimized/boss-mobile/31efba7d3770.webp';
import auraB1St3 from '@/assets/optimized/boss-mobile/d55a7d809607.webp';
import bellB1St3 from '@/assets/optimized/boss-mobile/df467b3a30b2.webp';
import eyesGlowB1St3 from '@/assets/optimized/boss-mobile/560b4be72926.webp';
import redEyesGlowB1St3 from '@/assets/optimized/boss-mobile/8b7e4a58c644.webp';
import ghostBodyB1St3 from '@/assets/optimized/boss-mobile/36d1ccc3a380.webp';
import headB1St3 from '@/assets/optimized/boss-mobile/f543331a9949.webp';
import leftArmB1St3 from '@/assets/optimized/boss-mobile/ea786d172cad.webp';
import rightArmB1St3 from '@/assets/optimized/boss-mobile/d5f0ebed857d.webp';
import tailB1St3 from '@/assets/optimized/boss-mobile/40e21f5fb17e.webp';
import boss1BodyLayer from '@/assets/optimized/boss-mobile/26417d61cfab.webp';
import boss1HandLayer from '@/assets/optimized/boss-mobile/a986325badba.webp';
import boss1HeadLayer from '@/assets/optimized/boss-mobile/54d50f56466e.webp';
import boss1HeadLabelLayer from '@/assets/optimized/boss-mobile/b4866eb0eb46.webp';
import boss1HeadSlimeLayer from '@/assets/optimized/boss-mobile/12d1a4d5703c.webp';
import boss1HandSlimeLayer from '@/assets/optimized/boss-mobile/fb94d8550f38.webp';
import boss1ReturnStampLayer from '@/assets/optimized/boss-mobile/50bc4d1d10bf.webp';
import boss1RedEyesLayer from '@/assets/optimized/boss-mobile/599ff34898a8.webp';
import boss2BodyLayer from '@/assets/optimized/boss-mobile/54e8d29aea9f.webp';
import boss2BellyLayer from '@/assets/optimized/boss-mobile/c0dfca5408ef.webp';
import boss2HeadLayer from '@/assets/optimized/boss-mobile/44c981ecc357.webp';
import boss2HeadHitLayer from '@/assets/optimized/boss-mobile/cba4aedcdbb3.webp';
import boss2WingLayer from '@/assets/optimized/boss-mobile/c54e18273ad1.webp';
import boss2HornsLayer from '@/assets/optimized/boss-mobile/19c0c720ace1.webp';
import boss2ArmOneLayer from '@/assets/optimized/boss-mobile/40206a393ed8.webp';
import boss2ArmTwoLayer from '@/assets/optimized/boss-mobile/529848c7a391.webp';
import boss2CubeLayer from '@/assets/optimized/boss-mobile/cfe650dfec37.webp';
import boss2OrbOneLayer from '@/assets/optimized/boss-mobile/c74244af6bac.webp';
import boss2OrbTwoLayer from '@/assets/optimized/boss-mobile/1eab669547f5.webp';
import boss2SlimeLayer from '@/assets/optimized/boss-mobile/636f7370cfa3.webp';
import shorkBodyLayer from '@/assets/optimized/boss-mobile/572ff9655fa8.webp';
import shorkAntennaLayer from '@/assets/optimized/boss-mobile/2741fe2296cd.webp';
import shorkBananaLayer from '@/assets/optimized/boss-mobile/12b8c3905b35.webp';
import shorkDamageEyesLayer from '@/assets/optimized/boss-mobile/06fe5fa3093e.webp';
import shorkChairHandLayer from '@/assets/optimized/boss-mobile/75510a808afd.webp';
import shorkWeaponHandLayer from '@/assets/optimized/boss-mobile/5534173a5333.webp';
import shorkHeadLayer from '@/assets/optimized/boss-mobile/b75237f5d1e1.webp';
import shorkHeadLidLayer from '@/assets/optimized/boss-mobile/057068ba66be.webp';
import shorkLegLayer from '@/assets/optimized/boss-mobile/9660c1c5567d.webp';
import shorkForkLayer from '@/assets/optimized/boss-mobile/596c5310cfc4.webp';
import shorkEyesLayer from '@/assets/optimized/boss-mobile/739a93032478.webp';
import heroIcon from '@/assets/optimized/nav-hero.webp';
import bossDmgTopIcon from '@/assets/optimized/boss-mobile/d69799252324.webp';
import dmgBossIcon from '@/assets/optimized/boss-mobile/78f23bfe7041.webp';
import poisonX10Icon from '@/assets/optimized/boss-mobile/087cc23f17f6.webp';
import poisonX100Icon from '@/assets/optimized/boss-mobile/44366e236ee4.webp';
import bossRunIcon from '@/assets/optimized/boss-mobile/98f16709bc43.webp';
import bossEscapeGuideIcon from '@/assets/optimized/boss-mobile/804176624061.webp';
import topDamageBanner from '@/assets/optimized/boss-mobile/b572b40dcd01.webp';
import MarkerFrame from './MarkerFrame';
import AssetStage from './AssetStage';
import poisonCritGif from '@/assets/boss/poision.gif';
import LootBoxModal from './LootBoxModal';
import BossKeyIcon from './BossKeyIcon';
import { getResourceIcon } from '@/lib/resourceIcons';
import { getBossKillCount, getBossMedalProgress, getUnlockedBossMedals } from '@/lib/bossMedals';
import { getTopRankToneByRank } from '@/components/game/topRankTheme';
import {
  LeaderboardPodium,
  LeaderboardRow,
  LeaderboardValuePill,
} from '@/components/game/LeaderboardShared';
import {
  attackBoss,
  attackRaidBoss,
  claimBossBox,
  getRaidBoss,
  getBossFightById,
  getPlayerBossDamageLog,
  listActiveBossFights,
  listLastBossWinners,
  listBossDamageLogs,
  listRaidBossLeaderboard,
  spawnBossFight,
  escapeBossFight,
  sendChatMessage,
} from '@/services/gameApi';

const BOSS_BACKGROUNDS = {
  heli: bossLabBackground,
  tank: boss2BgBase,
  chinook: boss3Background,
  boss4: wormBgBase,
  boss5: sporgolBgBase,
  boss6: suckholeBackground,
  boss7: boss3Background,
};

const BOSS1_BACKGROUND_LAYERS = {
  base: boss1BgBase,
  star: boss1BgStar,
  meteors: boss1BgMeteors,
  blueMonitors: boss1BgBlueMonitors,
  redMonitor: boss1BgRedMonitor,
  redLights: boss1BgRedLights,
  topLight: boss1BgTopLight,
};

const WORM_CLOUD_LAYERS = [
  [wormCloudOne, { '--cloud-base-opacity': '0.86', '--cloud-mid-opacity': '0.93', '--cloud-peak-opacity': '1', '--cloud-mid-scale': '1.013', '--cloud-peak-scale': '1.025', '--cloud-duration': '4.8s', '--cloud-delay': '-1.44s' }],
  [wormCloudTwo, { '--cloud-base-opacity': '0.68', '--cloud-mid-opacity': '0.81', '--cloud-peak-opacity': '0.95', '--cloud-mid-scale': '1.018', '--cloud-peak-scale': '1.035', '--cloud-duration': '4.86s', '--cloud-delay': '-1.31s' }],
  [wormCloudThree, { '--cloud-base-opacity': '0.65', '--cloud-mid-opacity': '0.80', '--cloud-peak-opacity': '0.94', '--cloud-mid-scale': '1.018', '--cloud-peak-scale': '1.034', '--cloud-duration': '4.74s', '--cloud-delay': '-1.18s' }],
  [wormCloudFour, { '--cloud-base-opacity': '0.67', '--cloud-mid-opacity': '0.82', '--cloud-peak-opacity': '0.95', '--cloud-mid-scale': '1.019', '--cloud-peak-scale': '1.035', '--cloud-duration': '4.91s', '--cloud-delay': '-1.05s' }],
  [wormCloudFive, { '--cloud-base-opacity': '0.58', '--cloud-mid-opacity': '0.70', '--cloud-peak-opacity': '0.90', '--cloud-mid-scale': '1.021', '--cloud-peak-scale': '1.04', '--cloud-duration': '4.79s', '--cloud-delay': '-0.92s' }],
  [wormCloudSix, { '--cloud-base-opacity': '0.55', '--cloud-mid-opacity': '0.69', '--cloud-peak-opacity': '0.89', '--cloud-mid-scale': '1.022', '--cloud-peak-scale': '1.04', '--cloud-duration': '4.88s', '--cloud-delay': '-0.79s' }],
  [wormCloudSeven, { '--cloud-base-opacity': '0.57', '--cloud-mid-opacity': '0.71', '--cloud-peak-opacity': '0.90', '--cloud-mid-scale': '1.021', '--cloud-peak-scale': '1.039', '--cloud-duration': '4.73s', '--cloud-delay': '-0.66s' }],
  [wormCloudEight, { '--cloud-base-opacity': '0.56', '--cloud-mid-opacity': '0.70', '--cloud-peak-opacity': '0.89', '--cloud-mid-scale': '1.022', '--cloud-peak-scale': '1.04', '--cloud-duration': '4.95s', '--cloud-delay': '-0.53s' }],
  [wormCloudNine, { '--cloud-base-opacity': '0.57', '--cloud-mid-opacity': '0.65', '--cloud-peak-opacity': '0.82', '--cloud-mid-scale': '1.023', '--cloud-peak-scale': '1.045', '--cloud-duration': '4.81s', '--cloud-delay': '-0.40s' }],
  [wormCloudTen, { '--cloud-base-opacity': '0.52', '--cloud-mid-opacity': '0.63', '--cloud-peak-opacity': '0.81', '--cloud-mid-scale': '1.024', '--cloud-peak-scale': '1.044', '--cloud-duration': '4.9s', '--cloud-delay': '-0.27s' }],
  [wormCloudEleven, { '--cloud-base-opacity': '0.50', '--cloud-mid-opacity': '0.62', '--cloud-peak-opacity': '0.80', '--cloud-mid-scale': '1.023', '--cloud-peak-scale': '1.043', '--cloud-duration': '4.76s', '--cloud-delay': '-0.14s' }],
  [wormCloudTwelve, { '--cloud-base-opacity': '0.48', '--cloud-mid-opacity': '0.61', '--cloud-peak-opacity': '0.82', '--cloud-mid-scale': '1.024', '--cloud-peak-scale': '1.045', '--cloud-duration': '4.93s', '--cloud-delay': '-0.01s' }],
];

const BOSS1_STAGE_LAYERS = {
  st1: { aura: auraB1St1, tail: tailB1St1, leftArm: leftArmB1St1, rightArm: rightArmB1St1, bell: bellB1St1, body: ghostBodyB1St1, head: headB1St1, eyes: eyesGlowB1St1, redEyes: redEyesGlowB1St1 },
  st2: { aura: auraB1St2, tail: tailB1St2, leftArm: leftArmB1St2, rightArm: rightArmB1St2, bell: bellB1St2, body: ghostBodyB1St2, head: headB1St2, eyes: eyesGlowB1St2, redEyes: redEyesGlowB1St2 },
  st3: { aura: auraB1St3, tail: tailB1St3, leftArm: leftArmB1St3, rightArm: rightArmB1St3, bell: bellB1St3, body: ghostBodyB1St3, head: headB1St3, eyes: eyesGlowB1St3, redEyes: redEyesGlowB1St3 },
};

const BOSS_PHASE_IMGS = {
  high: boss1Stage1Gif,
  medium: boss2Portrait,
  low: boss3Portrait,
  defaultHigh: 'https://media.base44.com/images/public/69de9ecedeae23830b0df0aa/4cccf2e0a_boss_1.png',
  defaultMedium: 'https://media.base44.com/images/public/69de9ecedeae23830b0df0aa/f2f6b3350_boss_2.png',
  defaultLow: 'https://media.base44.com/images/public/69de9ecedeae23830b0df0aa/992cea4d7_boss_3.png',
};

const BOSS_PORTRAITS = {
  heli: underweightAvatar,
  tank: mothAvatar,
  chinook: shorkAvatar,
  boss4: wormAvatar,
  boss5: sporgolAvatar,
  boss6: suckholeAvatar,
  boss7: shkrabanAvatar,
  boss8: shkrabanAvatar,
  boss9: bossIco,
};

const BOSS_KEY_ICONS = {
  heli: 1,
  tank: 2,
  chinook: 3,
  boss4: 4,
  boss5: 5,
  boss6: 6,
  boss7: 7,
  boss8: 8,
  boss9: 9,
};

const BOSS_REWARD_MULTIPLIERS = [1, 1.45, 2.1, 2.8, 3.8, 5.1, 6.4, 8];
const BASE_STANDARD_REWARD = {
  xp: [10, 25],
  strength: [1, 2],
};

function getBossRewardPreview(bossId) {
  const bossIndex = GAME_CONFIG.BOSSES.findIndex((boss) => boss.id === bossId);
  const multiplier = BOSS_REWARD_MULTIPLIERS[bossIndex] || 1;
  const [baseXpMin, baseXpMax] = BASE_STANDARD_REWARD.xp;
  const [baseStrMin, baseStrMax] = BASE_STANDARD_REWARD.strength;
  return {
    xpMin: Math.max(1, Math.round(baseXpMin * multiplier)),
    xpMax: Math.max(1, Math.round(baseXpMax * multiplier)),
    strMin: Math.max(1, Math.round(baseStrMin * multiplier)),
    strMax: Math.max(1, Math.round(baseStrMax * multiplier)),
  };
}

const LOCATION_CHEST_ICONS = {
  beach: grayBox,
  factory: grayBox,
  oilrig: grayBox,
  prison: grayBox,
  lab: grayBox,
  metro: grayBox,
  bunker: grayBox,
  parcel: grayBox,
  colorless: grayBox,
  junkyard: grayBox,
  whale: grayBox,
  spore: grayBox,
  blackhole025: grayBox,
  teletron: grayBox,
  playground404: grayBox,
  playground404v2: grayBox,
};

const WEAPON_ICON_MAP = {
  fist: slapIcon,
  knuckle: forkStrikeIcon,
  satchel: smallPoisonIcon,
  f4: mediumPoisonIcon,
  c4: largePoisonIcon,
};

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

function getBossPhaseImg(hpPct) {
  if (hpPct > 50) return BOSS_PHASE_IMGS.high;
  if (hpPct > 10) return BOSS_PHASE_IMGS.medium;
  return BOSS_PHASE_IMGS.low;
}

function getBossSceneImage(bossId) {
  const portrait = BOSS_PORTRAITS[bossId] || getBossPhaseImg(hpPct);
  return { src: portrait, isVideo: false };
}

function getWeaponStock(profile, weapon) {
  const poisonInventoryId = {
    satchel: 'small-poison',
    f4: 'medium-poison',
    c4: 'large-poison',
  }[weapon.id];
  if (poisonInventoryId) return Math.max(0, Number((profile?.weapon_inventory || {})[poisonInventoryId] || 0));
  if (weapon.costType === 'free') return null;
  if (weapon.costType === 'tentacles') {
    return Math.max(0, Math.floor((profile?.tentacles || 0) / Math.max(weapon.cost || 1, 1)));
  }
  return Math.max(0, Math.floor((profile?.premium || 0) / Math.max(weapon.cost || 1, 1)));
}

function isPoisonWeapon(weapon) {
  return ['satchel', 'f4', 'c4'].includes(weapon.id);
}

function getClanAssistSummary(clanAssists) {
  const assists = Array.isArray(clanAssists)
    ? clanAssists
    : Array.isArray(clanAssists?.assists)
      ? clanAssists.assists
      : clanAssists && typeof clanAssists === 'object' && (
        clanAssists.player_id || clanAssists.playerId || clanAssists.name || clanAssists.damage
      )
        ? [clanAssists]
        : [];
  const declaredCount = Math.max(0, Number(clanAssists?.count || clanAssists?.total || 0));
  if (!assists.length && !declaredCount) return null;

  const damage = assists.reduce(
    (total, assist) => total + Math.max(0, Number(
      assist?.damage ?? assist?.damageDealt ?? assist?.damage_dealt ?? assist?.bonusDamage ?? assist?.bonus_damage ?? 0,
    )),
    0,
  );
  const declaredDamage = Math.max(0, Number(clanAssists?.damage ?? clanAssists?.totalDamage ?? clanAssists?.total_damage ?? 0));
  const names = assists
    .map((assist) => String(assist?.player_name || assist?.playerName || assist?.username || assist?.nickname || assist?.name || '').trim())
    .filter(Boolean)
    .slice(0, 2);

  return {
    count: Math.max(declaredCount, assists.length),
    damage: Math.max(damage, declaredDamage),
    names,
  };
}

function WeaponIcon({ weapon, cooldownLeft = 0, stock = null, muted = false }) {
  const iconSrc = WEAPON_ICON_MAP[weapon.id] || weapon.icon;
  const hasCooldown = weapon.cooldownMin > 0;
  const isCoolingDown = hasCooldown && cooldownLeft > 0;
  const remainingCooldownProgress = hasCooldown
    ? Math.min(1, Math.max(0, cooldownLeft / Math.max(weapon.cooldownMin, 1)))
    : 0;
  const recoveredProgress = hasCooldown ? 1 - remainingCooldownProgress : 1;
  const recoveredPct = Math.round(Math.max(0, Math.min(1, recoveredProgress)) * 100);
  const recoveredDeg = Math.max(0, Math.min(360, recoveredProgress * 360));
  const cooldownSecondsLeft = Math.max(0, Math.ceil(cooldownLeft * 60));
  const cooldownLabel = `${String(Math.floor(cooldownSecondsLeft / 60)).padStart(2, '0')}:${String(cooldownSecondsLeft % 60).padStart(2, '0')}`;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[76px]">
      {isCoolingDown ? (
        <>
          <img
            src={iconSrc}
            alt={weapon.name}
            className="absolute inset-0 z-[1] block h-full w-full object-contain"
            style={{ filter: 'grayscale(1) brightness(0.58)' }}
          />
          <img
            src={iconSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 z-[2] block h-full w-full object-contain"
            style={{
              WebkitMaskImage: `conic-gradient(from -90deg, #000 0deg ${recoveredDeg}deg, transparent ${recoveredDeg}deg 360deg)`,
              maskImage: `conic-gradient(from -90deg, #000 0deg ${recoveredDeg}deg, transparent ${recoveredDeg}deg 360deg)`,
            }}
          />
        </>
      ) : (
        <img
          src={iconSrc}
          alt={weapon.name}
          className="absolute inset-0 block h-full w-full object-contain transition duration-300"
          style={muted ? { filter: 'grayscale(1) brightness(0.72)' } : undefined}
        />
      )}

      {isCoolingDown ? (
        <div className="absolute inset-0 z-[6] flex items-center justify-center">
          <span className="rounded-[6px] bg-black/70 px-1.5 py-0.5 font-mono text-[11px] font-black leading-none text-[#f2f6ed] [text-shadow:0_1px_0_rgba(0,0,0,0.9)]">
            {cooldownLabel}
          </span>
        </div>
      ) : null}

      {stock !== null ? (
        <div className="absolute -right-1 -top-1 z-[7] min-w-[20px] rounded-full border border-[#ffd3d3] bg-[#ff3b30] px-1.5 py-[2px] text-center font-sans text-[10px] font-black leading-none text-white shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
          {stock}
        </div>
      ) : null}

      <div className="absolute bottom-0 left-0 z-[5] rounded-[7px] border border-[rgba(140,177,56,0.75)] bg-[rgba(0,0,0,0.65)] px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none text-[#efffd2] [text-shadow:0_0_4px_rgba(98,188,45,0.45)]">
        {weapon.damage}
      </div>
    </div>
  );
}

const BONUS_TRACK_STEPS = [
  { pct: 25, label: '25%', reward: '+EXP', icon: getResourceIcon('xp') },
  { pct: 50, label: '50%', reward: '+tentacles', icon: getResourceIcon('tentacles') },
  { pct: 100, label: '100%', reward: '+Box', icon: null },
];

function getDamageChestIcon(progressPct) {
  if (progressPct >= 100) return redBox;
  if (progressPct >= 75) return yellowBox;
  if (progressPct >= 50) return blueBox;
  if (progressPct >= 25) return greenBox;
  return grayBox;
}

function DamageBonusTrack({ damage = 0, maxHp = 1 }) {
  const safeMaxHp = Math.max(1, maxHp || 1);
  const progressPct = Math.max(0, Math.min(100, (damage / safeMaxHp) * 100));

  return (
    <div className="absolute left-2 right-2 top-[58px] z-[5] flex h-[34px] flex-row items-center">
      <div className="rounded-[8px] bg-[#10150f]/90 px-1.5 py-1 font-mono text-[8px] font-black text-[#eff7df] shadow-[inset_0_0_0_1px_rgba(175,227,90,0.16)]">
        3
      </div>
      <div className="relative h-[14px] w-full overflow-hidden rounded-full border border-[#425043] bg-[#182019] shadow-[inset_0_0_3px_rgba(0,0,0,0.72)]">
        <div className="absolute inset-[1px] overflow-hidden rounded-full">
          <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${progressPct}%` }}>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#1b506a_0%,#47b7df_52%,#a3edff_100%)] shadow-[inset_1px_0_rgba(255,255,255,0.32)]" />
          </div>
        </div>
      </div>

      {BONUS_TRACK_STEPS.map((step) => {
        const unlocked = progressPct >= step.pct;
        const stepIcon = step.pct === 100 ? getDamageChestIcon(progressPct) : step.icon;

        return (
          <div
            key={step.pct}
            className="absolute top-1/2 flex -translate-y-1/2 items-center justify-center"
            style={{ left: `${step.pct}%` }}
          >
            <div
              className={`relative flex h-[30px] w-[30px] items-center justify-center rounded-[5px] border bg-[#19100a] shadow-[0_5px_10px_rgba(0,0,0,0.35)] sm:h-[34px] sm:w-[34px] ${
                unlocked ? 'border-[#bfff4a]' : 'border-[#6b5431] grayscale'
              }`}
            >
              <img src={stepIcon} alt="" aria-hidden="true" className="h-[22px] w-[22px] object-contain sm:h-[25px] sm:w-[25px]" />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[8px] bg-[#10150f]/90 px-1 py-[1px] font-mono text-[7px] font-black leading-none text-[#e7ffc0] [text-shadow:0_1px_0_rgba(0,0,0,0.9)] shadow-[inset_0_0_0_1px_rgba(175,227,90,0.16)]">
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TalentProgressTrack({ profile }) {
  const { t } = useTranslation();
  const progress = getTalentProgress(profile);
  const progressPct = Math.max(0, Math.min(100, (progress.current / progress.goal) * 100));
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="relative z-[5] mt-0 flex h-[15px] w-full flex-row items-center overflow-visible sm:h-[18px]">
      <div className="relative h-full w-full overflow-hidden rounded-[4px] border border-[#4b5045] bg-[#20251e] shadow-[inset_0_0_4px_rgba(0,0,0,0.7)]">
        <div className="absolute inset-[1px] overflow-hidden rounded-[4px]">
          <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${progressPct}%` }}>
            <div className="absolute inset-0 bg-[#5f8f32] shadow-[inset_0_1px_rgba(255,239,206,0.36),inset_0_-2px_rgba(83,0,0,0.45)]" />
            <div className="absolute inset-y-0 left-[-18%] w-[30%] bg-[linear-gradient(90deg,transparent_0%,rgba(238,255,190,0.12)_40%,rgba(222,255,150,0.28)_55%,rgba(238,255,190,0.12)_70%,transparent_100%)]" style={{ animation: 'boss-acid-shine 2.6s ease-in-out infinite' }} />
          </div>
        </div>
        <div className="absolute inset-0 z-[2] flex items-center justify-center font-sans text-[10px] font-black leading-none text-[#f8ffe8] [text-shadow:0_1px_0_rgba(0,0,0,.9)] sm:text-[12px]">
          {Math.floor(progress.current)} / {progress.goal}
        </div>
      </div>
      <button type="button" aria-label={t('talentTree.progressHintLabel', { lng: profile?.language || 'uk' })} onClick={() => setShowHint((value) => !value)} className="absolute right-0 top-1/2 z-10 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-[#d8f8a6] bg-[#182114] font-sans text-[10px] font-black text-[#d8f8a6]">?</button>
      {showHint ? <div className="absolute bottom-7 right-0 z-20 w-[min(78vw,270px)] rounded-[10px] border border-[#8bff58] bg-[#11190f]/95 p-2 text-left font-mono text-[10px] font-bold leading-relaxed text-[#f4ffd9] shadow-[0_4px_14px_rgba(0,0,0,.7)]">{t('talentTree.progressHint', { lng: profile?.language || 'uk' })}</div> : null}
    </div>
  );
}

function formatBoardValue(value) {
  return new Intl.NumberFormat('uk-UA').format(Math.max(0, Math.round(value || 0)));
}

function BossBoardRank({ rank }) {
  const tone = getTopRankToneByRank(rank);
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border font-mono text-[10px] font-black ${tone.badgeClass}`}
    >
      {rank}
    </div>
  );
}

function BossDamageRow({ log, rank, isMe, language, onOpenPlayerProfile, raidMode = false }) {
  const { t } = useTranslation();
  const playerId = log?.player_id || log?.user_id || log?.player?.id;
  const playerProfile = playerId ? { ...log, id: playerId, username: log?.username || log?.nickname || log?.player_name, nickname: log?.nickname || log?.player_name } : null;
  return (
    <LeaderboardRow
      rank={rank}
      compactRank
      selected={isMe}
      mediaSrc={log?.avatar || log?.photoUrl || log?.photo_url || heroIcon}
      mediaFrameId={log?.avatar_frame_id || 'frame1'}
      title={log.player_name || `Player ${rank}`}
      titlePlayer={log}
      subtitle={log.clan_name || t('leaderboard_panel.no_clan', { lng: language })}
      rightNode={<LeaderboardValuePill value={log.damage} icon={bossDmgTopIcon} compact />}
      rightActions={raidMode && rank <= 100 ? <RaidRankPrize rank={rank} language={language} /> : null}
      titleClassName={isMe ? 'text-[#d8f67a]' : ''}
      onClick={playerProfile ? () => onOpenPlayerProfile?.(playerProfile) : null}
    />
  );
}

function buildClanDamageLeaderboard(leaderboard = []) {
  const clans = new Map();
  for (const log of leaderboard) {
    const name = String(log?.clan_name || '').trim();
    if (!name) continue;
    const clan = clans.get(name) || { id: name, clan_name: name, clan_logo_id: log.clan_logo_id, damage: 0, hits: 0 };
    clan.damage += Number(log.damage || 0);
    clan.hits += Number(log.hits || 0);
    clans.set(name, clan);
  }
  return [...clans.values()].sort((a, b) => b.damage - a.damage || b.hits - a.hits);
}

function BossClanDamageRow({ log, rank, subtitle }) {
  return (
    <LeaderboardRow rank={rank} compactRank mediaKind="logo" mediaSrc={GUILD_LOGO_BY_ID[log.clan_logo_id] || DEFAULT_GUILD_LOGO} title={log.clan_name} subtitle={subtitle} rightNode={<LeaderboardValuePill value={log.damage} icon={bossDmgTopIcon} compact />} />
  );
}

function BossTopPodium({ leaderboard, mode = 'players', clanSubtitle = 'Clan damage', onOpenPlayerProfile }) {
  const rows = (leaderboard || []).map((row) => ({
    mediaKind: mode === 'clans' ? 'logo' : 'avatar',
    mediaSrc: mode === 'clans' ? GUILD_LOGO_BY_ID[row?.clan_logo_id] || DEFAULT_GUILD_LOGO : row?.avatar || row?.photoUrl || row?.photo_url || heroIcon,
    mediaFrameId: mode === 'clans' ? null : row?.avatar_frame_id || 'frame1',
    titlePlayer: mode === 'clans' ? null : row,
    title: mode === 'clans' ? row?.clan_name || '-' : row?.player_name || '-',
    onClick: mode === 'clans' || !(row?.player_id || row?.user_id || row?.player?.id) ? null : () => onOpenPlayerProfile?.({ ...row, id: row.player_id || row.user_id || row.player?.id, username: row.username || row.nickname || row.player_name, nickname: row.nickname || row.player_name }),
    subtitle: mode === 'clans' ? clanSubtitle : row?.clan_name || 'No clan',
    value: row?.damage || 0,
    valueIcon: bossDmgTopIcon,
  }));

  return <LeaderboardPodium rows={rows} />;
}

function BossVictoryTopDamageCard({ row, onOpenPlayerProfile }) {
  if (!row) return null;
  const playerId = row.player_id || row.user_id || row.player?.id;

  return (
    <button type="button" onClick={playerId ? () => onOpenPlayerProfile?.({ ...row, id: playerId, username: row.username || row.nickname || row.player_name, nickname: row.nickname || row.player_name }) : undefined} disabled={!playerId} className={`relative mt-2 w-full max-w-[196px] aspect-[1129/1393] ${playerId ? 'cursor-pointer transition hover:brightness-125' : 'cursor-default'}`}>
      <img src={topDamageBanner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" />
      <div className="absolute inset-x-[16%] top-[16%] flex items-center justify-center gap-1 text-[#fff6d5] [text-shadow:0_2px_0_rgba(0,0,0,0.9)]">
        <img src={bossDmgTopIcon} alt="" aria-hidden="true" className="h-[10%] w-[10%] object-contain" />
        <span className="font-mono text-[clamp(9px,2.2vw,14px)] font-black leading-none">{formatBoardValue(row.damage)}</span>
      </div>
      <img src={row.avatar || row.photoUrl || row.photo_url || heroIcon} alt={row.player_name || 'Player'} className="absolute left-1/2 top-[28%] w-[36%] -translate-x-1/2 object-contain" />
      <div className="absolute inset-x-[15%] top-[61%] text-center text-[#fff4d4] [text-shadow:0_2px_0_rgba(0,0,0,0.9)]">
        <p data-keepcase="true" className="truncate font-mono text-[clamp(9px,2vw,13px)] font-black uppercase"><PlayerName player={row} name={row.player_name || 'Player'} /></p>
        <p className="mt-0.5 truncate font-mono text-[clamp(7px,1.6vw,10px)] uppercase text-[#f5d85d]">{row.clan_name || 'NO CLAN'}</p>
      </div>
    </button>
  );
}

const BOSS_VICTORY_COPY = {
  uk: { stamp: 'DEFEATED', failedStamp: 'НЕВДАЧА', status: 'ПЕРШИЙ БОС ЗДОХ!', tutorial: 'А ти не такий безнадійний, як виглядаєш. Бос мертвий, нагорода твоя, галактика поки вдає, що не хвилюється. Забирай здобич — ти заслужив кожен її сумнівний шматок.', guideTitle: 'БОС ЗДОХ. А ТИ — НІ!', guideText: 'Неочікувано пристойний результат. Забирай нагороду, поки вона не охолола, — попереду ще купа кнопок і сумнівних рішень.', title: 'ТОП ЗА УРОНОМ', reward: 'НАГОРОДА', subtitle: 'топ за завданою шкодою', next: 'ЗАБРАТИ НАГОРОДУ' },
  ru: { stamp: 'DEFEATED', failedStamp: 'НЕУДАЧА', status: 'ПЕРВЫЙ БОСС СДОХ!', tutorial: 'А ты не такой безнадёжный, как выглядишь. Босс мёртв, награда твоя, а галактика пока делает вид, что не волнуется. Забирай добычу — ты заслужил каждый её подозрительный кусок.', guideTitle: 'БОСС СДОХ. А ТЫ — НЕТ!', guideText: 'Неожиданно приличный результат. Забирай награду, пока она не остыла, — впереди ещё куча кнопок и сомнительных решений.', title: 'ТОП ПО УРОНУ', reward: 'НАГРАДА', subtitle: 'топ по нанесённому урону', next: 'ЗАБРАТЬ НАГРАДУ' },
  en: { stamp: 'DEFEATED', failedStamp: 'FAILED', status: 'YOUR FIRST BOSS IS DEAD!', tutorial: 'You’re not as hopeless as you look. The boss is dead, the reward is yours, and the galaxy is pretending not to worry. Claim the loot — you earned every suspicious piece of it.', guideTitle: 'THE BOSS IS DEAD. YOU’RE NOT!', guideText: 'Surprisingly decent result. Grab the reward before it gets cold — there are still plenty of buttons and questionable decisions ahead.', title: 'TOP DAMAGE', reward: 'REWARD', subtitle: 'top damage dealers', next: 'CLAIM REWARD' },
};

function BossVictoryModal({ bossId, bossName, leaderboard, language, outcome = 'defeated', onClaim, onOpenPlayerProfile, tutorialEnabled = true, bossKills = 0 }) {
  const copy = BOSS_VICTORY_COPY[language === 'ru' || language === 'en' ? language : 'uk'];
  const failed = outcome === 'failed';
  const stampText = failed ? 'DEFEAT' : 'DEFEATED';
  const topThree = (leaderboard || []).slice(0, 3);
  const showTutorialHint = tutorialEnabled && !failed && String(bossId) === String(GAME_CONFIG.BOSSES[0]?.id);
  const medalProgress = getBossMedalProgress(bossKills);
  const unlockedMedals = getUnlockedBossMedals(bossKills);
  const medalSet = BOSS_MEDAL_ASSETS[bossId] || DEFAULT_MEDAL_ASSETS;
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-[80] flex min-h-0 items-center justify-center overflow-hidden bg-black/80 p-3 backdrop-blur-sm"
    >
      <MarkerFrame className="flex h-full min-h-0 w-full max-w-[640px] flex-col" innerClassName="relative flex min-h-0 flex-1 flex-col overflow-hidden p-3" variant="dark">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
        <div className="mb-3 grid shrink-0 grid-cols-2 gap-3">
          <div className="flex min-w-0 flex-col items-center">
            <div className="relative flex h-[218px] w-full items-center justify-center">
              <p className="absolute top-1 z-[3] max-w-[94%] truncate font-mono text-[18px] font-black uppercase tracking-[0.06em] text-[#fff4d4] [text-shadow:0_2px_0_rgba(0,0,0,0.9)]">{bossName || 'Boss'}</p>
              <div className="absolute left-1/2 top-10 z-[1] h-40 w-40 -translate-x-1/2 sm:h-44 sm:w-44">
                <img src={BOSS_PORTRAITS[bossId] || bossIco} alt={bossName || 'Boss'} className="h-full w-full border-2 border-[#28ee90] bg-[#10170d] object-contain" />
                <span className="boss-victory-stamp absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-none border-[3px] border-[#ff3b30] bg-[#4a0606]/35 px-2 py-1 font-rubik-distressed text-[clamp(27px,7vw,46px)] leading-[0.82] tracking-[0.02em] text-[#ff2a22] [text-shadow:0_1px_0_#750000,0_0_7px_rgba(255,45,35,0.7)]">{stampText}</span>
              </div>
            </div>
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#9bd96b]">{copy.status}</p>
            <div className="mt-3 flex w-full flex-col items-center pt-2">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.12em] text-[#fff4d4]">{copy.reward}</p>
              <div className="boss-victory-chest-wrap mt-1 h-28 w-28 sm:h-32 sm:w-32">
                <img src={yellowBox} alt="" aria-hidden="true" className="boss-victory-reward-chest h-full w-full object-contain" />
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-col items-center">
            <h2 className="mt-0 w-full px-2 py-2 text-center font-mono text-[17px] font-black uppercase text-[#fff4d4] sm:text-[20px]">{copy.title}</h2>
            <BossVictoryTopDamageCard row={topThree[0]} onOpenPlayerProfile={onOpenPlayerProfile} />
            <div className="mt-2 flex w-full flex-col items-center gap-0.5">
              <div className="flex items-center justify-center gap-1">
                {(['bronze', 'silver', 'gold']).map((tier) => <img key={tier} src={medalSet[tier]} alt={`${tier} medal`} className={`h-14 w-14 object-contain ${unlockedMedals[tier] ? '' : 'grayscale opacity-45'}`} />)}
              </div>
              <span className="font-mono text-[10px] font-black text-[#d6e7bf]">{bossKills}/{medalProgress.target} {medalProgress.label}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-[12px] bg-[#070a07] p-2">
          <div className="space-y-1.5">
            {(leaderboard || []).map((row, index) => (
              <BossDamageRow key={row.id || row.player_email || index} log={row} rank={index + 1} isMe={false} language={language} onOpenPlayerProfile={onOpenPlayerProfile} />
            ))}
          </div>
        </div>
        </div>
        {showTutorialHint ? <>
          <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-black/50" />
          <div className="pointer-events-none absolute bottom-[62px] left-3 right-3 z-20 flex min-h-24 items-center rounded-[14px] border border-[#ffd21f] bg-[#171b10]/95 py-3 pl-2 pr-4 shadow-[0_5px_20px_rgba(0,0,0,.6)]">
            <img src={guideCelebrate} alt="" aria-hidden="true" className="-my-5 -ml-1 h-24 w-24 shrink-0 object-contain object-bottom" />
            <div className="min-w-0 text-left">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-[#ffd21f]">{copy.guideTitle}</p>
              <p className="mt-2 font-mono text-[12px] font-bold leading-relaxed text-[#f4ffd9]">{copy.guideText}</p>
            </div>
          </div>
        </> : null}
        <GameTextureButton type="button" data-tutorial-target={showTutorialHint ? 'tutorial-boss-victory' : undefined} onClick={onClaim} className={`relative mt-3 h-11 w-full shrink-0 ${showTutorialHint ? 'z-30 ring-2 ring-[#ffd21f] ring-offset-2 ring-offset-[#11170f]' : ''}`}>
          <span className="relative z-10 font-mono text-[12px] font-black uppercase text-[#15220b]">{copy.next}</span>
        </GameTextureButton>
        <style>{`
          .boss-victory-stamp {
            transform-origin: center;
            box-shadow: 0 0 8px rgba(255,40,40,.48), inset 0 0 7px rgba(255,40,40,.18);
            animation: boss-victory-stamp-enter .5s cubic-bezier(.18,.84,.28,1.16) both, boss-victory-stamp-glow 2.3s ease-in-out .5s infinite;
          }
          @keyframes boss-victory-stamp-enter {
            from { opacity: 0; transform: translate(-50%,-50%) scale(1.3) rotate(-16deg); }
            to { opacity: 1; transform: translate(-50%,-50%) scale(1) rotate(-10deg); }
          }
          @keyframes boss-victory-stamp-glow {
            0%,100% { filter: brightness(1); }
            50% { filter: brightness(1.18); }
          }
          .boss-victory-reward-chest {
            transform-origin: center;
            animation: boss-victory-reward-chest-pulse 3.8s ease-in-out .35s infinite;
          }
          .boss-victory-chest-wrap { position: relative; isolation: isolate; }
          .boss-victory-chest-wrap::before,
          .boss-victory-chest-wrap::after { content: ''; position: absolute; pointer-events: none; z-index: -1; }
          .boss-victory-chest-wrap::before {
            inset: -30%;
            background: radial-gradient(ellipse, #fff8bc 0%, #ffe576b8 19%, #dcbf466b 34%, #ab862125 52%, transparent 70%);
            filter: blur(5px);
            animation: clan-emblem-pulsar 3.8s ease-in-out infinite;
          }
          .boss-victory-chest-wrap::after {
            inset: -50%;
            opacity: .75;
            background: repeating-conic-gradient(from 12deg, transparent 0deg 9deg, #cbae4320 11deg, #ffe98d99 14deg, #fff7bd55 16deg, transparent 20deg 30deg), repeating-conic-gradient(from 41deg, transparent 0deg 23deg, #e9c34c66 26deg, transparent 29deg 47deg);
            -webkit-mask-image: radial-gradient(ellipse, transparent 10%, #000 24%, #000b 39%, transparent 69%);
            mask-image: radial-gradient(ellipse, transparent 10%, #000 24%, #000b 39%, transparent 69%);
            filter: blur(1.5px);
            animation: clan-emblem-rays 38s linear infinite;
          }
          @keyframes boss-victory-reward-chest-pulse {
            0%, 100% { opacity: 1; transform: scale(1); filter: brightness(1); }
            50% { opacity: .96; transform: scale(1.045); filter: brightness(1.16) drop-shadow(0 0 7px rgba(255,215,70,.38)); }
          }
          @media (prefers-reduced-motion: reduce) { .boss-victory-stamp, .boss-victory-reward-chest, .boss-victory-chest-wrap::before, .boss-victory-chest-wrap::after { animation: none; } }
        `}</style>
      </MarkerFrame>
    </motion.div>
  );
}

const CRITICAL_DAMAGE_COPY = {
  uk: 'КРИТИЧНА ШКОДА',
  ru: 'КРИТИЧЕСКИЙ УРОН',
  en: 'CRITICAL DAMAGE',
};

function CritCloud({ language = 'uk' }) {
  const label = CRITICAL_DAMAGE_COPY[language === 'ru' || language === 'en' ? language : 'uk'];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.45 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.45, 1.14, 1, 1.18] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.05, ease: 'easeOut' }}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <div className="relative flex h-[250px] w-[250px] items-center justify-center sm:h-[300px] sm:w-[300px]">
        <img src={poisonCritGif} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain brightness-125 saturate-150 drop-shadow-[0_0_22px_rgba(132,255,54,0.78)]" />
        <motion.span
          initial={{ opacity: 0, scale: 0.28, rotate: -9 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.28, 1.2, 1, 1.08], rotate: [-9, 3, -2, 0] }}
          transition={{ duration: 1.05, times: [0, 0.22, 0.68, 1], ease: 'easeOut' }}
          className="relative z-10 max-w-[240px] text-center font-serif text-[25px] font-black leading-[0.9] tracking-[0.08em] text-[#e6ff8f] [text-shadow:0_0_5px_#5cdb18,0_0_14px_rgba(99,255,30,0.95),2px_2px_0_#173d0c] sm:max-w-[290px] sm:text-[31px]"
        >
          {label}
        </motion.span>
      </div>
    </motion.div>
  );
}

function BossOneComposite({ hitToken }) {
  const rootRef = useRef(null);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    if (!hitToken || !rootRef.current) return undefined;
    const node = rootRef.current;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    node.classList.remove('boss1-hit');
    void node.offsetWidth;
    node.classList.add('boss1-hit');
    resetTimerRef.current = setTimeout(() => node.classList.remove('boss1-hit'), 480);
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [hitToken]);

  return (
    <div ref={rootRef} className="boss1-composite relative h-[405px] w-[270px] sm:h-[510px] sm:w-[340px]" aria-label="boss">
      <div className="boss1-rig boss1-hand-rig">
        <img src={boss1HandLayer} alt="" aria-hidden="true" className="boss1-layer" />
      </div>
      <img src={boss1BodyLayer} alt="boss" className="boss1-layer boss1-new-body drop-shadow-[0_28px_44px_rgba(0,0,0,0.5)]" />
      <div className="boss1-rig boss1-head-rig">
        <img src={boss1HeadLayer} alt="" aria-hidden="true" className="boss1-layer" />
        <img src={boss1HeadLabelLayer} alt="" aria-hidden="true" className="boss1-layer boss1-head-label" />
        <img src={boss1HeadSlimeLayer} alt="" aria-hidden="true" className="boss1-layer boss1-head-slime" />
      </div>
      <div className="boss1-rig boss1-hand-rig boss1-hand-slime-rig">
        <img src={boss1HandSlimeLayer} alt="" aria-hidden="true" className="boss1-layer boss1-hand-slime" />
      </div>
      <img src={boss1ReturnStampLayer} alt="" aria-hidden="true" className="boss1-layer boss1-return-stamp" />
      <div className="boss1-rig boss1-head-rig boss1-eyes-rig">
        <img src={boss1RedEyesLayer} alt="" aria-hidden="true" className="boss1-layer boss1-red-eyes" />
      </div>
      <span aria-hidden="true" className="boss1-hit-flash" />
    </div>
  );
}

function BossTwoBackground() {
  const [chameleonColor, setChameleonColor] = useState(null);
  const [rainbowWaveActive, setRainbowWaveActive] = useState(false);

  useEffect(() => {
    let timeoutId;
    let active = true;
    let previousColor = null;
    const chameleonColors = ['green', 'cyan', 'blue', 'violet', 'pink', 'orange', 'gold', 'red'];

    const scheduleChange = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        let nextColor = chameleonColors[Math.floor(Math.random() * chameleonColors.length)];
        while (nextColor === previousColor) {
          nextColor = chameleonColors[Math.floor(Math.random() * chameleonColors.length)];
        }
        previousColor = nextColor;
        setChameleonColor(nextColor);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setChameleonColor(null);
          scheduleChange();
        }, 1300 + Math.random() * 950);
      }, 3600 + Math.random() * 5200);
    };

    scheduleChange();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    let firstWave = true;

    const scheduleWave = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setRainbowWaveActive(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setRainbowWaveActive(false);
          firstWave = false;
          scheduleWave();
        }, 2900);
      }, firstWave ? 2400 + Math.random() * 600 : 8000 + Math.random() * 7000);
    };

    scheduleWave();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="boss2-background" aria-hidden="true">
      <img src={boss2BgBase} alt="" className="boss2-bg-layer boss2-bg-base" />
      <img src={boss2BgChameleon} alt="" className={`boss2-bg-layer boss2-bg-chameleon${chameleonColor ? ` is-${chameleonColor}` : ''}`} />
      <img src={boss2BgOutColours} alt="" className="boss2-bg-layer boss2-bg-out-colours" />
      <img src={boss2BgPoint} alt="" className="boss2-bg-layer boss2-bg-point" />
      <span aria-hidden="true" className="boss2-bg-mask boss2-bg-point-rainbow" style={{ '--boss2-bg-mask': `url(${boss2BgPoint})` }} />
      <img src={boss2BgPoint} alt="" className="boss2-bg-layer boss2-bg-point-detail" />
      <img src={boss2BgRainbow} alt="" className="boss2-bg-layer boss2-bg-rainbow" />
      <span aria-hidden="true" className={`boss2-bg-mask boss2-bg-rainbow-wave${rainbowWaveActive ? ' is-active' : ''}`} style={{ '--boss2-bg-mask': `url(${boss2BgRainbow})` }} />
      <span aria-hidden="true" className={`boss2-bg-mask boss2-bg-rainbow-wave-glow${rainbowWaveActive ? ' is-active' : ''}`} style={{ '--boss2-bg-mask': `url(${boss2BgRainbow})` }} />
      <img src={boss2BgRainbow} alt="" className="boss2-bg-layer boss2-bg-rainbow-detail" />
      <img src={boss2BgSmoke} alt="" className="boss2-bg-layer boss2-bg-smoke" />
      <img src={boss2BgSmokeTwo} alt="" className="boss2-bg-layer boss2-bg-smoke-two" />
    </div>
  );
}

function WormBackground() {
  const [pupilTarget, setPupilTarget] = useState({ x: 0, y: 0, duration: 480 });
  const [blinkEyeClosed, setBlinkEyeClosed] = useState(false);
  const [wheelLurching, setWheelLurching] = useState(false);
  const [cowJolting, setCowJolting] = useState(false);
  const [slimeImpulsing, setSlimeImpulsing] = useState(false);
  const [waterfallSurging, setWaterfallSurging] = useState(false);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const lookSomewhere = () => {
      const fast = Math.random() < 0.2;
      const duration = fast ? 80 + Math.random() * 100 : 200 + Math.random() * 500;
      setPupilTarget({
        x: -1.25 + Math.random() * 2.5,
        y: -0.42 + Math.random() * 0.84,
        duration,
      });
      timeoutId = setTimeout(() => {
        if (!active) return;
        lookSomewhere();
      }, duration + 400 + Math.random() * 1600);
    };
    timeoutId = setTimeout(lookSomewhere, 850);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleBlink = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setBlinkEyeClosed(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setBlinkEyeClosed(false);
          if (Math.random() < 0.2) {
            timeoutId = setTimeout(() => {
              if (!active) return;
              setBlinkEyeClosed(true);
              timeoutId = setTimeout(() => {
                if (!active) return;
                setBlinkEyeClosed(false);
                scheduleBlink();
              }, 150);
            }, 150 + Math.random() * 150);
          } else {
            scheduleBlink();
          }
        }, 160);
      }, 2500 + Math.random() * 4500);
    };
    scheduleBlink();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleWheelLurch = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setWheelLurching(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setWheelLurching(false);
          scheduleWheelLurch();
        }, 680);
      }, 3000 + Math.random() * 4000);
    };
    scheduleWheelLurch();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleCowJolt = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setCowJolting(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setCowJolting(false);
          scheduleCowJolt();
        }, 950);
      }, 4000 + Math.random() * 5000);
    };
    scheduleCowJolt();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleSlimeImpulse = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setSlimeImpulsing(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setSlimeImpulsing(false);
          scheduleSlimeImpulse();
        }, 400);
      }, 4000 + Math.random() * 5000);
    };
    scheduleSlimeImpulse();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleWaterfallSurge = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setWaterfallSurging(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setWaterfallSurging(false);
          scheduleWaterfallSurge();
        }, 820);
      }, 1500 + Math.random() * 2500);
    };
    scheduleWaterfallSurge();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="worm-background" aria-hidden="true">
      <img src={wormBgBase} alt="" className="worm-bg-layer worm-bg-base" />
      <img src={wormBgEyeBase} alt="" className="worm-bg-layer worm-bg-eye-base" />
      <img
        src={wormBgPupil}
        alt=""
        className="worm-bg-layer worm-bg-pupil"
        style={{
          '--worm-pupil-x': `${pupilTarget.x}%`,
          '--worm-pupil-y': `${pupilTarget.y}%`,
          '--worm-pupil-duration': `${pupilTarget.duration}ms`,
        }}
      />
      <img src={wormBgBlinkEye} alt="" className="worm-bg-layer worm-bg-blink-eye" />
      <span aria-hidden="true" className={`worm-bg-blink-lid${blinkEyeClosed ? ' is-closed' : ''}`} style={{ '--worm-bg-mask': `url(${wormBgBlinkEye})` }} />
      <img src={wormBgPendulumEye} alt="" className="worm-bg-layer worm-bg-pendulum-eye" />
      <img src={wormBgWheel} alt="" className={`worm-bg-layer worm-bg-wheel${wheelLurching ? ' is-lurching' : ''}`} />
      <img src={wormBgRedLamp} alt="" className="worm-bg-layer worm-bg-red-lamp-base" />
      <span aria-hidden="true" className="worm-bg-red-lamp-glow" style={{ '--worm-bg-mask': `url(${wormBgRedLamp})` }} />
      <img src={wormBgCone} alt="" className="worm-bg-layer worm-bg-cone" />
      <img src={wormBgCow} alt="" className={`worm-bg-layer worm-bg-cow${cowJolting ? ' is-jolting' : ''}`} />
      <img src={wormBgSlime} alt="" className="worm-bg-layer worm-bg-slime-base" />
      <span aria-hidden="true" className={`worm-bg-mask worm-bg-slime-sheen${slimeImpulsing ? ' is-impulsing' : ''}`} style={{ '--worm-bg-mask': `url(${wormBgSlime})` }} />
      <img src={wormBgWaterfall} alt="" className="worm-bg-layer worm-bg-waterfall-base" />
      <span aria-hidden="true" className="worm-bg-mask worm-bg-waterfall-flow" style={{ '--worm-bg-mask': `url(${wormBgWaterfall})` }} />
      <span aria-hidden="true" className={`worm-bg-mask worm-bg-waterfall-surge${waterfallSurging ? ' is-active' : ''}`} style={{ '--worm-bg-mask': `url(${wormBgWaterfall})` }} />
    </div>
  );
}

function ShorkBackground() {
  const [eyeBlinking, setEyeBlinking] = useState(false);
  const [screenGlitching, setScreenGlitching] = useState(false);
  const [screenBandActive, setScreenBandActive] = useState(false);
  const [screenIntensity, setScreenIntensity] = useState(1.15);
  const [slimeImpulsing, setSlimeImpulsing] = useState(false);
  const [lightboardIntensity, setLightboardIntensity] = useState(1);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleBlink = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setEyeBlinking(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setEyeBlinking(false);
          if (Math.random() < 0.2) {
            timeoutId = setTimeout(() => {
              if (!active) return;
              setEyeBlinking(true);
              timeoutId = setTimeout(() => {
                if (!active) return;
                setEyeBlinking(false);
                scheduleBlink();
              }, 115);
            }, 120 + Math.random() * 130);
          } else {
            scheduleBlink();
          }
        }, 115);
      }, 2500 + Math.random() * 4500);
    };
    scheduleBlink();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleBand = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setScreenBandActive(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setScreenBandActive(false);
          scheduleBand();
        }, 700 + Math.random() * 550);
      }, 2000 + Math.random() * 3000);
    };
    scheduleBand();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const varyIntensity = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setScreenIntensity(1.08 + Math.random() * 0.12);
        varyIntensity();
      }, 360 + Math.random() * 900);
    };
    varyIntensity();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    let nextFaultAt = Date.now() + 2000 + Math.random() * 5000;
    const minorLevels = [0.9, 0.95, 1, 1.05, 1.1];
    const faultPatterns = [
      [[0.75, 90], [0.95, 60], [0.4, 75], [0.9, 90], [0.65, 70], [1, 120]],
      [[0.3, 70], [1, 90]],
      [[0.7, 100], [0.4, 85], [0.2, 190], [0.8, 95], [0.5, 70], [1, 120]],
      [[0.86, 55], [0.52, 70], [0.96, 50], [0.32, 80], [1, 130]],
    ];

    const scheduleNormal = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        if (Date.now() >= nextFaultAt) {
          const pattern = faultPatterns[Math.floor(Math.random() * faultPatterns.length)];
          let stepIndex = 0;
          const runStep = () => {
            if (!active) return;
            const [intensity, duration] = pattern[stepIndex];
            setLightboardIntensity(intensity);
            stepIndex += 1;
            if (stepIndex < pattern.length) {
              timeoutId = setTimeout(runStep, duration);
              return;
            }
            timeoutId = setTimeout(() => {
              if (!active) return;
              setLightboardIntensity(1);
              nextFaultAt = Date.now() + 2000 + Math.random() * 5000;
              scheduleNormal();
            }, duration);
          };
          runStep();
          return;
        }
        setLightboardIntensity(minorLevels[Math.floor(Math.random() * minorLevels.length)]);
        scheduleNormal();
      }, 550 + Math.random() * 1150);
    };

    scheduleNormal();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleGlitch = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setScreenGlitching(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setScreenIntensity(1.25);
          timeoutId = setTimeout(() => {
            if (!active) return;
            setScreenIntensity(0.9);
            timeoutId = setTimeout(() => {
              if (!active) return;
              setScreenIntensity(1.1);
              setScreenGlitching(false);
              scheduleGlitch();
            }, 65);
          }, 55);
        }, 45);
      }, 4500 + Math.random() * 5500);
    };
    scheduleGlitch();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleImpulse = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setSlimeImpulsing(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setSlimeImpulsing(false);
          scheduleImpulse();
        }, 360 + Math.random() * 100);
      }, 4000 + Math.random() * 6000);
    };
    scheduleImpulse();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="shork-background" aria-hidden="true">
      <img src={shorkBgBase} alt="" className="shork-bg-layer shork-bg-base" />
      <img src={shorkBgBigPlanet} alt="" className="shork-bg-layer shork-bg-big-planet" />
      <img src={shorkBgMiniPlanet} alt="" className="shork-bg-layer shork-bg-mini-planet" />
      <img src={shorkBgCrane} alt="" className="shork-bg-layer shork-bg-crane" />
      <img
        src={shorkBgLightboard}
        alt=""
        className="shork-bg-layer shork-bg-lightboard-base"
      />
      <span
        aria-hidden="true"
        className="shork-bg-lightboard-glow"
        style={{
          '--shork-lightboard-mask': `url(${shorkBgLightboard})`,
          '--shork-lightboard-emission': Math.max(0.02, (lightboardIntensity - 0.5) * 0.72),
        }}
      />
      <span
        aria-hidden="true"
        className="shork-bg-screen-glow"
        style={{
          '--shork-screen-mask': `url(${shorkBgScreen})`,
          '--shork-screen-glow': 0.34 + (screenIntensity - 1) * 1.5,
        }}
      />
      <img
        src={shorkBgScreen}
        alt=""
        className="shork-bg-layer shork-bg-screen"
        style={{ '--shork-screen-brightness': screenIntensity }}
      />
      <span aria-hidden="true" className={`shork-bg-screen-noise${screenGlitching ? ' is-glitching' : ''}`} style={{ '--shork-screen-mask': `url(${shorkBgScreen})` }} />
      <span aria-hidden="true" className="shork-bg-screen-grain" style={{ '--shork-screen-mask': `url(${shorkBgScreen})` }} />
      <span aria-hidden="true" className={`shork-bg-screen-band${screenBandActive ? ' is-active' : ''}`} style={{ '--shork-screen-mask': `url(${shorkBgScreen})` }} />
      <img src={shorkBgLamp} alt="" className="shork-bg-layer shork-bg-lamp" />
      <img src={shorkBgEye} alt="" className={`shork-bg-layer shork-bg-eye${eyeBlinking ? ' is-blinking' : ''}`} />
      <img src={shorkBgSlime} alt="" className={`shork-bg-layer shork-bg-slime${slimeImpulsing ? ' is-impulsing' : ''}`} />
    </div>
  );
}

function BossTwoComposite({ hitToken }) {
  const rootRef = useRef(null);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    if (!hitToken || !rootRef.current) return undefined;
    const node = rootRef.current;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    node.classList.remove('boss2-hit');
    void node.offsetWidth;
    node.classList.add('boss2-hit');
    resetTimerRef.current = setTimeout(() => node.classList.remove('boss2-hit'), 460);
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [hitToken]);

  return (
    <div ref={rootRef} className="boss2-composite relative h-[405px] w-[270px] sm:h-[510px] sm:w-[340px]" aria-label="boss">
      <img src={boss2WingLayer} alt="" aria-hidden="true" className="boss2-layer boss2-wing" />
      <img src={boss2BodyLayer} alt="boss" className="boss2-layer boss2-body drop-shadow-[0_28px_44px_rgba(0,0,0,0.5)]" />
      <div className="boss2-belly-rig">
        <img src={boss2BellyLayer} alt="" aria-hidden="true" className="boss2-layer boss2-belly" />
        <span aria-hidden="true" className="boss2-mask boss2-belly-rainbow-mask" style={{ '--boss2-mask': `url(${boss2BellyLayer})` }} />
        <img src={boss2BellyLayer} alt="" aria-hidden="true" className="boss2-layer boss2-belly-detail" />
        <img src={boss2CubeLayer} alt="" aria-hidden="true" className="boss2-layer boss2-cube" />
        <img src={boss2OrbOneLayer} alt="" aria-hidden="true" className="boss2-layer boss2-orb-one" />
        <span aria-hidden="true" className="boss2-mask boss2-orb-one-glow" style={{ '--boss2-mask': `url(${boss2OrbOneLayer})` }} />
        <img src={boss2OrbTwoLayer} alt="" aria-hidden="true" className="boss2-layer boss2-orb-two" />
        <span aria-hidden="true" className="boss2-mask boss2-orb-two-glow" style={{ '--boss2-mask': `url(${boss2OrbTwoLayer})` }} />
      </div>
      <div className="boss2-head-rig">
        <img src={boss2HeadLayer} alt="" aria-hidden="true" className="boss2-layer boss2-head-standard" />
        <img src={boss2HeadHitLayer} alt="" aria-hidden="true" className="boss2-layer boss2-head-hit" />
        <img src={boss2HornsLayer} alt="" aria-hidden="true" className="boss2-layer boss2-horns" />
        <img src={boss2SlimeLayer} alt="" aria-hidden="true" className="boss2-layer boss2-slime" />
        <span aria-hidden="true" className="boss2-mask boss2-slime-rainbow-mask" style={{ '--boss2-mask': `url(${boss2SlimeLayer})` }} />
        <img src={boss2SlimeLayer} alt="" aria-hidden="true" className="boss2-layer boss2-slime-detail" />
      </div>
      <img src={boss2ArmOneLayer} alt="" aria-hidden="true" className="boss2-layer boss2-arm-one" />
      <img src={boss2ArmTwoLayer} alt="" aria-hidden="true" className="boss2-layer boss2-arm-two" />
    </div>
  );
}

function SporgolBackground() {
  const [pupilTarget, setPupilTarget] = useState({ x: 0, y: 0, duration: 360 });
  const [mushroomShaking, setMushroomShaking] = useState(false);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const chooseTarget = () => {
      const looksAtBoss = Math.random() < 0.16;
      let x;
      let y;
      if (looksAtBoss) {
        x = 9 + Math.random() * 4;
        y = -4 + Math.random() * 6;
      } else {
        do {
          x = -14 + Math.random() * 28;
          y = -10 + Math.random() * 20;
        } while ((x / 14) ** 2 + (y / 10) ** 2 > 1);
      }
      const fast = Math.random() < 0.16;
      const duration = fast ? 120 + Math.random() * 60 : 280 + Math.random() * 170;
      setPupilTarget({ x, y, duration });
      timeoutId = setTimeout(() => {
        if (active) chooseTarget();
      }, duration + 450 + Math.random() * 1500);
    };
    timeoutId = setTimeout(chooseTarget, 700);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleShake = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setMushroomShaking(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setMushroomShaking(false);
          scheduleShake();
        }, 1050);
      }, 700 + Math.random() * 1600);
    };
    scheduleShake();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="sporgol-background" aria-hidden="true">
      <img src={sporgolBgBase} alt="" className="sporgol-bg-layer sporgol-bg-base" />
      <img src={sporgolBgMoon} alt="" className="sporgol-bg-layer sporgol-bg-moon" />
      <img src={sporgolBgPlanets} alt="" className="sporgol-bg-layer sporgol-bg-planet sporgol-bg-planet-one" />
      <img src={sporgolBgPlanets} alt="" className="sporgol-bg-layer sporgol-bg-planet sporgol-bg-planet-two" />
      <img src={sporgolBgPlanets} alt="" className="sporgol-bg-layer sporgol-bg-planet sporgol-bg-planet-three" />
      <img src={sporgolBgMushroom} alt="" className={`sporgol-bg-layer sporgol-bg-mushroom${mushroomShaking ? ' is-shaking' : ''}`} />
      <img src={sporgolBgHand} alt="" className="sporgol-bg-layer sporgol-bg-hand" />
      <img src={sporgolBgEye} alt="" className="sporgol-bg-layer sporgol-bg-eye" />
      <img
        src={sporgolBgPupil}
        alt=""
        className="sporgol-bg-layer sporgol-bg-pupil"
        style={{ '--sporgol-pupil-x': `${pupilTarget.x}px`, '--sporgol-pupil-y': `${pupilTarget.y}px`, '--sporgol-pupil-duration': `${pupilTarget.duration}ms` }}
      />
    </div>
  );
}

function SporgolComposite() {
  const [pupils, setPupils] = useState([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]);
  const [tongueTicking, setTongueTicking] = useState(false);
  const [sporeSixSurging, setSporeSixSurging] = useState(false);

  useEffect(() => {
    let active = true;
    const timerIds = [];
    const limits = [{ x: 2.2, y: 1.4 }, { x: 2.6, y: 1.2 }, { x: 2.1, y: 1.3 }];
    const scheduleLook = (index) => {
      const delay = 300 + Math.random() * 900;
      timerIds[index] = setTimeout(() => {
        if (!active) return;
        const limit = limits[index];
        setPupils((current) => current.map((pupil, pupilIndex) => pupilIndex === index
          ? { x: (Math.random() * 2 - 1) * limit.x, y: (Math.random() * 2 - 1) * limit.y }
          : pupil));
        scheduleLook(index);
      }, delay);
    };
    scheduleLook(0);
    timerIds[1] = setTimeout(() => scheduleLook(1), 430);
    timerIds[2] = setTimeout(() => scheduleLook(2), 860);
    return () => {
      active = false;
      timerIds.forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleSurge = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setSporeSixSurging(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setSporeSixSurging(false);
          scheduleSurge();
        }, 680);
      }, 5000 + Math.random() * 4000);
    };
    scheduleSurge();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleTick = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setTongueTicking(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setTongueTicking(false);
          scheduleTick();
        }, 280);
      }, 6000 + Math.random() * 4000);
    };
    scheduleTick();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const pupilStyle = (index) => ({ '--look-x': `${pupils[index].x}px`, '--look-y': `${pupils[index].y}px` });

  return (
    <div className="sporgol-composite relative" aria-label="Sporgol">
      <img src={sporgolBodyLayer} alt="Sporgol" className="sporgol-layer sporgol-body drop-shadow-[0_28px_44px_rgba(0,0,0,0.5)]" />
      <img src={sporgolLargeMushroomLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-large-mushroom" />
      <img src={sporgolEyeOneLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-eye" />
      <img src={sporgolEyeTwoLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-eye" />
      <img src={sporgolEyeThreeLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-eye" />
      <img src={sporgolPupilOneLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-pupil sporgol-pupil-one" style={pupilStyle(0)} />
      <img src={sporgolPupilTwoLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-pupil sporgol-pupil-two" style={pupilStyle(1)} />
      <img src={sporgolPupilThreeLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-pupil sporgol-pupil-three" style={pupilStyle(2)} />
      <img src={sporgolSporeOneLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-spore-individual sporgol-spore-one" />
      <img src={sporgolSporeTwoLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-spore-individual sporgol-spore-two" />
      <img src={sporgolSporeThreeLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-spore-individual sporgol-spore-three" />
      <img src={sporgolSporeFourLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-spore-individual sporgol-spore-four" />
      <img src={sporgolSporeFiveLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-spore-individual sporgol-spore-five" />
      <img src={sporgolSporeSixLayer} alt="" aria-hidden="true" className={`sporgol-layer sporgol-spore-individual sporgol-spore-six${sporeSixSurging ? ' is-surging' : ''}`} />
      <img src={sporgolSporeLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-spore" />
      <div aria-hidden="true" className="sporgol-cloud-anchor">
        {WORM_CLOUD_LAYERS.map(([src, style], index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`sporgol-layer sporgol-cloud sporgol-cloud-${index + 1}`}
            style={style}
          />
        ))}
      </div>
      <img src={sporgolLegLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-leg" />
      <img src={sporgolFootLayer} alt="" aria-hidden="true" className="sporgol-layer sporgol-foot" />
      <img src={sporgolTongueLayer} alt="" aria-hidden="true" className={`sporgol-layer sporgol-tongue${tongueTicking ? ' is-ticking' : ''}`} />
    </div>
  );
}

function useSuckholeImpulse(minPause, maxPause, minDuration, maxDuration) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timeoutId;
    let mounted = true;
    const schedule = () => {
      timeoutId = setTimeout(() => {
        if (!mounted) return;
        setActive(true);
        timeoutId = setTimeout(() => {
          if (!mounted) return;
          setActive(false);
          schedule();
        }, minDuration + Math.random() * (maxDuration - minDuration));
      }, minPause + Math.random() * (maxPause - minPause));
    };
    schedule();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [maxDuration, maxPause, minDuration, minPause]);

  return active;
}

function SuckholeComposite() {
  const [pupilTarget, setPupilTarget] = useState({ x: 0, y: 0, duration: 340 });
  const catTwitching = useSuckholeImpulse(2000, 5000, 400, 650);
  const gamepadGlitching = useSuckholeImpulse(4000, 8000, 300, 500);
  const greenAssTwitching = useSuckholeImpulse(2000, 5000, 500, 900);
  const miniHandTwitching = useSuckholeImpulse(3000, 7000, 300, 500);
  const toiletTugging = useSuckholeImpulse(4000, 8000, 500, 800);

  useEffect(() => {
    let timeoutId;
    let mounted = true;
    const chooseTarget = () => {
      const looksAtPlayer = Math.random() < 0.16;
      let x;
      let y;
      if (looksAtPlayer) {
        x = -3.2;
        y = -0.8 + Math.random() * 1.6;
      } else {
        do {
          x = -4 + Math.random() * 8;
          y = -2.8 + Math.random() * 5.6;
        } while ((x / 4) ** 2 + (y / 2.8) ** 2 > 1);
      }
      const fast = Math.random() < 0.15;
      const duration = fast ? 100 + Math.random() * 80 : 250 + Math.random() * 200;
      setPupilTarget({ x, y, duration });
      timeoutId = setTimeout(() => {
        if (mounted) chooseTarget();
      }, duration + 600 + Math.random() * 1200);
    };
    timeoutId = setTimeout(chooseTarget, 850);
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="suckhole-composite relative" aria-label="Suckhole">
      <img src={suckholeLegOneLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-leg-one" />
      <img src={suckholeLegTwoLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-leg-two" />
      <img src={suckholeBodyLayer} alt="Suckhole" className="suckhole-layer suckhole-body drop-shadow-[0_28px_44px_rgba(0,0,0,0.5)]" />
      <div aria-hidden="true" className="suckhole-hole-rig">
        <img src={suckholeBlackHoleLayer} alt="" className="suckhole-layer suckhole-black-hole" />
      </div>
      <img src={suckholeEyeLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-eye" />
      <img src={suckholePupilLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-pupil" style={{ '--suckhole-pupil-x': `${pupilTarget.x}px`, '--suckhole-pupil-y': `${pupilTarget.y}px`, '--suckhole-pupil-duration': `${pupilTarget.duration}ms` }} />
      <img src={suckholeBigHandLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-big-hand" />
      <img src={suckholeHandLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-hand" />
      <img src={suckholeMiniHandLayer} alt="" aria-hidden="true" className={`suckhole-layer suckhole-mini-hand${miniHandTwitching ? ' is-twitching' : ''}`} />
      <img src={suckholeWormLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-worm" />
      <img src={suckholeTentacleLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-tentacle" />
      <img src={suckholeAntennaLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-antenna" />
      <span aria-hidden="true" className="suckhole-antenna-flash" />
      <img src={suckholeBeaconLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-beacon" />
      <span aria-hidden="true" className="suckhole-beacon-flash" />
      <img src={suckholeBraLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-bra" />
      <img src={suckholeBurgerLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-burger" />
      <img src={suckholeCatLayer} alt="" aria-hidden="true" className={`suckhole-layer suckhole-cat${catTwitching ? ' is-twitching' : ''}`} />
      <img src={suckholeCowLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-cow" />
      <img src={suckholeDuckLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-duck" />
      <img src={suckholeGestureLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-gesture" />
      <img src={suckholeGamepadLayer} alt="" aria-hidden="true" className={`suckhole-layer suckhole-gamepad${gamepadGlitching ? ' is-glitching' : ''}`} />
      <img src={suckholeGreenAssLayer} alt="" aria-hidden="true" className={`suckhole-layer suckhole-green-ass${greenAssTwitching ? ' is-twitching' : ''}`} />
      <img src={suckholePizzaLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-pizza" />
      <img src={suckholeToiletLayer} alt="" aria-hidden="true" className={`suckhole-layer suckhole-toilet${toiletTugging ? ' is-tugging' : ''}`} />
      <img src={suckholeToiletPaperLayer} alt="" aria-hidden="true" className="suckhole-layer suckhole-toilet-paper" />
    </div>
  );
}

function WormComposite() {
  const [bigEyeBlinking, setBigEyeBlinking] = useState(false);
  const [parasiteTwitching, setParasiteTwitching] = useState(false);
  const [bellyBubbling, setBellyBubbling] = useState(false);
  const [teethMotion, setTeethMotion] = useState('');
  const [slimeImpulsing, setSlimeImpulsing] = useState(false);
  const [mouthBoosting, setMouthBoosting] = useState(false);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleBlink = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setBigEyeBlinking(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setBigEyeBlinking(false);
          if (Math.random() < 0.2) {
            timeoutId = setTimeout(() => {
              if (!active) return;
              setBigEyeBlinking(true);
              timeoutId = setTimeout(() => {
                if (!active) return;
                setBigEyeBlinking(false);
                scheduleBlink();
              }, 135);
            }, 150 + Math.random() * 100);
          } else {
            scheduleBlink();
          }
        }, 150);
      }, 2500 + Math.random() * 4500);
    };
    scheduleBlink();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleTwitch = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setParasiteTwitching(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setParasiteTwitching(false);
          scheduleTwitch();
        }, 820);
      }, 2000 + Math.random() * 4000);
    };
    scheduleTwitch();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleBubble = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setBellyBubbling(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setBellyBubbling(false);
          scheduleBubble();
        }, 440);
      }, 2000 + Math.random() * 3000);
    };
    scheduleBubble();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleChomp = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        const isSnap = Math.random() < 0.28;
        setTeethMotion(isSnap ? 'is-snapping' : 'is-chomping');
        timeoutId = setTimeout(() => {
          if (!active) return;
          setTeethMotion('');
          scheduleChomp();
        }, isSnap ? 220 : 560);
      }, 1500 + Math.random() * 2500);
    };
    scheduleChomp();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleSlimePulse = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setSlimeImpulsing(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setSlimeImpulsing(false);
          scheduleSlimePulse();
        }, 420);
      }, 4000 + Math.random() * 5000);
    };
    scheduleSlimePulse();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleMouthBoost = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setMouthBoosting(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setMouthBoosting(false);
          scheduleMouthBoost();
        }, 700 + Math.random() * 300);
      }, 5000 + Math.random() * 5000);
    };
    scheduleMouthBoost();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="worm-composite relative" aria-label="Worm">
      <img src={wormBaseLayer} alt="Worm" className="worm-layer worm-base drop-shadow-[0_28px_44px_rgba(0,0,0,0.5)]" />
      <img src={wormBellyLayer} alt="" aria-hidden="true" className={`worm-layer worm-belly${bellyBubbling ? ' is-bubbling' : ''}`} />
      <img src={wormTeethLayer} alt="" aria-hidden="true" className={`worm-layer worm-teeth ${teethMotion}`} />
      <img src={wormStalkEyeLayer} alt="" aria-hidden="true" className="worm-layer worm-stalk-eye" />
      <img src={wormBigEyeLayer} alt="" aria-hidden="true" className={`worm-layer worm-big-eye${bigEyeBlinking ? ' is-blinking' : ''}`} />
      <img src={wormSawMouthLayer} alt="" aria-hidden="true" className={`worm-layer worm-saw-mouth${mouthBoosting ? ' is-boosting' : ''}`} />
      <img src={wormParasiteLayer} alt="" aria-hidden="true" className={`worm-layer worm-parasite${parasiteTwitching ? ' is-twitching' : ''}`} />
      <img src={wormSlimeLayer} alt="" aria-hidden="true" className={`worm-layer worm-slime${slimeImpulsing ? ' is-impulsing' : ''}`} />
    </div>
  );
}

function ShorkComposite({ hitToken }) {
  const rootRef = useRef(null);
  const hitTimerRef = useRef(null);
  const [eyesBlinking, setEyesBlinking] = useState(false);
  const [antennaPulsing, setAntennaPulsing] = useState(false);
  const [lidOpening, setLidOpening] = useState(false);
  const [legStomping, setLegStomping] = useState(false);

  useEffect(() => {
    if (!hitToken || !rootRef.current) return undefined;
    const node = rootRef.current;
    if (hitTimerRef.current) clearTimeout(hitTimerRef.current);
    setEyesBlinking(false);
    node.classList.remove('shork-hit');
    void node.offsetWidth;
    node.classList.add('shork-hit');
    hitTimerRef.current = setTimeout(() => node.classList.remove('shork-hit'), 170);
    return () => {
      if (hitTimerRef.current) clearTimeout(hitTimerRef.current);
    };
  }, [hitToken]);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleBlink = () => {
      timeoutId = setTimeout(() => {
        if (!active || rootRef.current?.classList.contains('shork-hit')) {
          scheduleBlink();
          return;
        }
        setEyesBlinking(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setEyesBlinking(false);
          scheduleBlink();
        }, 115);
      }, 2000 + Math.random() * 4000);
    };
    scheduleBlink();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const schedulePulse = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setAntennaPulsing(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setAntennaPulsing(false);
          schedulePulse();
        }, 360);
      }, 1500 + Math.random() * 1500);
    };
    schedulePulse();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleOpen = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setLidOpening(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setLidOpening(false);
          scheduleOpen();
        }, 1180);
      }, 4000 + Math.random() * 4000);
    };
    scheduleOpen();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let active = true;
    const scheduleStomp = () => {
      timeoutId = setTimeout(() => {
        if (!active) return;
        setLegStomping(true);
        timeoutId = setTimeout(() => {
          if (!active) return;
          setLegStomping(false);
          scheduleStomp();
        }, 460);
      }, 3000 + Math.random() * 4000);
    };
    scheduleStomp();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={rootRef} className="shork-composite relative h-[405px] w-[270px] sm:h-[510px] sm:w-[340px]" aria-label="Shork">
      <img src={shorkBodyLayer} alt="Shork" className="shork-layer shork-body drop-shadow-[0_28px_44px_rgba(0,0,0,0.5)]" />
      <img src={shorkBananaLayer} alt="" aria-hidden="true" className="shork-layer shork-banana" />
      <img src={shorkAntennaLayer} alt="" aria-hidden="true" className={`shork-layer shork-antenna${antennaPulsing ? ' is-pulsing' : ''}`} />
      <img src={shorkChairHandLayer} alt="" aria-hidden="true" className="shork-layer shork-chair-hand" />
      <img src={shorkWeaponHandLayer} alt="" aria-hidden="true" className="shork-layer shork-weapon-hand" />
      <img src={shorkLegLayer} alt="" aria-hidden="true" className={`shork-layer shork-leg${legStomping ? ' is-stomping' : ''}`} />
      <div className="shork-head-rig">
        <img src={shorkHeadLayer} alt="" aria-hidden="true" className="shork-layer shork-head" />
        <img src={shorkEyesLayer} alt="" aria-hidden="true" className={`shork-layer shork-eyes${eyesBlinking ? ' is-blinking' : ''}`} />
        <img src={shorkDamageEyesLayer} alt="" aria-hidden="true" className="shork-layer shork-damage-eyes" />
        <img src={shorkHeadLidLayer} alt="" aria-hidden="true" className={`shork-layer shork-head-lid${lidOpening ? ' is-opening' : ''}`} />
      </div>
      <img src={shorkForkLayer} alt="" aria-hidden="true" className="shork-layer shork-fork" />
    </div>
  );
}

const StableRaidBossBackground = memo(RaidBossTwoBackground);
const StableRaidBossComposite = memo(RaidBossTwo);
const StableBossOneComposite = memo(BossOneComposite);
const StableBossTwoComposite = memo(BossTwoComposite);
const StableWormComposite = memo(WormComposite);
const StableSporgolComposite = memo(SporgolComposite);
const StableSuckholeComposite = memo(SuckholeComposite);
const StableShorkComposite = memo(ShorkComposite);

const acknowledgedBossVictories = new Map();

export default function BossPanel({ profile, onAddXp, onRefreshProfile, onUpdateProfile, onSyncProfile = null, onOpenPlayerProfile = null, onOpenClan = null, suppressLootModal = false, raidMode = false, onBackToEvents = null, joinedBossFight = null }) {
  const { t } = useTranslation();
  const [activeFight, setActiveFight] = useState(null);
  const [myDmgLog, setMyDmgLog] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastBossWinners, setLastBossWinners] = useState({});
  const [loading, setLoading] = useState(true);
  const [hitEffect, setHitEffect] = useState(null);
  const [bossHitToken, setBossHitToken] = useState(0);
  const hitEffectTimerRef = useRef(null);
  useEffect(() => () => window.clearTimeout(hitEffectTimerRef.current), []);
  const [bossEffectClass, setBossEffectClass] = useState('');
  const [attacking, setAttacking] = useState(false);
  const [attackError, setAttackError] = useState('');
  const [escaping, setEscaping] = useState(false);
  const [escapeConfirmOpen, setEscapeConfirmOpen] = useState(false);
  const [clanHelpOpen, setClanHelpOpen] = useState(false);
  const [sendingClanHelp, setSendingClanHelp] = useState(false);
  const [clanHelpStatus, setClanHelpStatus] = useState('');
  const [poisonMultiplier, setPoisonMultiplier] = useState(1);
  const [x10InfoOpen, setX10InfoOpen] = useState(false);
  const [statusInfoOpen, setStatusInfoOpen] = useState(null);
  const [selectedComboIndex, setSelectedComboIndex] = useState(null);
  const [killReward, setKillReward] = useState(null);
  const [victorySummary, setVictorySummary] = useState(null);
  const victoryOwnerKey = String(profile?.id || profile?.created_by || 'anonymous');
  if (!acknowledgedBossVictories.has(victoryOwnerKey)) acknowledgedBossVictories.set(victoryOwnerKey, new Set());
  const claimedVictoryFightIdsRef = useRef(acknowledgedBossVictories.get(victoryOwnerKey));
  const [clanAssistNotice, setClanAssistNotice] = useState(null);
  const [pendingBoxes, setPendingBoxes] = useState([]);
  const [autoBoxFightId, setAutoBoxFightId] = useState(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState('players');
  const [secondBossWarning, setSecondBossWarning] = useState(null);
  const secondBossWarningSeenRef = useRef(Boolean(profile?.second_boss_warning_seen));
  const [cooldownNow, setCooldownNow] = useState(serverNow());
  const bossEscapeCooldownMs = getBossEscapeCooldownRemaining(profile?.weapon_cooldowns, cooldownNow);
  const pollRef = useRef(null);
  const loadRetryRef = useRef(null);
  const attackEpochRef = useRef(0);
  const expiredRefreshRef = useRef(null);
  const escapedFightIdRef = useRef(null);
  const bossEffectTimerRef = useRef(null);
  const clanAssistTimerRef = useRef(null);
  const handledBoxKeysRef = useRef(new Set());
  const lang = profile?.language || 'uk';
  const combatStateKey = raidMode ? `raid:${activeFight?.id || 'active'}` : activeFight?.id;
  const currentCombatState = profile?.talent_combat_state?.[combatStateKey] || {};
  const tr = {
    chooseBoss: t('boss_panel.choose_boss', { lng: lang }),
    rewardTitle: t('boss_panel.reward_title', { lng: lang }),
    noKey: 'NO KEY',
    free: 'FREE',
    attack: lang === 'en' ? 'FIGHT' : lang === 'ru' ? 'В БОЙ' : 'У БІЙ',
    level: lang === 'en' ? 'Lvl' : lang === 'ru' ? 'Ур.' : 'Рів.',
    rewardStrength: 'CA',
    rewardXp: 'EXP',
    rankReady: lang === 'en' ? 'Rank boxes ready' : lang === 'ru' ? 'Рейтинговые боксы готовы' : 'Рейтингові бокси готові',
    firstKill: lang === 'en' ? 'First kill:' : lang === 'ru' ? 'Первое убийство:' : 'Перше вбивство:',
    nextKey: lang === 'en' ? 'Key to the next boss' : lang === 'ru' ? 'Ключ к следующему боссу' : 'Ключ до наступного боса',
    smallPoison: lang === 'en' ? 'Small Poison' : lang === 'ru' ? 'Малый яд' : 'Мала отрута',
    poisonMultiplier: lang === 'en'
      ? 'Choose x10 or x100 poison: uses that many doses and deals matching damage. Select the active option again to turn it off.'
      : lang === 'ru'
        ? 'Выберите x10 или x100 яда: расходуется столько же доз и наносится соответствующий урон. Нажмите выбранный вариант ещё раз, чтобы выключить.'
        : 'Обери x10 або x100 отрути: витрачається стільки ж доз і завдається відповідна шкода. Натисни вибраний варіант ще раз, щоб вимкнути.',
    statusTitle: lang === 'en' ? 'BLEED & TOXIC MARKS' : lang === 'ru' ? 'КРОВОТЕЧЕНИЕ И МЕТКИ' : 'КРОВОТЕЧА Й МІТКИ',
    statusClose: lang === 'en' ? 'CLOSE' : lang === 'ru' ? 'ЗАКРЫТЬ' : 'ЗАКРИТИ',
    statusBleed: lang === 'en' ? 'BLEED' : lang === 'ru' ? 'КРОВОТЕЧЕНИЕ' : 'КРОВОТЕЧА',
    statusMarks: lang === 'en' ? 'TOXIC MARKS' : lang === 'ru' ? 'ТОКСИЧНЫЕ МЕТКИ' : 'ТОКСИЧНІ МІТКИ',
    statusPerSecond: lang === 'en' ? 'damage / sec' : lang === 'ru' ? 'урона / сек' : 'урону / с',
    statusRemaining: lang === 'en' ? 'remaining' : lang === 'ru' ? 'осталось' : 'залишилось',
    statusNextBleed: lang === 'en' ? 'On next application' : lang === 'ru' ? 'При следующем наложении' : 'При наступному накладанні',
    statusActualBleed: lang === 'en' ? 'Currently active' : lang === 'ru' ? 'Сейчас действует' : 'Зараз діє',
    statusBleedHelp: lang === 'en' ? 'Deals damage every second. The numbers include your current talent levels and mark count.' : lang === 'ru' ? 'Наносит урон каждую секунду. Значения учитывают уровни твоих талантов и число меток.' : 'Завдає шкоди щосекунди. Значення враховують рівні твоїх талантів і кількість міток.',
    statusMarksHelp: lang === 'en' ? 'Small and Medium Poison apply 1 mark each. You can have up to 5; some talents add extra damage or marks.' : lang === 'ru' ? 'Малый и Средний яд накладывают по 1 метке. Максимум — 5; таланты могут добавить метки и урон.' : 'Мала й Середня отрута накладають по 1 мітці. Максимум — 5; таланти можуть додати мітки й шкоду.',
    statusCombo: lang === 'en' ? 'WHAT EACH COMBO DOES' : lang === 'ru' ? 'ЧТО ДАЁТ КАЖДОЕ КОМБО' : 'ЩО ДАЄ КОЖНЕ КОМБО',
    statusComboHelp: lang === 'en' ? 'Bonus depends on your talent levels.' : lang === 'ru' ? 'Бонус зависит от прокачки талантов.' : 'Бонус залежить від рівня талантів.',
    statusDamageHit: lang === 'en' ? 'damage/hit' : lang === 'ru' ? 'урона/удар' : 'шкоди/удар',
    statusProgress: lang === 'en' ? 'Your progress' : lang === 'ru' ? 'Твой прогресс' : 'Твій прогрес',
    statusAvailable: lang === 'en' ? 'ACTIVE' : lang === 'ru' ? 'АКТИВНО' : 'АКТИВНО',
    statusNeedMarkSpace: lang === 'en' ? 'Marks are full (5/5). Spend one first.' : lang === 'ru' ? 'Метки заполнены (5/5). Сначала потрать одну.' : 'Міток уже максимум (5/5). Спершу витрать одну.',
    statusNeedBleed: lang === 'en' ? 'Apply bleed first' : lang === 'ru' ? 'Сначала вызови кровотечение' : 'Спершу наклади кровотечу',
    statusMarksTrigger: lang === 'en' ? 'marks' : lang === 'ru' ? 'меток' : 'міток',
    clanAssistBosses: lang === 'en' ? 'Clanmates’ bosses hit' : lang === 'ru' ? 'Боссов соклановцев задето' : 'Босів сокланівців зачеплено',
    clanAssistDamage: lang === 'en' ? 'Damage to them' : lang === 'ru' ? 'Урон по ним' : 'Шкода по них',
    clanHelpOwnerOnly: lang === 'en' ? 'Only the player who started this fight can call the clan' : lang === 'ru' ? 'Позвать клан может только тот, кто начал этот бой' : 'Покликати клан може лише той, хто почав цей бій',
    clanHelpAlreadySent: lang === 'en' ? 'The clan has already been called for this fight' : lang === 'ru' ? 'Клан уже позвали на этот бой' : 'Клан уже покликали на цей бій',
    damage: lang === 'en' ? 'damage' : lang === 'ru' ? 'урона' : 'урону',
    escape: lang === 'en' ? 'Run away' : lang === 'ru' ? 'Убежать' : 'Втекти',
    escapeTitle: lang === 'en' ? 'A TACTICAL RETREAT, HUH?' : lang === 'ru' ? 'ТАКТИЧЕСКОЕ ОТСТУПЛЕНИЕ, АГА?' : 'ТАКТИЧНИЙ ВІДСТУП, АГА?',
    escapeText: lang === 'en' ? 'Leave now and the fight ends. The boss will obviously tell everyone you got scared. We’ll call it strategic pants preservation.' : lang === 'ru' ? 'Если сбежишь сейчас, бой завершится. Босс, конечно, будет всем рассказывать, что ты испугался. Но мы назовём это стратегическим сохранением штанов.' : 'Якщо втечеш зараз, бій завершиться. Бос, звісно, розповідатиме всім, що ти злякався. Але ми назвемо це стратегічним збереженням штанів.',
    keepFighting: lang === 'en' ? 'KEEP FIGHTING' : lang === 'ru' ? 'ЕЩЁ ПОДЕРУСЬ' : 'ЩЕ ПОБ’ЮСЯ',
    confirmEscape: lang === 'en' ? 'YES, RUN AWAY' : lang === 'ru' ? 'ДА, УБЕГАЕМ' : 'ТАК, ВТІКАЄМО',
    clanHelpTitle: lang === 'en' ? 'THIS THING NEEDS A CLAN-SIZED DOSE' : lang === 'ru' ? 'ЭТОЙ ТВАРИ НЕ ПОБЕДИТЬ ОДНОЙ ПРОБИРКОЙ' : 'ЦІЙ ПОТВОРІ ОДНІЄЇ ПРОБІРКИ МАЛО',
    clanHelpText: lang === 'en' ? 'I found a boss-sized problem. Call the clan—invited players can attack it without a key.' : lang === 'ru' ? 'Нашёл проблему размером с босса. Зови клан — приглашённые смогут атаковать его даже без ключа.' : 'Знайшов проблему розміром із боса. Клич клан — запрошені зможуть атакувати його навіть без ключа.',
    clanHelpCancel: lang === 'en' ? 'I’VE GOT THIS' : lang === 'ru' ? 'Я САМ СПРАВЛЮСЬ' : 'Я САМ РОЗБЕРУСЬ',
    clanHelpSend: sendingClanHelp ? '…' : lang === 'en' ? 'CALL THE CLAN' : lang === 'ru' ? 'ЗОВУ КЛАН' : 'КЛИКНУТИ КЛАН',
    clanHelpNoClan: lang === 'en' ? 'Join a clan first, then call in backup.' : lang === 'ru' ? 'Сначала вступи в клан, потом зови подкрепление.' : 'Спершу вступи до клану, тоді клич підмогу.',
    clanHelpSent: lang === 'en' ? 'SOS sent to clan chat!' : lang === 'ru' ? 'Сигнал отправлен в чат клана!' : 'Сигнал надіслано в чат клану!',
    secondBossWarningTitle: lang === 'en' ? 'STOP. REALLY GOING IN ALONE?' : lang === 'ru' ? 'СТОЙ. ТЫ ТОЧНО СОБРАЛСЯ ИДТИ ТУДА ОДИН?' : 'СТІЙ. ТИ СПРАВДІ ЗІБРАВСЯ ЛІЗТИ ТУДИ ОДИН?',
    secondBossWarningText: lang === 'en'
      ? `This boss has ${Number(secondBossWarning?.maxHp || 10000).toLocaleString('en-US')} HP, and you are below level 20 without a clan. Find a clan and return with reinforcements, or enter alone at your own risk.`
      : lang === 'ru'
        ? `У этого босса ${Number(secondBossWarning?.maxHp || 10000).toLocaleString('ru-RU')} HP, а ты ниже 20 уровня и без клана. Найди клан и возвращайся с подкреплением или заходи один на свой страх и риск.`
        : `У цього боса ${Number(secondBossWarning?.maxHp || 10000).toLocaleString('uk-UA')} HP, а ти нижче 20 рівня й без клану. Знайди клан і повернися з підкріпленням або заходь сам на свій страх і ризик.`,
    findClan: lang === 'en' ? 'FIND A CLAN' : lang === 'ru' ? 'НАЙТИ КЛАН' : 'ЗНАЙТИ КЛАН',
  };
  const displayedLeaderboard = leaderboardMode === 'clans' ? buildClanDamageLeaderboard(leaderboard) : leaderboard;
  const ownDamageRank = leaderboard.findIndex(row => (profile?.id && row.player_id === profile.id) || (profile?.created_by && row.player_email === profile.created_by));
  const fightStartedByPlayer = Boolean(activeFight?.opened_by_email && profile?.created_by && String(activeFight.opened_by_email).toLowerCase() === String(profile.created_by).toLowerCase());
  const clanHelpAlreadySent = Boolean(activeFight?.clan_invite_sent_at);
  const canCallClanHelp = Boolean(activeFight && !raidMode && fightStartedByPlayer && !clanHelpAlreadySent);
  const getFightBossName = (fight) => {
    const boss = GAME_CONFIG.BOSSES.find((entry) => entry.id === fight?.boss_id);
    return boss ? getLocalizedBossName(boss, lang) : fight?.boss_name || '';
  };

  const triggerBossEffect = (effectName, duration = 500) => {
    if (bossEffectTimerRef.current) clearTimeout(bossEffectTimerRef.current);
    setBossEffectClass('');
    if (!effectName) return;
    setBossEffectClass(effectName);
    bossEffectTimerRef.current = setTimeout(() => {
      setBossEffectClass('');
      bossEffectTimerRef.current = null;
    }, duration);
  };

  const showClanAssistNotice = (clanAssists) => {
    const summary = getClanAssistSummary(clanAssists);
    if (!summary) return;
    if (clanAssistTimerRef.current) clearTimeout(clanAssistTimerRef.current);
    setClanAssistNotice(summary);
    clanAssistTimerRef.current = setTimeout(() => {
      setClanAssistNotice(null);
      clanAssistTimerRef.current = null;
    }, 4200);
  };

  const getPendingBoxKey = (box, index = 0) =>
    box?.instanceId || `${box?.boxType || 'box'}:${box?.bossId || box?.boss_id || 'boss'}:${box?.fightId || box?.fight_id || 'fight'}:${index}`;

  useEffect(() => {
    void loadFight();
    if (!raidMode) listLastBossWinners().then((winners) => setLastBossWinners(winners || {})).catch(() => setLastBossWinners({}));
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (loadRetryRef.current) clearTimeout(loadRetryRef.current);
      if (bossEffectTimerRef.current) clearTimeout(bossEffectTimerRef.current);
      if (clanAssistTimerRef.current) clearTimeout(clanAssistTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) setCooldownNow(serverNow()); }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!autoBoxFightId || !claimedVictoryFightIdsRef.current.has(autoBoxFightId) || pendingBoxes.length) return;
    const queue = Array.isArray(profile?.pending_boss_boxes) ? profile.pending_boss_boxes : [];
    const box = queue.find((entry) => String(entry?.fightId || entry?.fight_id || '') === String(autoBoxFightId)
      && !handledBoxKeysRef.current.has(getPendingBoxKey(entry)));
    if (box) setPendingBoxes([{ ...box, queueIndex: 0, totalBoxes: 1 }]);
  }, [autoBoxFightId, profile?.pending_boss_boxes, pendingBoxes.length]);

  useEffect(() => {
    if (raidMode || suppressLootModal || pendingBoxes.length) return;
    const queue = Array.isArray(profile?.pending_boss_boxes) ? profile.pending_boss_boxes : [];
    const available = queue.filter((entry, index) => entry?.rewardFormula === 'boss_v2'
      && !handledBoxKeysRef.current.has(getPendingBoxKey(entry, index)));
    if (available.length) {
      setPendingBoxes(available.map((box, index) => ({ ...box, queueIndex: index, totalBoxes: available.length })));
    }
  }, [raidMode, suppressLootModal, profile?.pending_boss_boxes, pendingBoxes.length]);

  const bleedExpiresAt = Number(currentCombatState.bleed?.expiresAt || 0);
  useEffect(() => {
    if (raidMode || !activeFight?.id || bleedExpiresAt <= serverNow()) return undefined;
    let busy = false;
    let cancelled = false;
    const timer = setInterval(async () => {
      if (document.hidden || busy || serverNow() > bleedExpiresAt + 2000) return;
      busy = true;
      const epoch = attackEpochRef.current;
      try {
        const fight = await getBossFightById(activeFight.id);
        if (!cancelled && epoch === attackEpochRef.current && fight) {
          if (fight.status === 'dead') { clearInterval(timer); await refreshFight(fight.id, fight); }
          else setActiveFight(current => current?.id === fight.id ? fight : current);
        }
      } catch { /* Keep the normal fight poll as fallback. */ }
      finally { busy = false; }
    }, 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [activeFight?.id, bleedExpiresAt, raidMode]);

  const startPolling = (fightId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (document.hidden) return;
      void refreshFight(fightId).catch(() => {});
      void loadLeaderboard(fightId).catch(() => {});
    }, 10000);
  };

  const loadLeaderboard = async (fightId) => {
    const logs = raidMode ? await listRaidBossLeaderboard() : await listBossDamageLogs(fightId, 100);
    setLeaderboard(logs);
    return logs;
  };

  const loadMyDmg = async (fightId) => {
    if (!profile) return;
    const log = await getPlayerBossDamageLog(fightId, profile.created_by);
    setMyDmgLog(log);
  };

  const refreshFight = async (fightId, knownFight = null) => {
    const epoch = attackEpochRef.current;
    if (raidMode) {
      const raidBoss = await getRaidBoss();
      if (epoch !== attackEpochRef.current) return;
      if (raidBoss) setActiveFight({ ...raidBoss, boss_id: 'heli', boss_name: raidBoss.name || 'Raid Boss' });
      return;
    }
    const fight = knownFight || await getBossFightById(fightId);
    if (!fight || epoch !== attackEpochRef.current) return;
    if (fight.status !== 'active' && pollRef.current) clearInterval(pollRef.current);
    if (fight.status === 'dead') {
      const finalLeaderboard = await loadLeaderboard(fight.id).catch(() => []);
      if (epoch !== attackEpochRef.current) return;
      // Publish the finished fight and its complete result together. Until the
      // ranking arrives, retain the fight scene rather than an interim modal.
      setActiveFight(fight);
      setVictorySummary(current => claimedVictoryFightIdsRef.current.has(fight.id) || current?.fightId === fight.id ? current : {
        bossId: fight.boss_id,
        bossName: getLocalizedBossName(GAME_CONFIG.BOSSES.find(boss => boss.id === fight.boss_id), profile?.language || 'uk'),
        leaderboard: finalLeaderboard,
        fightId: fight.id,
      });
      await onRefreshProfile?.();
    } else {
      setActiveFight(fight.status === 'expired' || fight.status === 'abandoned' ? null : fight);
    }
  };

  const loadFight = async () => {
    if (!activeFight) setLoading(true);
    try {
      if (raidMode) {
        try {
          const raidBoss = await getRaidBoss();
          setActiveFight(raidBoss ? { ...raidBoss, boss_id: 'heli', boss_name: raidBoss.name || 'Raid Boss' } : {
            id: 'global-raid-boss', boss_id: 'heli', boss_name: 'Raid Boss', max_hp: RAID_BOSS_MAX_HP, current_hp: RAID_BOSS_MAX_HP, status: eventPhase('raid-boss') === 'active' ? 'active' : 'inactive', started_at: EVENT_SCHEDULE['raid-boss'].startAt, ends_at: EVENT_SCHEDULE['raid-boss'].endAt,
          });
        setLoading(false);
        startPolling('global-raid-boss');
        void loadLeaderboard('global-raid-boss').catch(() => {});
        } catch (error) {
          setActiveFight(null);
          setAttackError(error?.message || 'Could not load raid boss');
        }
        return;
      }
      const fights = (await listActiveBossFights(profile.created_by))
        .filter((fight) => !fight?.status || fight.status === 'active');

      if (fights.length > 0) {
        const fight = fights[0];
        if (escapedFightIdRef.current && String(fight.id) === String(escapedFightIdRef.current)) {
          setActiveFight(null);
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setActiveFight(fight);
          void loadLeaderboard(fight.id).catch(() => {});
          void loadMyDmg(fight.id).catch(() => {});
          startPolling(fight.id);
        }
      } else {
        setActiveFight(null);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      // A transient request failure must not erase an active fight.
      if (loadRetryRef.current) clearTimeout(loadRetryRef.current);
      loadRetryRef.current = setTimeout(() => { void loadFight(); }, 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (raidMode || !joinedBossFight?.id) return;
    setActiveFight(joinedBossFight);
    setAttackError('');
    void loadLeaderboard(joinedBossFight.id).catch(() => {});
    void loadMyDmg(joinedBossFight.id).catch(() => {});
    startPolling(joinedBossFight.id);
  }, [joinedBossFight?.id]);

  const handleRefresh = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    await loadFight();
  };

  const spawnBoss = async (boss) => {
    setAttackError('');
    try {
      const fight = await spawnBossFight({ profile, boss });
      onSyncProfile?.({ id: profile.id, weapon_cooldowns: {} });
      setActiveFight(fight);
      setMyDmgLog(null);
      setLeaderboard([]);
      startPolling(fight.id);
      void onRefreshProfile?.().catch(() => {});
    } catch (error) {
      setAttackError(error?.message || (lang === 'en' ? 'Could not start this boss fight.' : lang === 'ru' ? 'Не удалось начать бой с боссом.' : 'Не вдалося почати бій із босом.'));
    }
  };

  const handleOpenBossBox = async ({ boxType, bossId, fightId, instanceId }) => {
    const claim = () => claimBossBox({ profile, boxType, bossId, fightId, instanceId: instanceId || pendingBoxes[0]?.instanceId });
    try {
      let result;
      try {
        result = await claim();
      } catch (firstError) {
        // A dropped response can happen after the server has already persisted
        // the reward. Retrying converts that case into the normal 409 close.
        if (Number(firstError?.status || 0) >= 500 || !firstError?.status) result = await claim();
        else throw firstError;
      }
      if (result.player) onSyncProfile?.(result.player);
      // The claim has already succeeded. A failed background refresh must not
      // make the modal report a failed chest opening or allow a duplicate claim.
      if (!onSyncProfile) await onRefreshProfile?.().catch(() => {});
      return result.drops || [];
    } catch (error) {
      if (error?.code === 'LOOT_ALREADY_CLAIMED') {
        closePendingBox();
        await onRefreshProfile?.();
      }
      throw error;
    }
  };

  const closePendingBox = () => {
    const fightId = pendingBoxes[0]?.fightId || pendingBoxes[0]?.fight_id || autoBoxFightId;
    if (fightId) claimedVictoryFightIdsRef.current.add(fightId);
    setVictorySummary(null);
    setAutoBoxFightId(null);
    setPendingBoxes((current) => {
      if (current[0]) {
        handledBoxKeysRef.current.add(getPendingBoxKey(current[0], current[0].queueIndex || 0));
      }
      const next = current.slice(1);
      const isFirstBoss = String(current[0]?.bossId || current[0]?.boss_id) === String(GAME_CONFIG.BOSSES[0]?.id);
      if (!next.length && isFirstBoss && typeof window !== 'undefined') {
        window.setTimeout(() => window.dispatchEvent(new CustomEvent('boss-tutorial-rewards-complete')), 0);
      }
      return next;
    });
  };

  const handleVictoryClaim = () => {
    const fightId = victorySummary?.fightId || autoBoxFightId || activeFight?.id;
    if (fightId) { claimedVictoryFightIdsRef.current.add(fightId); setAutoBoxFightId(fightId); }
    const isFirstBoss = String(victorySummary?.bossId) === String(GAME_CONFIG.BOSSES[0]?.id);
    setVictorySummary(null);
    if (isFirstBoss) onUpdateProfile?.({ first_boss_tutorial_seen: true });
    if (!isFirstBoss) return;
  };

  const handleBossSelection = (boss) => {
    if (getBossEscapeCooldownRemaining(profile?.weapon_cooldowns, serverNow()) > 0) return;
    const isSecondBoss = boss?.id === GAME_CONFIG.BOSSES[1]?.id;
    const needsClanWarning = Number(profile?.level || 1) < 20 && !String(profile?.clan_id || profile?.clan_name || '').trim();
    if (profile?.second_boss_warning_seen) secondBossWarningSeenRef.current = true;
    if (isSecondBoss && needsClanWarning && !secondBossWarningSeenRef.current) {
      secondBossWarningSeenRef.current = true;
      onUpdateProfile?.({ second_boss_warning_seen: true });
      setSecondBossWarning(boss);
      return;
    }
    spawnBoss(boss);
  };

  const confirmSecondBoss = () => {
    const boss = secondBossWarning;
    if (!boss) return;
    setSecondBossWarning(null);
    spawnBoss(boss);
  };

  const handleEscape = async () => {
    if (!activeFight?.id || escaping || attacking) return;
    const fightId = activeFight.id;
    escapedFightIdRef.current = fightId;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setEscaping(true);
    try {
      const escapeResult = await escapeBossFight(fightId);
      if (escapeResult?.boss_escape_cooldown_until) {
        onSyncProfile?.({
          id: profile.id,
          weapon_cooldowns: {
            ...(profile.weapon_cooldowns || {}),
            boss_escape_until: escapeResult.boss_escape_cooldown_until,
          },
        });
      }
      setActiveFight(null);
      setPoisonMultiplier(1);
      setX10InfoOpen(false);
    } catch (error) {
      console.error('[boss] escape failed', error);
      escapedFightIdRef.current = null;
      await loadFight();
    } finally {
      setEscaping(false);
    }
  };

  const handleClanHelpInvite = async () => {
    if (!profile?.clan_id && !profile?.clan_name) {
      setClanHelpOpen(false);
      onOpenClan?.();
      return;
    }
    if (sendingClanHelp || !activeFight || !canCallClanHelp) return;
    setSendingClanHelp(true);
    try {
      const invitedFightId = activeFight.id;
      const bossName = getFightBossName(activeFight);
      const text = lang === 'en'
        ? `🛟 Clan backup needed! I’m fighting ${bossName}. Jump in and help take it down—no key needed!`
        : lang === 'ru'
          ? `🛟 Нужна помощь клана! Я сражаюсь с боссом «${bossName}». Залетайте, поможем его добить — ключ не нужен!`
          : `🛟 Потрібна допомога клану! Я б’юся з босом «${bossName}». Залітайте, допоможіть його добити — ключ не потрібен!`;
      await sendChatMessage({ channel: 'clan', text, kind: 'boss_fight_invite', bossFightInvite: { fightId: activeFight.id } });
      setActiveFight((current) => current?.id === invitedFightId ? { ...current, clan_invite_sent_at: new Date().toISOString() } : current);
      setClanHelpStatus('');
      setClanHelpOpen(false);
    } catch (error) {
      if (error?.code === 'BOSS_FIGHT_INVITE_ALREADY_SENT') {
        setActiveFight((current) => current ? { ...current, clan_invite_sent_at: current.clan_invite_sent_at || new Date().toISOString() } : current);
      }
      setClanHelpStatus(error?.code === 'BOSS_FIGHT_INVITE_ALREADY_SENT' ? tr.clanHelpAlreadySent : error?.code === 'BOSS_FIGHT_INVITE_FORBIDDEN' ? tr.clanHelpOwnerOnly : error?.message || (lang === 'en' ? 'Could not send the clan call.' : lang === 'ru' ? 'Не удалось позвать клан.' : 'Не вдалося покликати клан.'));
    } finally {
      setSendingClanHelp(false);
    }
  };

  const handleAttack = async (weapon) => {
    if (!activeFight || !profile || attacking || activeFight.status !== 'active') return;

    setAttackError('');
    attackEpochRef.current += 1;
    setAttacking(true);
    // Do not let the five-second poll render the finished-fight fallback while
    // the finishing attack is still resolving its result screen.
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    let resolvedFight = null;
    let fightNotFound = false;

    try {
      const multiplier = isPoisonWeapon(weapon) ? poisonMultiplier : 1;
      const attackResult = await (raidMode ? attackRaidBoss({ weapon, multiplier }) : attackBoss({
        fight: activeFight,
        profile,
        weapon,
        multiplier,
      }));
      resolvedFight = attackResult?.fight || null;
      if (!raidMode && attackResult?.fight?.status === 'dead') {
        const finishedFight = attackResult.fight;
        setActiveFight(finishedFight);
        setVictorySummary(current => claimedVictoryFightIdsRef.current.has(finishedFight.id) || current?.fightId === finishedFight.id ? current : {
          fightId: finishedFight.id,
          bossId: finishedFight.boss_id,
          bossName: getLocalizedBossName(GAME_CONFIG.BOSSES.find(boss => boss.id === finishedFight.boss_id), profile?.language || 'uk'),
          leaderboard,
        });
        // Show the result screen immediately; update the final ranking in the background.
        void loadLeaderboard(finishedFight.id).then((finalLeaderboard) => {
          setVictorySummary(current => current?.fightId === finishedFight.id ? { ...current, leaderboard: finalLeaderboard } : current);
        }).catch(() => {});
      }
      showClanAssistNotice(attackResult?.clanAssists);
      if (raidMode || attackResult?.fight?.status !== 'dead') {
        setActiveFight(raidMode && attackResult.fight ? { ...attackResult.fight, boss_id: 'heli', boss_name: attackResult.fight.name || activeFight?.boss_name || 'Raid Boss' } : attackResult.fight);
      }
      if (attackResult.player) onSyncProfile?.(attackResult.player);
      setMyDmgLog(attackResult.playerDamageLog);
      setHitEffect(attackResult.hit);
      setBossHitToken((current) => current + 1);
      if (attackResult?.hit?.isCrit) triggerBossEffect('big-poison-hit', 800);
      else triggerBossEffect('poison-hit', 400);
      window.clearTimeout(hitEffectTimerRef.current);
      hitEffectTimerRef.current = window.setTimeout(() => setHitEffect(null), 2200);

      if (attackResult.player && !onSyncProfile) {
        const nextProfilePatch = {};
        const mergeDefined = (key, value) => {
          if (value !== undefined) nextProfilePatch[key] = value;
        };
        mergeDefined('boss_talent_progress', attackResult.player.boss_talent_progress);
        mergeDefined('boss_talent_progress_goal', attackResult.player.boss_talent_progress_goal);
        mergeDefined('boss_talent_level', attackResult.player.boss_talent_level);
        mergeDefined('talent_points', attackResult.player.talent_points);
        mergeDefined('talent_tree_version', attackResult.player.talent_tree_version);
        mergeDefined('available_talent_points', attackResult.player.available_talent_points);
        mergeDefined('total_talent_points_earned', attackResult.player.total_talent_points_earned);
        mergeDefined('total_talent_points_spent', attackResult.player.total_talent_points_spent);
        mergeDefined('talent_damage_progress', attackResult.player.talent_damage_progress);
        mergeDefined('next_talent_threshold_index', attackResult.player.next_talent_threshold_index);
        mergeDefined('talent_combat_state', attackResult.player.talent_combat_state);
        mergeDefined('talent_levels', attackResult.player.talent_levels);
        mergeDefined('max_energy', attackResult.player.max_energy);
        mergeDefined('energy', attackResult.player.energy);
        mergeDefined('boss_damage_today', attackResult.player.boss_damage_today);
        mergeDefined('boss_damage_lifetime', attackResult.player.boss_damage_lifetime);
        mergeDefined('total_boss_damage', attackResult.player.total_boss_damage);
        mergeDefined('boss_hits_today', attackResult.player.boss_hits_today);
        mergeDefined('boss_kills', attackResult.player.boss_kills);
        mergeDefined('boss_kills_by_id', attackResult.player.boss_kills_by_id);
        mergeDefined('best_medal', attackResult.player.best_medal);
        mergeDefined('keycards', attackResult.player.keycards);
        mergeDefined('boss_key_pity', attackResult.player.boss_key_pity);
        mergeDefined('weapon_inventory', attackResult.player.weapon_inventory);
        mergeDefined('weapon_cooldowns', attackResult.player.weapon_cooldowns);
        if (Object.keys(nextProfilePatch).length > 0) {
          await onUpdateProfile?.(nextProfilePatch);
        }
      }

      if (attackResult.xpGranted && !attackResult.xpApplied) {
        await onAddXp(attackResult.xpGranted);
      }

      if (attackResult?.fight?.status !== 'dead') void loadLeaderboard(activeFight.id).catch(() => {});

      if (attackResult.rewardSummary) {
        setKillReward({
          rank: attackResult.rewardSummary.rank,
          reward: attackResult.rewardSummary.reward,
          medal: attackResult.rewardSummary.medal,
          firstKillReward: attackResult.rewardSummary.firstKillReward,
          nextKeyDrop: attackResult.rewardSummary.nextKeyDrop,
        });
        const bossId = attackResult.fight?.boss_id || activeFight?.boss_id;
        const fightId = attackResult.fight?.id || activeFight?.id;
        const rewardBoxes = (attackResult.rewardSummary.boxes || []).filter((box) => box.boxType);
        // Queue will be hydrated from profile.pending_boss_boxes after refresh to avoid duplicate modal sessions.
        void bossId;
        void fightId;
        void rewardBoxes;
        setTimeout(() => setKillReward(null), 5000);
        if (!onSyncProfile) await onRefreshProfile?.();

        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (error) {
      if (error?.code === 'BOSS_FIGHT_NOT_FOUND') {
        fightNotFound = true;
        // A clan mate can finish the fight between the last poll and this hit.
        // Refresh immediately so the stale fight does not leave a permanent error.
        await loadFight();
        setAttackError('');
        return;
      }
      // A 500 can happen after the server has committed part of an attack. Re-read
      // both the profile and fight so the UI cannot keep spending stale poison.
      await Promise.allSettled([
        Promise.resolve().then(() => onRefreshProfile?.()),
        loadFight(),
      ]);
      setAttackError(error?.message || error?.code || 'ATTACK_FAILED');
      console.error('[boss] attack failed', error);
    } finally {
      setAttacking(false);
      if (!fightNotFound && !raidMode && resolvedFight?.status === 'active') startPolling(resolvedFight.id);
      else if (!fightNotFound && !resolvedFight && activeFight?.status === 'active') startPolling(activeFight.id);
    }
  };

  const getWeaponCdLeft = (weapon) => {
    if (!weapon.cooldownMin) return 0;
    const last = (profile?.weapon_cooldowns || {})[weapon.id];
    if (!last) return 0;
    return Math.max(0, weapon.cooldownMin - (cooldownNow - new Date(last).getTime()) / 60000);
  };

  const hpPct = activeFight ? (activeFight.current_hp / (activeFight.max_hp || 1)) * 100 : 0;
  const bossMedia = activeFight
    ? getBossSceneImage(activeFight.boss_id)
    : { src: BOSS_PHASE_IMGS.high, isVideo: false };
  const [bossAssetsFailed,setBossAssetsFailed]=useState(false);
  useEffect(()=>setBossAssetsFailed(false),[activeFight?.boss_id]);
  const androidScene = typeof window !== 'undefined' && (String(window.Telegram?.WebApp?.platform || '').toLowerCase().includes('android') || /Android/i.test(window.navigator.userAgent));
  const bossImage = bossMedia?.src || BOSS_PHASE_IMGS.high;
  const useSceneVideo = Boolean(bossMedia?.isVideo);
  const bossBackground = activeFight
    ? BOSS_BACKGROUNDS[activeFight.boss_id] || BOSS_BACKGROUNDS.heli
    : BOSS_BACKGROUNDS.heli;
  const bossSceneSizeClass =
    activeFight?.boss_id === 'chinook'
      ? 'h-[min(48dvh,420px)] sm:h-[min(58dvh,560px)]'
      : activeFight?.boss_id === 'tank'
        ? 'h-[min(46dvh,390px)] sm:h-[min(56dvh,520px)]'
        : 'h-[min(45dvh,380px)] sm:h-[min(55dvh,510px)]';
  const personalDamage = myDmgLog?.damage || 0;
  const fightDurationMs = raidMode ? 7 * 86400000 : 6 * 3600000;
  const fightDeadline = raidMode
    ? Date.parse(activeFight?.ends_at || EVENT_SCHEDULE['raid-boss'].endAt)
    : Date.parse(activeFight?.ends_at || '') || Date.parse(activeFight?.started_at || '') + fightDurationMs;
  const fightSecondsLeft = activeFight?.status === 'active' && Number.isFinite(fightDeadline)
    ? Math.max(0, Math.ceil((fightDeadline - cooldownNow) / 1000)) : 0;
  useEffect(() => {
    if (raidMode || !activeFight?.id || activeFight.status !== 'active' || fightSecondsLeft > 0) return;
    if (expiredRefreshRef.current === activeFight.id) return;
    expiredRefreshRef.current = activeFight.id;
    void refreshFight(activeFight.id).catch(() => { expiredRefreshRef.current = null; });
  }, [activeFight?.id, activeFight?.status, fightSecondsLeft, raidMode]);
  const fightTimerProgress = Math.max(0, Math.min(1, fightSecondsLeft / (fightDurationMs / 1000)));
  const timerColor = (() => {
    const red = Math.round(211 + (60 - 211) * fightTimerProgress);
    const green = Math.round(58 + (159 - 58) * fightTimerProgress);
    const blue = Math.round(50 + (66 - 50) * fightTimerProgress);
    return `rgb(${red}, ${green}, ${blue})`;
  })();
  const formatFightTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const raidBackButton = raidMode && onBackToEvents ? (
    <button type="button" onClick={onBackToEvents} className="absolute left-2 top-[44px] z-[50] flex min-h-10 items-center gap-1 bg-black/65 px-3 font-mono text-xs font-bold text-[#e6f7d4]">
      ← {lang === 'en' ? 'Back' : 'Назад'}
    </button>
  ) : null;
  const canShowPendingBossBox = !victorySummary
    && (!activeFight || activeFight.status !== 'dead' || claimedVictoryFightIdsRef.current.has(activeFight.id));

  if (loading) {
    return (
      <div className="relative flex h-full justify-center py-16">
        {raidBackButton}
        <Loader2 className="h-6 w-6 animate-spin text-[#ff9d20]" />
      </div>
    );
  }

  if (!activeFight && raidMode) {
    return <div className="relative flex h-full flex-col items-center justify-center gap-3 font-mono text-[#9dff43]">{raidBackButton}{attackError || 'LOADING RAID BOSS...'}{attackError && <button type="button" onClick={() => { setAttackError(''); void loadFight(); }}>RETRY</button>}</div>;
  }

  if ((!activeFight || activeFight.status !== 'active') && !raidMode) {
    return (
      <>
        <AnimatePresence>
          {victorySummary ? <BossVictoryModal bossId={victorySummary.bossId} bossName={victorySummary.bossName} leaderboard={victorySummary.leaderboard} language={profile?.language || 'uk'} bossKills={getBossKillCount(profile, victorySummary.bossId)} tutorialEnabled={Number(profile?.boss_kills || 0) === 0 && !profile?.first_boss_tutorial_seen && !profile?.starter_guide_final_claimed && !profile?.tutorial_level_eight_reward_claimed} onClaim={handleVictoryClaim} onOpenPlayerProfile={onOpenPlayerProfile} /> : null}
          {pendingBoxes[0] && canShowPendingBossBox && !suppressLootModal && (
            <LootBoxModal
              key={pendingBoxes[0].instanceId}
              instanceId={pendingBoxes[0].instanceId}
              boxType={pendingBoxes[0].boxType}
              boxName={pendingBoxes[0].displayName}
              bossId={pendingBoxes[0].bossId}
              fightId={pendingBoxes[0].fightId}
              queueIndex={pendingBoxes[0].queueIndex}
              totalBoxes={pendingBoxes[0].totalBoxes}
              lang={profile?.language || 'ua'}
              onClose={closePendingBox}
              onOpenBox={handleOpenBossBox}
            />
          )}
        </AnimatePresence>

        {secondBossWarning ? (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[390px] rounded-[18px] border-2 border-[#ffd21f] bg-[#151b10] p-4 text-center shadow-[0_0_28px_rgba(255,210,31,.35)]">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#ffd21f]">{tr.secondBossWarningTitle}</p>
              <img src={guideStopScared} alt="" aria-hidden="true" className="mx-auto -mb-1 h-48 w-48 object-contain" />
              <p className="mt-3 font-mono text-[12px] font-bold leading-relaxed text-[#f4ffd9]">{tr.secondBossWarningText}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <GameTextureButton type="button" tone="green" onClick={() => { setSecondBossWarning(null); onOpenClan?.(); }} className="h-11 px-1"><span className="relative z-10 whitespace-nowrap font-sans text-[9px] font-black uppercase text-[#172016]">{tr.findClan}</span></GameTextureButton>
                <GameTextureButton type="button" tone="gray" onClick={() => setSecondBossWarning(null)} className="h-11 px-1"><span className="relative z-10 font-sans text-[10px] font-black uppercase text-[#e7f0dc]">{lang === 'ru' ? 'УЙТИ' : lang === 'en' ? 'LEAVE' : 'ПІТИ ГЕТЬ'}</span></GameTextureButton>
                <GameTextureButton type="button" tone="green" onClick={confirmSecondBoss} className="h-11 px-1"><span className="relative z-10 font-sans text-[10px] font-black uppercase text-[#172016]">{"" + translateUiText("Я СПРАВЛЮСЬ") + ""}</span></GameTextureButton>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex h-full min-h-0 flex-col">
          {attackError ? <p role="alert" className="mb-2 px-2 text-center font-mono text-[10px] text-[#ff8978]">{attackError}</p> : null}
          <div className="flex items-center justify-between">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[#a18368]">{tr.chooseBoss}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex h-9 w-9 items-center justify-center bg-[#0c140a] text-[#b8f179] transition hover:bg-[#132010]"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingBottom: 'calc(112px + env(safe-area-inset-bottom, 0px))',
            }}
          >

            <div className="space-y-3">
              {GAME_CONFIG.BOSSES.map((boss) => {
                const isFirstBoss = boss.id === GAME_CONFIG.BOSSES[0]?.id;
                const bossIndex = GAME_CONFIG.BOSSES.findIndex((item) => item.id === boss.id);
                const comingSoon = bossIndex >= GAME_CONFIG.BOSSES.length - 3;
                const nextBoss = GAME_CONFIG.BOSSES[bossIndex + 1] || null;
                const nextKeyIcon = nextBoss ? BOSS_KEY_ICONS[nextBoss.id] : null;
                const keyCount = (profile?.keycards || {})[boss.keycardLocation] || 0;
                const hasKey = isFirstBoss || keyCount > 0;
                const locked = comingSoon || boss.minLevel > (profile?.level || 1);
                const cooldownLabel = `${lang === 'en' ? 'CD' : 'КД'} ${String(Math.floor(bossEscapeCooldownMs / 60000)).padStart(2, '0')}:${String(Math.floor((bossEscapeCooldownMs % 60000) / 1000)).padStart(2, '0')}`;
                const actionLocked = bossEscapeCooldownMs > 0 && !locked && hasKey;
                const bossPortrait = BOSS_PORTRAITS[boss.id] || BOSS_PHASE_IMGS.high;
                const keyIcon = BOSS_KEY_ICONS[boss.id];
                const chestIcon = LOCATION_CHEST_ICONS[boss.keycardLocation];
                const bossKills = getBossKillCount(profile, boss.id);
                const medalProgress = getBossMedalProgress(bossKills);
                const unlockedMedals = getUnlockedBossMedals(bossKills);
                const medalSet = BOSS_MEDAL_ASSETS[boss.id] || DEFAULT_MEDAL_ASSETS;
                const rewardPreview = getBossRewardPreview(boss.id);
                const lastWinner = lastBossWinners[boss.id];

                return (
                  <MarkerFrame
                    key={boss.id}
                    variant="transparent"
                    data-tutorial-target={isFirstBoss ? 'tutorial-first-boss' : undefined}
                    className=""
                    innerClassName="grid grid-cols-[84px_minmax(0,1fr)] gap-3 px-3 py-3 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-4 sm:px-4"
                  >
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#86a93b]/55 bg-[#120f0c] sm:h-[92px] sm:w-[92px]">
                          <img
                            src={bossPortrait}
                            alt={getLocalizedBossName(boss, lang)}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <GameTextureButton
                          type="button"
                          disabled={!hasKey || locked || actionLocked}
                          onClick={() => handleBossSelection(boss)}
                          className={`flex h-11 w-[84px] items-center justify-center sm:w-[92px] ${
                            !hasKey || locked || actionLocked ? 'opacity-50 grayscale' : 'hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                        >
                          <span className="relative z-[2] w-full px-2 text-center font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-[#1d2a10]">
                            {actionLocked ? cooldownLabel : comingSoon ? (lang === 'ru' ? 'СКОРО' : lang === 'en' ? 'COMING SOON' : 'СКОРО') : locked ? `${tr.level} ${boss.minLevel}` : !hasKey ? tr.noKey : isFirstBoss ? tr.free : tr.attack}
                          </span>
                        </GameTextureButton>
                      </div>

                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_88px] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)_96px] sm:gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[16px] font-bold text-[#f1ffe1] sm:text-[18px]">{getLocalizedBossName(boss, lang)}</p>
                          <p className="mt-1 font-mono text-[11px] text-[#d6e7bf]">
                            {bossKills}/{medalProgress.target} {medalProgress.label}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {(['bronze', 'silver', 'gold']).map((tier) => (
                              <img
                                key={tier}
                                src={medalSet[tier]}
                                alt={`${tier} medal`}
                                className={`h-[30px] w-[30px] object-contain sm:h-[34px] sm:w-[34px] ${
                                  unlockedMedals[tier] ? '' : 'grayscale opacity-45'
                                }`}
                              />
                            ))}
                          </div>
                          {comingSoon ? (
                            <p className="mt-2 font-mono text-[10px] text-[#a9c584]">{lang === 'ru' ? 'Скоро' : lang === 'en' ? 'Coming soon' : 'Незабаром'}</p>
                          ) : locked ? (
                            <p className="mt-2 font-mono text-[10px] text-[#a9c584]">Unlock at level {boss.minLevel}</p>
                          ) : null}

                          {keyIcon ? (
                            <div className="mt-2 flex items-center gap-2">
                              <BossKeyIcon rank={keyIcon} className="h-[28px] w-[28px] object-contain sm:h-[34px] sm:w-[34px]" />
                              <span className="font-mono text-[12px] font-bold text-[#f0f8de] sm:text-[13px]">
                                {isFirstBoss ? tr.free : `x${keyCount.toLocaleString()}`}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        <div className="min-w-0 pt-1">
                          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#86a93b]">{tr.rewardTitle}</p>
                          <div className="mt-2 space-y-1 font-mono text-[12px] text-[#f0f8de]">
                            <p className="flex items-center gap-1.5">
                              <img src={getResourceIcon('strength')} alt="CA" className="h-7 w-7 object-contain" />
                              <span className="inline-flex items-center gap-1">
                                <img src={getResourceIcon('strength')} alt="" aria-hidden="true" className="h-3.5 w-3.5 object-contain" />
                                <span>+{rewardPreview.strMin}{rewardPreview.strMax !== rewardPreview.strMin ? `-${rewardPreview.strMax}` : ''}</span>
                              </span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <img src={getResourceIcon('xp')} alt="EXP" className="h-7 w-7 object-contain" />
                              <span className="inline-flex items-center gap-1">
                                <img src={expUiIcon} alt="" aria-hidden="true" className="h-3.5 w-3.5 object-contain" />
                                <span>+{rewardPreview.xpMin}{rewardPreview.xpMax !== rewardPreview.xpMin ? `-${rewardPreview.xpMax}` : ''}</span>
                              </span>
                            </p>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            {chestIcon ? <img src={chestIcon} alt="Boss chest" className="h-[28px] w-[28px] object-contain sm:h-[34px] sm:w-[34px]" /> : null}
                            {nextKeyIcon ? <BossKeyIcon rank={nextKeyIcon} className="h-[28px] w-[28px] object-contain sm:h-[34px] sm:w-[34px]" /> : null}
                          </div>
                        </div>
                        <div className="self-center flex min-w-0 flex-col items-center pr-2 text-center">
                          <p className="font-mono text-[8px] font-black uppercase leading-tight text-[#c8d9b6]">{lang === 'ru' ? <>Последний<br />победитель</> : lang === 'en' ? <>Last<br />winner</> : <>Останній<br />переможець</>}</p>
                          {lastWinner ? (
                            <button type="button" onClick={() => onOpenPlayerProfile?.({ id: lastWinner.player_id, username: lastWinner.name, nickname: lastWinner.name, avatar: lastWinner.avatar })} className="mt-2 flex w-full flex-col items-center">
                              <span className="boss-last-winner-pulsar"><img src={lastWinner.avatar || heroIcon} alt={lastWinner.name} className="boss-last-winner-avatar h-14 w-14 rounded-[8px] border border-[#e7c34b] object-cover sm:h-16 sm:w-16" /></span>
                              <p className="mt-1 w-full truncate font-mono text-[8px] font-black uppercase text-[#fff0db]">{lastWinner.name}</p>
                            </button>
                          ) : <div className="boss-last-winner-unknown mt-2 flex h-14 w-14 items-center justify-center rounded-[8px] border border-[#526c42] bg-[#0c120b] font-mono text-[28px] font-black text-[#b6ce89] sm:h-16 sm:w-16">?</div>}
                        </div>
                      </div>
                      {locked && comingSoon ? (
                        <div className="pointer-events-none absolute inset-[3px] z-20 flex items-center justify-center bg-[#050805]/65 px-4 text-center backdrop-blur-[3px]">
                          <ScrambleLockHint text={lang === 'en' ? 'COMING SOON' : lang === 'ru' ? 'СКОРО ОТКРОЕТСЯ' : 'СКОРО ВІДКРИЄТЬСЯ'} />
                        </div>
                      ) : null}
                  </MarkerFrame>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <AssetStage
      blocking
      assetKey={`${raidMode ? 'raid' : 'boss'}:${activeFight?.boss_id || 'none'}:${bossImage}`}
      className={`h-full min-h-0 overflow-hidden px-0 pt-0 isolate ${androidScene ? 'boss-android-lite' : ''}`}
    >
      {androidScene && activeFight?.boss_id === 'tank' ? <img src={boss2BgBase} alt="" className="absolute inset-0 h-full w-full object-cover"/> : bossAssetsFailed ? <img src={bossBackground} alt="" className="absolute inset-0 h-full w-full object-cover"/> : useSceneVideo ? (
        <video
          src={bossImage}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : raidMode ? (
        <StableRaidBossBackground />
      ) : activeFight?.boss_id === 'heli' ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <img src={BOSS1_BACKGROUND_LAYERS.base} alt="" className="boss1-bg-layer" />
          <div className="boss1-window-clip">
            <img src={BOSS1_BACKGROUND_LAYERS.star} alt="" className="boss1-bg-layer boss1-bg-star" />
            <img src={BOSS1_BACKGROUND_LAYERS.meteors} alt="" className="boss1-bg-layer boss1-bg-meteors" />
          </div>
          <img src={BOSS1_BACKGROUND_LAYERS.blueMonitors} alt="" className="boss1-bg-layer boss1-bg-blue-monitors" />
          <img src={BOSS1_BACKGROUND_LAYERS.redMonitor} alt="" className="boss1-bg-layer boss1-bg-red-monitor" />
          <img src={BOSS1_BACKGROUND_LAYERS.redLights} alt="" className="boss1-bg-layer boss1-bg-red-lights" />
          <img src={BOSS1_BACKGROUND_LAYERS.topLight} alt="" className="boss1-bg-layer boss1-bg-top-light" />
        </div>
      ) : activeFight?.boss_id === 'tank' ? (
        <BossTwoBackground />
      ) : activeFight?.boss_id === 'chinook' ? (
        <ShorkBackground />
      ) : activeFight?.boss_id === 'boss4' ? (
        <WormBackground />
      ) : activeFight?.boss_id === 'boss5' ? (
        <SporgolBackground />
      ) : bossBackground ? (
        <img src={bossBackground} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-100" />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.58)_100%)]" />

      <div onErrorCapture={()=>setBossAssetsFailed(true)} className="relative z-[1] flex h-full min-h-0 flex-col overflow-hidden">
      <AnimatePresence>
        {killReward && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-2 top-2 z-[25] rounded-2xl border border-[#7d6218] bg-[#2b220e]/95 px-4 py-3 backdrop-blur-[2px]"
          >
            <p className="font-mono text-[14px] font-bold text-[#ffcf5e]">{"" + translateUiText("Боса знищено") + ""}</p>
            <p className="mt-1 font-mono text-[12px] text-[#ead7a9]">Rank #{killReward.rank} • {tr.rankReady}</p>
            {killReward.firstKillReward ? (
              <p className="mt-1 font-mono text-[11px] text-[#a8ff76]">
                {tr.firstKill} · {lang === 'ru' ? 'бонус в коробке' : lang === 'en' ? 'box bonus' : 'бонус у коробці'}: +{killReward.firstKillReward.strength} {tr.rewardStrength}
                {killReward.firstKillReward.tentacles ? ` • +${killReward.firstKillReward.tentacles} tentacles` : ''}
                {killReward.firstKillReward.nextKeyLocation ? ` • ${tr.nextKey}` : ''}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingBoxes[0] && canShowPendingBossBox && !suppressLootModal && (
          <LootBoxModal
            key={pendingBoxes[0].instanceId}
            instanceId={pendingBoxes[0].instanceId}
            boxType={pendingBoxes[0].boxType}
            boxName={pendingBoxes[0].displayName}
            bossId={pendingBoxes[0].bossId}
            fightId={pendingBoxes[0].fightId}
              queueIndex={pendingBoxes[0].queueIndex}
            totalBoxes={pendingBoxes[0].totalBoxes}
            lang={profile?.language || 'ua'}
            onClose={closePendingBox}
            onOpenBox={handleOpenBossBox}
          />
          )}
      </AnimatePresence>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {raidBackButton}
        <button
          type="button"
          onClick={handleRefresh}
          className="absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-[#162010]/88 text-[#dffd8b]"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <div className={`absolute inset-x-2 top-2 z-10 h-[30px] overflow-hidden rounded-[4px] border border-[#4b5045] bg-[#20251e] shadow-[inset_0_0_4px_rgba(0,0,0,0.7)] sm:h-[36px] ${statusInfoOpen ? 'invisible pointer-events-none' : ''}`}>
          <div
            className="absolute inset-[1px] origin-left transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.max(0, Math.min(1, fightTimerProgress)) * 100}%`, backgroundColor: timerColor, boxShadow: 'inset 0 1px rgba(239,255,206,.36), inset 0 -2px rgba(35,70,25,.35)' }}
          />
          <div className="absolute inset-0 z-[2] flex items-center justify-center px-3">
            <Clock className="mr-1 h-3 w-3" />
            <span className="font-sans text-[12px] font-black leading-none text-[#f8ffe8] [text-shadow:0_1px_0_rgba(0,0,0,0.9)] sm:text-[14px]">{formatFightTime(fightSecondsLeft)}</span>
          </div>
        </div>

        <p className={`pointer-events-none absolute inset-x-3 top-[46px] z-10 text-center font-mono text-[20px] font-bold leading-none text-[#eef7de] [text-shadow:0_2px_4px_#000] sm:top-[52px] sm:text-[24px] ${statusInfoOpen ? 'invisible' : ''}`}>
          {raidMode ? activeFight.boss_name : getFightBossName(activeFight)}
        </p>
        

        <div className="absolute inset-x-0 bottom-[calc(var(--bottom-nav-space,0px)+124px)] top-0 z-[2] flex items-end justify-center px-2 sm:px-3">
          <div className="absolute bottom-[-6px] left-1/2 z-0 h-[38px] w-[190px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(7,16,5,0.78)_0%,rgba(31,47,18,0.38)_48%,rgba(0,0,0,0)_74%)] blur-[1px] sm:w-[250px]" />
          {androidScene && activeFight?.boss_id === 'tank' ? <img src={mothStatic} alt="boss" className="relative h-[min(100%,405px)] w-auto max-w-full object-contain sm:max-h-[510px]"/> : bossAssetsFailed ? <img src={bossImage} alt="boss" className={`relative z-[1] ${bossSceneSizeClass} object-contain`}/> : useSceneVideo ? null : raidMode ? (
            <StableRaidBossComposite hitToken={bossHitToken} />
          ) : activeFight?.boss_id === 'heli' ? (
            <StableBossOneComposite hitToken={bossHitToken} />
          ) : activeFight?.boss_id === 'tank' ? (
            <StableBossTwoComposite hitToken={bossHitToken} />
          ) : activeFight?.boss_id === 'boss4' ? (
            <StableWormComposite />
          ) : activeFight?.boss_id === 'boss5' ? (
            <StableSporgolComposite />
          ) : activeFight?.boss_id === 'boss6' ? (
            <StableSuckholeComposite />
          ) : activeFight?.boss_id === 'chinook' ? (
            <StableShorkComposite hitToken={bossHitToken} />
          ) : (
            <motion.img
              src={bossImage}
              alt="boss"
              className={`relative z-[1] ${bossSceneSizeClass} object-contain drop-shadow-[0_28px_44px_rgba(0,0,0,0.5)]`}
              animate={hitEffect ? { x: [-8, 8, -5, 5, 0] } : undefined}
              transition={hitEffect ? { duration: 0.25 } : undefined}
            />
          )}

          <AnimatePresence>{hitEffect?.isCrit ? <CritCloud language={profile?.language || 'uk'} /> : null}</AnimatePresence>
        </div>

          {activeFight?.last_bleed_tick?.playerId === profile?.id && cooldownNow - Number(activeFight.last_bleed_tick.at) < 2000 && !document.hidden ? (
            <div key={activeFight.last_bleed_tick.at} className="pointer-events-none absolute left-1/2 top-[40%] z-[40] -translate-x-1/2" aria-hidden="true">
              <svg viewBox="0 0 120 120" className="boss-bleed-scratches absolute -left-14 -top-12 h-28 w-28 overflow-visible" fill="none">
                {['M82 12 L64 40 L55 45 L38 73 L19 98', 'M104 20 L84 46 L76 51 L58 80 L39 110', 'M115 43 L97 66 L89 69 L77 91 L65 116'].map((path, index) => (
                  <g key={path} style={{ animationDelay: (index * 0.06) + 's' }} className="boss-bleed-scratch">
                    <path d={path} pathLength="1" stroke="#28090c" strokeWidth="9" strokeLinecap="round" />
                    <path d={path} pathLength="1" stroke="#cf2133" strokeWidth="5" strokeLinecap="round" />
                    <path d={path} pathLength="1" stroke="#ff767c" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                ))}
              </svg>
              <span className="boss-bleed-damage absolute -left-6 -top-5 whitespace-nowrap font-mono text-sm font-black text-[#ff6874]">−{activeFight.last_bleed_tick.damage}</span>
            </div>
          ) : null}

        <AnimatePresence>
          {hitEffect && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 1 }}
              animate={{ opacity: [0, 1, 1, 1, 0], y: [0, -8, -16, -26, -42], scale: [1, 1.03, 1.03, 1.06, 1.1] }}
              transition={{ duration: 2.1, times: [0, 0.08, 0.62, 0.82, 1], ease: 'easeOut' }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-[32%] z-[40] -translate-x-1/2 whitespace-nowrap font-mono text-2xl font-black text-[#ffad4d] [text-shadow:0_2px_3px_#000,0_0_6px_#000]"
            >
              -{hitEffect.damage}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {clanAssistNotice ? (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              className="pointer-events-none absolute inset-x-6 top-20 z-20 mx-auto max-w-[300px] rounded-xl border border-[#7de0a2]/75 bg-[#112216]/92 px-3 py-2 text-center shadow-[0_8px_20px_rgba(0,0,0,0.32)] backdrop-blur-[2px]"
            >
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.09em] text-[#c9ffd7]">
                {tr.clanAssistBosses}: {clanAssistNotice.count}
              </p>
              {clanAssistNotice.damage > 0 ? (
                <p className="mt-0.5 font-mono text-[10px] text-[#d7f7dc]">{tr.clanAssistDamage}: +{clanAssistNotice.damage.toLocaleString()} {tr.damage}</p>
              ) : null}
              {clanAssistNotice.names.length ? (
                <p className="mt-0.5 truncate font-mono text-[10px] text-[#9de6af]">{clanAssistNotice.names.join(' · ')}</p>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => { setClanHelpStatus(''); setClanHelpOpen(true); }}
          disabled={!canCallClanHelp || sendingClanHelp}
          className={`absolute left-2 top-16 z-[30] flex h-12 w-12 items-center justify-center overflow-visible rounded-lg bg-black/35 drop-shadow-[0_2px_4px_rgba(0,0,0,.85)] transition-transform ${statusInfoOpen || clanHelpOpen || escapeConfirmOpen || leaderboardOpen || victorySummary || secondBossWarning ? 'invisible pointer-events-none' : ''} ${canCallClanHelp ? 'hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-40'}`}
          title={clanHelpAlreadySent ? tr.clanHelpAlreadySent : !fightStartedByPlayer ? tr.clanHelpOwnerOnly : tr.clanAssist}
          aria-label={clanHelpAlreadySent ? tr.clanHelpAlreadySent : !fightStartedByPlayer ? tr.clanHelpOwnerOnly : tr.clanAssist}
        >
          <img src={clanHelpIcon} alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </button>

        <button
          type="button"
          onClick={() => setEscapeConfirmOpen(true)}
          disabled={escaping || attacking}
          className={`absolute right-2 top-16 z-[30] flex h-12 w-20 items-center justify-center overflow-visible bg-transparent disabled:opacity-50 ${statusInfoOpen || clanHelpOpen || escapeConfirmOpen || leaderboardOpen || victorySummary || secondBossWarning ? 'invisible pointer-events-none' : ''}`}
          title={tr.escape}
          aria-label={tr.escape}
        >
          <img src={bossRunIcon} alt={tr.escape} className="h-full w-full scale-[1.7] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,.95)]" />
        </button>

        <div className="absolute inset-x-1 bottom-[var(--bottom-nav-space,0px)] z-[4] flex flex-col gap-2 sm:inset-x-2 sm:gap-3">
          <div className="shrink-0">
            <div className="mb-2 flex items-center">
              <button
                type="button"
                onClick={() => setLeaderboardOpen(true)}
                aria-label="Open damage leaderboard"
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden"
              >
                <img src={dmgBossIcon} alt="" aria-hidden="true" className="h-12 w-12 object-contain" />
              </button>
            </div>

            <div className="relative flex min-w-0 items-end justify-between gap-2">

              <div className="absolute left-1/2 bottom-0 flex -translate-x-1/2 items-end justify-center gap-2" aria-label="Boss effects">
                <button type="button" onClick={() => setStatusInfoOpen('marks')} title={tr.statusMarks} aria-label={tr.statusMarks} className="flex items-center gap-1 font-mono text-[12px] font-black text-[#e2ff9d]">
                  <img src={toxicMarkIcon} alt="" aria-hidden="true" className="h-9 w-9 rounded object-contain" />
                  <span className="rounded border border-[#b9ff68]/80 bg-[#253318] px-1.5 py-1 text-[11px] leading-none text-[#efffc7] shadow-[0_1px_3px_rgba(0,0,0,.9)]">{Number(currentCombatState.toxicMarks || 0)}/5</span>
                </button>
                <button type="button" onClick={() => setStatusInfoOpen('bleed')} title={tr.statusBleed} aria-label={tr.statusBleed} className="flex items-center gap-1 font-mono text-[12px] font-black text-[#ffd0c8]">
                  <img src={bloodStatusIcon} alt="" aria-hidden="true" className={`h-9 w-9 rounded object-contain ${Number(currentCombatState.bleed?.expiresAt || 0) > cooldownNow ? '' : 'opacity-55 grayscale'}`} />
                  {Number(currentCombatState.bleed?.expiresAt || 0) > cooldownNow ? `${Math.max(0, Math.ceil((Number(currentCombatState.bleed?.expiresAt || 0) - cooldownNow) / 1000))}s` : '—'}
                </button>
              </div>
              <div className="relative ml-auto flex shrink-0 flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPoisonMultiplier((value) => value === 1 ? 10 : value === 10 ? 100 : 1)}
                    aria-label={tr.poisonMultiplier}
                    aria-pressed={poisonMultiplier > 1}
                    title={`${tr.poisonMultiplier} · ×${poisonMultiplier}`}
                    className={`relative h-11 w-14 overflow-hidden rounded-md border transition ${poisonMultiplier > 1 ? 'border-[#ffe070] bg-[#4d3410] shadow-[0_0_14px_rgba(255,207,48,0.85)]' : 'border-[#58604c] bg-black/45 grayscale opacity-55'}`}
                  >
                    {poisonMultiplier > 1 ? <span className="absolute inset-[-50%] bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,220,0.65)_50%,transparent_65%)]" style={{ animation: 'boss-acid-shine 1.5s linear infinite' }} /> : null}
                    <img src={poisonMultiplier === 100 ? poisonX100Icon : poisonX10Icon} alt="" aria-hidden="true" className={`relative z-10 h-full w-full object-contain p-1 ${poisonMultiplier > 1 ? 'animate-pulse' : ''}`} />
                  </button>
                  <button type="button" onClick={() => setX10InfoOpen((value) => !value)} aria-label={tr.poisonMultiplier} className="flex h-4 w-4 items-center justify-center rounded-full border border-[#d8f8a6] bg-[#182114] text-[10px] font-black text-[#d8f8a6]">?</button>
                </div>
                {x10InfoOpen ? <div className="absolute right-0 top-9 z-30 w-52 rounded border border-[#d8f8a6] bg-[#10170d] p-2 font-mono text-[10px] leading-tight text-[#e9f4d2] shadow-xl">{tr.poisonMultiplier}</div> : null}
              </div>
            </div>

            {statusInfoOpen ? (() => {
              const state = currentCombatState;
              const marks = Math.min(5, Math.max(0, Number(state.toxicMarks || 0)));
              const bleed = state.bleed;
              const bleedActive = Number(bleed?.expiresAt || 0) > cooldownNow;
              const seconds = bleedActive ? Math.max(0, Math.ceil((Number(bleed.expiresAt) - cooldownNow) / 1000)) : 0;
              const levels = getTalentLevels(profile);
              const L = (id) => Math.max(0, Number(levels[id] || 0));
              const poisonStocks = {
                small: getWeaponStock(profile, { id: 'satchel' }) || 0,
                medium: getWeaponStock(profile, { id: 'f4' }) || 0,
                large: getWeaponStock(profile, { id: 'c4' }) || 0,
              };
              const hasPoison = poisonStocks.small > 0 || poisonStocks.medium > 0 || poisonStocks.large > 0;
              const availablePoisonIcon = poisonStocks.medium > 0 ? mediumPoisonIcon : poisonStocks.small > 0 ? smallPoisonIcon : largePoisonIcon;
              const poisonInventoryText = [
                [poisonStocks.small, lang === 'en' ? 'Small' : lang === 'ru' ? 'Малый' : 'Мала'],
                [poisonStocks.medium, lang === 'en' ? 'Medium' : lang === 'ru' ? 'Средний' : 'Середня'],
                [poisonStocks.large, lang === 'en' ? 'Large' : lang === 'ru' ? 'Большой' : 'Велика'],
              ].filter(([count]) => count > 0).map(([count, name]) => `${name} ×${count}`).join(' · ');
              const expectedBleedDamage = 5 + L('t07') * 3 + L('t22') * 3 + L('t51') * 8 + (marks >= 3 ? L('t27') * 5 : 0);
              const expectedBleedDuration = 6 + L('t23');
              const talentNames = {
                t07: lang === 'en' ? 'Bleed +3/sec' : lang === 'ru' ? 'Кровотечение +3/сек' : 'Кровотеча +3/с',
                t15: lang === 'en' ? 'Finger at 3 marks' : lang === 'ru' ? 'Палец при 3 метках' : 'Палець за 3 міток',
                t17: lang === 'en' ? 'Finger at 5 marks' : lang === 'ru' ? 'Палец при 5 метках' : 'Палець за 5 міток',
                t18: lang === 'en' ? 'Finger vs bleeding boss' : lang === 'ru' ? 'Палец по кровоточащему боссу' : 'Палець по босу з кровотечею',
                t22: lang === 'en' ? 'Bleed +3/sec' : lang === 'ru' ? 'Кровотечение +3/сек' : 'Кровотеча +3/с',
                t23: lang === 'en' ? 'Bleed duration +1 sec' : lang === 'ru' ? 'Длительность +1 сек' : 'Тривалість +1 с',
                t24: lang === 'en' ? 'Pencil vs bleeding boss' : lang === 'ru' ? 'Карандаш по кровоточащему боссу' : 'Олівець по босу з кровотечею',
                t26: lang === 'en' ? 'Pencil with marks' : lang === 'ru' ? 'Карандаш с метками' : 'Олівець із мітками',
                t27: lang === 'en' ? 'Bleed at 3 marks' : lang === 'ru' ? 'Кровотечение при 3 метках' : 'Кровотеча за 3 міток',
                t30: lang === 'en' ? 'Pencil at 3 marks' : lang === 'ru' ? 'Карандаш при 3 метках' : 'Олівець за 3 міток',
                t35: lang === 'en' ? 'Small Poison +3 damage' : lang === 'ru' ? 'Малый яд +3 урона' : 'Мала отрута +3 шкоди',
                t36: lang === 'en' ? 'Poison per mark' : lang === 'ru' ? 'Яд за каждую метку' : 'Отрута за кожну мітку',
                t37: lang === 'en' ? 'Medium Poison +5 damage' : lang === 'ru' ? 'Средний яд +5 урона' : 'Середня отрута +5 шкоди',
                t38: lang === 'en' ? 'Large Poison at 5 marks' : lang === 'ru' ? 'Большой яд при 5 метках' : 'Велика отрута за 5 міток',
                t40: lang === 'en' ? 'Large Poison at 5 marks' : lang === 'ru' ? 'Большой яд при 5 метках' : 'Велика отрута за 5 міток',
                t42: lang === 'en' ? 'Poison vs bleeding boss' : lang === 'ru' ? 'Яд по кровоточащему боссу' : 'Отрута по босу з кровотечею',
                t51: lang === 'en' ? 'Bleed +8/sec' : lang === 'ru' ? 'Кровотечение +8/сек' : 'Кровотеча +8/с',
                t53: lang === 'en' ? 'Large Poison at 5 marks' : lang === 'ru' ? 'Большой яд при 5 метках' : 'Велика отрута за 5 міток',
                t54: lang === 'en' ? 'Pencil at 3 marks' : lang === 'ru' ? 'Карандаш при 3 метках' : 'Олівець за 3 міток',
                t59: lang === 'en' ? 'Poison at 3 marks' : lang === 'ru' ? 'Яд при 3 метках' : 'Отрута за 3 міток',
                t60: lang === 'en' ? 'All attacks: bleed + 5 marks' : lang === 'ru' ? 'Все атаки: кровотечение + 5 меток' : 'Усі атаки: кровотеча + 5 міток',
              };
              const talentProgress = (ids) => {
                const learned = ids.filter((id) => L(id) > 0);
                if (!learned.length) return lang === 'en' ? 'No related talents upgraded yet' : lang === 'ru' ? 'Связанные таланты ещё не улучшены' : 'Пов’язані таланти ще не покращені';
                return learned.map((id) => `${talentNames[id] || (lang === 'en' ? 'Talent' : lang === 'ru' ? 'Талант' : 'Талант')} ${L(id)}/10`).join(' · ');
              };
              const rows = [
                { left: toxicMarkIcon, right: slapIcon, kind: 'marks', ready: marks >= 3, text: lang === 'en' ? `Finger gets +${L('t15') * 10} damage at 3 marks and +${L('t17') * 15} at 5.` : lang === 'ru' ? `Палец наносит на ${L('t15') * 10} больше при 3 метках и на ${L('t17') * 15} при 5.` : `Палець завдає на ${L('t15') * 10} більше, коли є 3 мітки, і на ${L('t17') * 15} за 5.`, talents: ['t15', 't17'] },
                { left: bloodStatusIcon, right: slapIcon, kind: 'bleed', ready: bleedActive, text: lang === 'en' ? `While the boss bleeds, Finger deals +${L('t18') * 8} damage.` : lang === 'ru' ? `Пока босс кровоточит, Палец наносит на ${L('t18') * 8} больше урона.` : `Поки бос кровоточить, Палець завдає на ${L('t18') * 8} більше шкоди.`, talents: ['t18'] },
                { left: toxicMarkIcon, right: forkStrikeIcon, kind: 'marks', ready: marks >= 1, text: lang === 'en' ? `Pencil deals +${L('t26') * 6} with a mark and +${L('t30') * 15 + L('t54') * 20} at 3 marks.` : lang === 'ru' ? `Карандаш наносит на ${L('t26') * 6} больше с меткой и на ${L('t30') * 15 + L('t54') * 20} при 3 метках.` : `Олівець завдає на ${L('t26') * 6} більше з міткою і на ${L('t30') * 15 + L('t54') * 20}, коли є 3 мітки.`, talents: ['t26', 't30', 't54'] },
                { left: bloodStatusIcon, right: forkStrikeIcon, kind: 'bleed', ready: bleedActive || marks >= 3, text: lang === 'en' ? `Pencil deals +${L('t24') * 8} while bleeding; 3 marks add +${L('t27') * 5} bleed damage/sec.` : lang === 'ru' ? `Карандаш наносит на ${L('t24') * 8} больше при кровотечении; 3 метки добавляют кровотечению ${L('t27') * 5} урона/сек.` : `Олівець завдає на ${L('t24') * 8} більше під час кровотечі; 3 мітки додають кровотечі ${L('t27') * 5} шкоди/с.`, talents: ['t24', 't27'] },
                { left: toxicMarkIcon, right: availablePoisonIcon, stockLabel: poisonInventoryText, kind: 'marks', ready: hasPoison && marks >= 1, text: lang === 'en' ? `Each mark adds +${3 * L('t36')} to Poison; 3 marks add another +${L('t59') * 15}.` : lang === 'ru' ? `Каждая метка добавляет яду +${3 * L('t36')} урона; 3 метки добавляют ещё +${L('t59') * 15}.` : `Кожна мітка додає отруті +${3 * L('t36')} шкоди; 3 мітки додають ще +${L('t59') * 15}.`, talents: ['t36', 't59'] },
                { left: smallPoisonIcon, output: toxicMarkIcon, stockLabel: poisonStocks.small > 0 ? `×${poisonStocks.small}` : '', reason: marks >= 5 ? tr.statusNeedMarkSpace : '', kind: 'marks', ready: poisonStocks.small > 0 && marks < 5, text: lang === 'en' ? `Small Poison applies 1 mark and deals +${L('t35') * 3} damage.` : lang === 'ru' ? `Малый яд накладывает 1 метку и наносит на ${L('t35') * 3} больше урона.` : `Мала отрута накладає 1 мітку та завдає на ${L('t35') * 3} більше шкоди.`, talents: ['t35'] },
                { left: mediumPoisonIcon, output: toxicMarkIcon, stockLabel: poisonStocks.medium > 0 ? `×${poisonStocks.medium}` : '', reason: marks >= 5 ? tr.statusNeedMarkSpace : '', kind: 'marks', ready: poisonStocks.medium > 0 && marks < 5, text: lang === 'en' ? `Medium Poison applies 1 mark and deals +${L('t37') * 5} damage.` : lang === 'ru' ? `Средний яд накладывает 1 метку и наносит на ${L('t37') * 5} больше урона.` : `Середня отрута накладає 1 мітку та завдає на ${L('t37') * 5} більше шкоди.`, talents: ['t37'] },
                { left: bloodStatusIcon, right: availablePoisonIcon, stockLabel: poisonInventoryText, kind: 'bleed', ready: hasPoison && bleedActive, text: lang === 'en' ? `Any Poison deals +${L('t42') * 8} damage while the boss bleeds.` : lang === 'ru' ? `Любой яд наносит на ${L('t42') * 8} больше урона, пока босс кровоточит.` : `Будь-яка отрута завдає на ${L('t42') * 8} більше шкоди, поки бос кровоточить.`, talents: ['t42'] },
                { left: toxicMarkIcon, right: bloodStatusIcon, reason: !bleedActive ? tr.statusNeedBleed : marks < 5 ? (lang === 'en' ? 'Needs 5 marks' : lang === 'ru' ? 'Сначала накопи 5 меток' : 'Спершу накопи 5 міток') : '', kind: 'both', ready: bleedActive && marks >= 5, text: lang === 'en' ? `With 5 marks and active bleed, all attacks get +${L('t60') * 20} damage.` : lang === 'ru' ? `С 5 метками и активным кровотечением все атаки получают +${L('t60') * 20} урона.` : `За 5 міток та активної кровотечі всі атаки отримують +${L('t60') * 20} шкоди.`, talents: ['t60'] },
                { left: toxicMarkIcon, right: largePoisonIcon, stockLabel: poisonStocks.large > 0 ? `×${poisonStocks.large}` : '', kind: 'marks', ready: marks >= 5 && poisonStocks.large > 0, text: lang === 'en' ? `At 5 marks, Large Poison gets +${L('t38') * 60 + L('t40') * 80 + L('t53') * 75} damage and uses all marks.` : lang === 'ru' ? `При 5 метках Большой яд получает +${L('t38') * 60 + L('t40') * 80 + L('t53') * 75} урона и тратит их все.` : `За 5 міток Велика отрута отримує +${L('t38') * 60 + L('t40') * 80 + L('t53') * 75} шкоди та витрачає їх усі.`, talents: ['t38', 't40', 't53'] },
              ].filter((row) => statusInfoOpen === 'all' || row.kind === statusInfoOpen || row.kind === 'both');
              const comboRows = rows;
              const comboNames = lang === 'en'
                ? ['Finger', 'Pencil', 'Toxic marks', 'Small Poison', 'Medium Poison', 'Bleed', 'Large Poison']
                : lang === 'ru'
                  ? ['Палец', 'Карандаш', 'Ядовитые метки', 'Малый яд', 'Средний яд', 'Кровотечение', 'Большой яд']
                  : ['Палець', 'Олівець', 'Отруйні мітки', 'Мала отрута', 'Середня отрута', 'Кровотеча', 'Велика отрута'];
              const comboSummaries = lang === 'en'
                ? ['Bonus damage at 3 and 5 marks', 'Bonus damage for each mark', 'Each mark increases poison damage', 'Applies 1 mark and strengthens poison', 'Applies 1 mark and strengthens poison', 'At 5 marks, boosts all attacks', 'At 5 marks, bonus damage and consumes marks']
                : lang === 'ru'
                  ? ['Бонусный урон при 3 и 5 метках', 'Бонусный урон за каждую метку', 'Каждая метка усиливает урон яда', 'Накладывает 1 метку и усиливает яд', 'Накладывает 1 метку и усиливает яд', 'При 5 метках усиливает все атаки', 'При 5 метках наносит бонусный урон и снимает метки']
                  : ['Бонусна шкода за 3 та 5 міток', 'Бонусна шкода за кожну мітку', 'Кожна мітка підсилює шкоду отрути', 'Накладає 1 мітку й підсилює отруту', 'Накладає 1 мітку й підсилює отруту', 'За 5 міток підсилює всі атаки', 'За 5 міток завдає бонусної шкоди й знімає мітки'];
              const comboBonuses = [L('t15') * 10 + L('t17') * 15, L('t26') * 6 + L('t30') * 15 + L('t54') * 20, L('t36') * 3 + L('t59') * 15, L('t35') * 3, L('t37') * 5, L('t60') * 20, L('t38') * 60 + L('t40') * 80 + L('t53') * 75];
              const comboIcons = [slapIcon, forkStrikeIcon, toxicMarkIcon, smallPoisonIcon, mediumPoisonIcon, bloodStatusIcon, largePoisonIcon];
              const comboHasTalent = comboRows.map((row) => row.talents.some((id) => L(id) > 0));
              const howMarksWork = lang === 'en'
                ? ['Apply marks with Small or Medium Poison.', 'Build up to 5 marks; each one can strengthen combos.', 'Trigger an attack to use its bonus.']
                : lang === 'ru'
                  ? ['Накладывай метки Малой или Средней отравой.', 'Накопи до 5 меток: каждая усиливает комбо.', 'Атакуй, чтобы сработал бонус комбо.']
                  : ['Накладай мітки Малою або Середньою отрутою.', 'Накопичуй до 5 міток: кожна підсилює комбо.', 'Атакуй, щоб спрацював бонус комбо.'];
              return createPortal(<div className="fixed inset-0 z-[99999] flex min-h-0 items-center justify-center overflow-hidden bg-black/80 p-3 backdrop-blur-[2px]" onClick={() => setStatusInfoOpen(false)} style={{ touchAction: 'none' }}>
                <section role="dialog" aria-modal="true" aria-label={tr.statusTitle} onClick={(event) => event.stopPropagation()} className="max-h-[88dvh] min-h-0 w-full max-w-[440px] touch-pan-y overflow-x-hidden overflow-y-scroll overscroll-y-contain rounded-2xl border-2 border-[#38e88e] bg-[#10170f] p-4 text-[#eaf5d8] shadow-[0_0_30px_rgba(56,232,142,.2)]" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}>
                  <header className="mb-3 flex items-center justify-between gap-2"><h2 className="font-sans text-base font-black uppercase">{statusInfoOpen === 'bleed' ? tr.statusBleed : statusInfoOpen === 'marks' ? `⚡ ${lang === 'en' ? 'COMBO ATTACKS' : lang === 'ru' ? 'КОМБО-АТАКИ' : 'КОМБО-АТАКИ'}` : tr.statusTitle}</h2><button type="button" onClick={() => { setStatusInfoOpen(null); setSelectedComboIndex(null); }} aria-label={tr.statusClose} className="rounded p-1 text-[#73f2ae]"><X className="h-5 w-5" /></button></header>
                  {statusInfoOpen === 'marks' ? <>
                    <div className="mb-3 rounded-lg bg-black/25 p-3">
                      <div className="flex items-center gap-2"><img src={toxicMarkIcon} alt="" className="h-9 w-9 object-contain"/><div className="min-w-0 flex-1"><h3 className="text-xs font-black uppercase text-[#dfffaa]">{lang === 'en' ? 'Toxic marks' : lang === 'ru' ? 'Ядовитые метки' : 'Отруйні мітки'}</h3><p className="text-[10px] font-bold text-[#f5f1dc]">{marks}/5 {tr.statusMarksTrigger}</p></div></div>
                      <p className="mt-2 text-[10px] leading-snug text-[#c4d2b5]">{lang === 'en' ? 'Apply poison marks to strengthen attacks. The more marks, the stronger the combo.' : lang === 'ru' ? 'Накладывай метки ядом и усиливай атаки. Чем больше меток, тем мощнее комбо.' : 'Накладай мітки отрутою та підсилюй атаки. Що більше міток, то потужніше комбо.'}</p>
                      <p className="mt-1 text-[9px] text-[#aab99a]">{tr.statusComboHelp}</p>
                      <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-[9px] leading-snug text-[#aab99a]"><p className="font-black uppercase text-[#b9ff68]">{lang === 'en' ? 'How marks work' : lang === 'ru' ? 'Как работают метки' : 'Як працюють мітки'}</p>{howMarksWork.map((step, index) => <p key={step}><b className="mr-1 text-[#b9ff68]">{index + 1}.</b>{step}</p>)}</div>
                    </div>
                    <div className="mb-2 flex items-center justify-between"><h3 className="text-[11px] font-black uppercase tracking-wide text-[#b9ff68]">{lang === 'en' ? 'Combos and bonuses' : lang === 'ru' ? 'Комбо и бонусы' : 'Комбо та бонуси'}</h3><span className="text-[9px] font-bold text-[#aab99a]">7 {lang === 'en' ? 'combos' : lang === 'ru' ? 'комбо' : 'комбо'}</span></div>
                    <div className="space-y-1.5">
                      {comboRows.map((row, index) => <div key={index} className={`overflow-hidden rounded-lg border border-white/10 ${row.ready && comboHasTalent[index] ? 'bg-[#293b1d]' : 'bg-black/20'}`}>
                        <button type="button" onClick={() => setSelectedComboIndex((value) => value === index ? null : index)} aria-expanded={selectedComboIndex === index} className="flex w-full items-center gap-2 px-2 py-1.5 text-left">
                          <img src={comboIcons[index]} alt="" className="h-7 w-7 shrink-0 object-contain" />
                          <span className="min-w-0 flex-1"><b className="block text-[10px] uppercase text-[#eaf5d8]">{comboNames[index]}</b><span className="block text-[9px] leading-snug text-[#c4d2b5]">{comboSummaries[index]}</span></span>
                          <span className="shrink-0 text-[9px] font-black text-[#b9ff68]">{comboHasTalent[index] ? `+${comboBonuses[index]} ${lang === 'en' ? 'damage' : lang === 'ru' ? 'урона' : 'шкоди'}` : (lang === 'en' ? 'Not unlocked' : lang === 'ru' ? 'Не открыто' : 'Не відкрито')}</span>
                          {row.ready && comboHasTalent[index] ? <span className="shrink-0 rounded bg-[#b9ff68] px-1 py-0.5 text-[8px] font-black text-[#18220e]">{tr.statusAvailable}</span> : null}
                        </button>
                        {selectedComboIndex === index ? <div className="border-t border-white/10 px-2 py-1.5 text-[9px] leading-snug text-[#aab99a]"><p className="text-[#eaf5d8]">{row.text}</p><p className="mt-1">{tr.statusProgress}: {talentProgress(row.talents)}{row.reason ? ` · ${row.reason}` : ''}</p></div> : null}
                      </div>)}
                    </div>
                  </> : null}
                  {statusInfoOpen === 'bleed' ? <>
                    <div className="mb-3 rounded-lg bg-black/25 p-3">
                      <div className="flex items-center gap-2"><img src={bloodStatusIcon} alt="" className="h-9 w-9 object-contain"/><div><h3 className="text-xs font-black uppercase text-[#ffd0c8]">{tr.statusBleed}</h3><p className="text-sm font-black text-[#f5f1dc]">{bleedActive ? Number(bleed.damage || 0) : expectedBleedDamage} {tr.statusPerSecond} · {bleedActive ? seconds : expectedBleedDuration} {lang === 'en' ? 'sec' : lang === 'ru' ? 'сек.' : 'с'}</p></div></div>
                      <p className="mt-2 text-[10px] leading-snug text-[#c4d2b5]">{lang === 'en' ? 'The boss loses health every second. Reapplying bleed increases its damage.' : lang === 'ru' ? 'Босс теряет здоровье каждую секунду. Повторное наложение усиливает кровотечение.' : 'Бос втрачає здоров’я щосекунди. Повторне накладання підсилює кровотечу.'}</p>
                      <p className="mt-1 text-[9px] text-[#aab99a]">{lang === 'en' ? 'Damage scales with talents and marks.' : lang === 'ru' ? 'Урон растёт от талантов и меток.' : 'Шкода зростає від талантів і міток.'}</p>
                    </div>
                    <div className="mb-2 flex items-center justify-between"><h3 className="text-[11px] font-black uppercase tracking-wide text-[#b9ff68]">{lang === 'en' ? 'Bleed boosts' : lang === 'ru' ? 'Усиления кровотечения' : 'Підсилення кровотечі'}</h3><span className="text-[9px] font-bold text-[#aab99a]">4 {lang === 'en' ? 'combos' : lang === 'ru' ? 'комбо' : 'комбо'}</span></div>
                    <div className="space-y-1.5">{rows.map((row, index) => {
                      const names = lang === 'en' ? ['Finger', 'Pencil', 'Poison', 'All attacks'] : lang === 'ru' ? ['Палец', 'Карандаш', 'Яд', 'Все атаки'] : ['Палець', 'Олівець', 'Отрута', 'Усі атаки'];
                      const summaries = lang === 'en' ? ['Bonus damage against a bleeding boss', 'Bonus damage and longer bleed at 3 marks', 'Bonus damage while bleed is active', 'Bonus damage at 5 marks while bleeding'] : lang === 'ru' ? ['Дополнительный урон по кровоточащему боссу', 'Бонусный урон и продление кровотечения при 3 метках', 'Дополнительный урон, пока действует кровотечение', 'Бонусный урон при 5 метках и кровотечении'] : ['Додаткова шкода по босу з кровотечею', 'Бонусна шкода й довша кровотеча за 3 міток', 'Додаткова шкода, поки діє кровотеча', 'Бонусна шкода за 5 міток і кровотечі'];
                      const icons = [slapIcon, forkStrikeIcon, availablePoisonIcon, toxicMarkIcon];
                      return <div key={index} className={`flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 ${row.ready ? 'bg-[#293b1d]' : 'bg-black/20'}`}><img src={icons[index]} alt="" className="h-7 w-7 shrink-0 object-contain"/><div className="min-w-0 flex-1"><b className="block text-[10px] uppercase">{names[index]}</b><p className="text-[9px] leading-snug text-[#c4d2b5]">{summaries[index]}</p><p className="mt-0.5 text-[9px] leading-snug text-[#91a586]">{row.text}</p></div>{row.ready ? <span className="shrink-0 rounded bg-[#b9ff68] px-1 py-0.5 text-[8px] font-black text-[#18220e]">{tr.statusAvailable}</span> : null}</div>;
                    })}</div>
                  </> : null}
                  <div className={`grid gap-2 ${statusInfoOpen === 'all' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {statusInfoOpen !== 'marks' && statusInfoOpen !== 'bleed' ? <div className="rounded-xl bg-black/25 p-2"><div className="flex items-center gap-2"><img src={bloodStatusIcon} alt="" className={`h-8 w-8 object-contain ${bleedActive ? '' : 'opacity-55 grayscale'}`} /><b className="text-xs">{tr.statusBleed}</b></div><p className="mt-1 text-xs font-bold text-[#ffd0c8]">{bleedActive ? `${Number(bleed.damage || 0)} ${tr.statusPerSecond} · ${seconds}s ${tr.statusRemaining}` : `${expectedBleedDamage} ${tr.statusPerSecond} · ${expectedBleedDuration}s (${tr.statusNextBleed})`}</p><p className="mt-1 text-[11px] leading-snug text-[#c4d2b5]">{tr.statusBleedHelp}</p><p className="mt-1 text-[10px] leading-snug text-[#91a586]">{tr.statusProgress}: {talentProgress(['t07', 't22', 't23', 't27', 't51'])}</p></div> : null}
                    {statusInfoOpen !== 'bleed' && statusInfoOpen !== 'marks' ? <div className="rounded-xl bg-black/25 p-2"><div className="flex items-center gap-2"><img src={toxicMarkIcon} alt="" className="h-12 w-12 shrink-0 object-contain"/><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><b className="text-xs">{tr.statusMarks}</b><span className="shrink-0 rounded-md border border-[#b9ff68]/70 bg-[#253318] px-2 py-1 text-sm font-black leading-none text-[#eaffb5]">{marks}/5</span></div></div></div><p className="mt-1 text-[11px] leading-snug text-[#c4d2b5]">{tr.statusMarksHelp}</p></div> : null}
                  </div>
                  {statusInfoOpen !== 'marks' && statusInfoOpen !== 'bleed' ? <h3 className="mb-1 mt-3 text-[11px] font-black uppercase tracking-wide text-[#b9ff68]">{tr.statusCombo}</h3> : null}
                  {statusInfoOpen !== 'marks' && statusInfoOpen !== 'bleed' ? <p className="mb-2 text-[10px] leading-snug text-[#aab99a]">{tr.statusComboHelp}</p> : null}
                  {statusInfoOpen !== 'marks' && statusInfoOpen !== 'bleed' ? <div className="space-y-1.5">
                    {rows.map((row, index) => <div key={index} className={`flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1 ${row.ready ? 'bg-[#293b1d] shadow-[inset_0_0_14px_rgba(185,255,104,.12)]' : 'bg-black/20'}`}><img src={row.left} alt="" className="h-6 w-6 object-contain"/>{row.output ? <><span className="text-xs font-black text-[#b9ff68]">→</span><img src={row.output} alt="" className="h-6 w-6 object-contain"/></> : <><span className="text-xs font-black text-[#b9ff68]">+</span><img src={row.right} alt="" className="h-6 w-6 object-contain"/><span className="text-xs font-black text-[#b9ff68]">=</span></>}<div className="min-w-0 flex-1"><p className="text-[11px] leading-snug text-[#eaf5d8]">{row.text}</p><p className="mt-0.5 text-[9px] leading-snug text-[#91a586]">{tr.statusProgress}: {talentProgress(row.talents)}{row.stockLabel ? ` · ${row.stockLabel}` : ''}{row.reason ? ` · ${row.reason}` : ''}</p></div>{row.ready ? <span className="shrink-0 rounded bg-[#b9ff68] px-1 py-0.5 text-[8px] font-black text-[#18220e]">{tr.statusAvailable}</span> : null}</div>)}
                  </div> : null}
                  <button type="button" onClick={() => { setStatusInfoOpen(null); setSelectedComboIndex(null); }} className="mt-3 h-10 w-full rounded-lg border border-[#b9ff68] bg-[#182318] text-xs font-black uppercase text-[#dfffaa]">{tr.statusClose}</button>
                </section>
              </div>, document.body);
            })() : null}

            <div data-tutorial-boss-hp="true" className="relative mt-2 h-[30px] w-full overflow-hidden rounded-[4px] border border-[#4b5045] bg-[#20251e] shadow-[inset_0_0_4px_rgba(0,0,0,0.7)] sm:mt-2.5 sm:h-[36px]">
              <div
                className="absolute inset-[1px] origin-left overflow-hidden rounded-[6px]"
                style={{
                  transform: `scaleX(${Math.max(0, Math.min(100, hpPct)) / 100})`,
                }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,#ff8877_0%,#d93e35_45%,#7a1515_100%)] shadow-[inset_0_1px_rgba(255,239,206,0.36),inset_0_-2px_rgba(83,0,0,0.45)]" />
                <div
                  className="absolute inset-y-0 left-[-18%] w-[30%] bg-[linear-gradient(90deg,transparent_0%,rgba(238,255,190,0.12)_40%,rgba(222,255,150,0.28)_55%,rgba(238,255,190,0.12)_70%,transparent_100%)]"
                  style={{ animation: 'boss-acid-shine 2.6s ease-in-out infinite' }}
                />
              </div>
              <div className="absolute inset-0 z-[2] flex items-center justify-center px-3">
                <span className="font-sans text-[12px] font-black leading-none text-[#f8ffe8] [text-shadow:0_1px_0_rgba(0,0,0,0.9)] sm:text-[14px]">
                  {(activeFight.current_hp || 0).toLocaleString()} / {(activeFight.max_hp || 0).toLocaleString()} HP
                </span>
              </div>
            </div>
            <TalentProgressTrack profile={profile} />
          </div>

          {attackError ? <p role="alert" className="px-2 text-center font-mono text-[10px] text-[#ff8978]">{attackError}</p> : null}
          <div className="grid min-w-0 grid-cols-5 gap-0.5 rounded-[14px] bg-black/22 p-1 backdrop-blur-[1px] sm:gap-1">
            {GAME_CONFIG.WEAPONS.map((baseWeapon) => {
              const weapon = buildEffectiveWeapon(baseWeapon, profile);
              const combatStateKey = raidMode ? 'raid:' + (activeFight?.id || 'active') : activeFight?.id;
              const damagePreview = Number(profile?.talent_tree_version || 0) >= 2
                ? resolveTalentAttack({weapon, levels: profile?.talent_levels || {}, state: profile?.talent_combat_state?.[combatStateKey] || {}, fight: activeFight, now: cooldownNow, random: () => 1}).damage
                : weapon.damage;
              const displayedDamage = Math.max(1, Math.floor(damagePreview * getCollectionDamageBonus(profile) * (1 + Number(weapon.equipmentBossDamagePct || 0))));
              const cdLeft = getWeaponCdLeft(weapon);
              const onCd = cdLeft > 0;
              const stock = getWeaponStock(profile, weapon);
              const hasStoredWeapon = stock !== null && stock > 0;
              const canAffordTentacles = weapon.costType === 'tentacles' && (profile?.tentacles || 0) >= weapon.cost;
              const canAffordPremium = weapon.costType === 'premium' && (profile?.premium || 0) >= weapon.cost;
              const poisonWeapon = isPoisonWeapon(weapon);
              const isFree = weapon.costType === 'free';
              const canPayCost = isFree || canAffordTentacles || canAffordPremium;
              const hasEnoughPoison = !poisonWeapon || poisonMultiplier === 1 || stock >= poisonMultiplier;
              const canUse = (poisonWeapon ? hasStoredWeapon : (hasStoredWeapon || canPayCost)) && hasEnoughPoison && !onCd && !attacking;
              const visualMuted = !canUse && !onCd;

              return (
                <button
                  key={weapon.id}
                  type="button"
                  data-tutorial-target={weapon.id === 'fist' ? 'tutorial-boss-finger' : weapon.id === 'knuckle' ? 'tutorial-boss-pencil' : weapon.id === 'c4' ? 'tutorial-boss-poison' : undefined}
                  disabled={!canUse}
                  onClick={() => handleAttack(weapon)}
                  className={`relative flex min-h-[clamp(52px,14vw,62px)] w-full min-w-0 flex-col items-center justify-center px-0 py-0 text-center sm:min-h-[78px] ${
                    visualMuted ? 'grayscale' : ''
                  }`}
                >
                  <WeaponIcon weapon={{...weapon, damage: displayedDamage}} cooldownLeft={cdLeft} stock={stock} muted={visualMuted} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {leaderboardOpen ? createPortal(
          <div
            className="game-app leaderboard-page fixed inset-0 z-[110] bg-[#070b07]"
            style={{ paddingTop: 'var(--app-safe-top, 0px)', paddingBottom: 'var(--app-safe-bottom, 0px)' }}
          >
            <div className="leaderboard-panel relative mx-auto flex h-full min-h-0 w-full max-w-[520px] flex-col overflow-hidden p-2 sm:p-3">
              
              <div className="leaderboard-tabs mb-2 grid h-10 w-full shrink-0 grid-cols-[64px_minmax(0,1fr)_64px] items-center bg-[#121812] sm:h-12">
                <button type="button" onClick={() => setLeaderboardOpen(false)} className="flex h-full items-center justify-start px-1 font-mono text-[10px] font-black uppercase text-[#e6f7d4]">
                  ← {lang === 'en' ? 'Back' : 'Назад'}
                </button>
                <div className="flex min-w-0 items-center justify-center font-mono text-[11px] font-black uppercase text-[#cfe8b3]">
                  <span className="text-center leading-tight">{lang === 'en' ? 'Damage leaderboard' : lang === 'ru' ? 'Топ урона' : 'Топ урону'}</span>
                  <span className="relative z-10 ml-2 text-[9px] text-[#9fbc82]">{leaderboard.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLeaderboardOpen(false)}
                  className="flex h-full w-12 shrink-0 items-center justify-center rounded-[3px] bg-transparent text-[#c7d5be] transition hover:bg-white/[0.04] hover:text-[#eaffcf]"
                  aria-label="Close damage leaderboard"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {raidMode ? (
                <div className="mb-2 grid h-10 shrink-0 grid-cols-2 gap-1 sm:h-12">
                  <GameTextureButton type="button" tone={leaderboardMode === 'players' ? 'yellow' : 'gray'} onClick={() => setLeaderboardMode('players')} className="h-full min-w-0 w-full px-2 text-[#2a240e]">
                    <span className="relative z-10 font-mono text-[10px] font-black uppercase">{t('boss_panel.players', { lng: lang })}</span>
                  </GameTextureButton>
                  <GameTextureButton type="button" tone={leaderboardMode === 'clans' ? 'yellow' : 'gray'} onClick={() => setLeaderboardMode('clans')} className="h-full min-w-0 w-full px-2 text-[#2a240e]">
                    <span className="relative z-10 font-mono text-[10px] font-black uppercase">{t('boss_panel.clans', { lng: lang })}</span>
                  </GameTextureButton>
                </div>
              ) : null}

              {raidMode && <RaidRankRewardsGuide language={lang} />}
              {displayedLeaderboard.length ? <div className="leaderboard-top mb-2 shrink-0 overflow-hidden rounded-none bg-[#0b100a] px-1 py-2 sm:px-2"><BossTopPodium leaderboard={displayedLeaderboard} mode={leaderboardMode} clanSubtitle={t('boss_panel.clan_damage', { lng: lang })} onOpenPlayerProfile={onOpenPlayerProfile} /></div> : null}

              <div className="leaderboard-list-wrap players-scroll h-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y pb-4 mt-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                {displayedLeaderboard.length === 0 ? (
                  <div className="flex h-full min-h-[180px] items-center justify-center rounded-[14px] px-4 text-center">
                    <p className="font-mono text-[11px] leading-relaxed text-[#9bb576]">Nobody has hit this boss yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {displayedLeaderboard.map((log, index) => leaderboardMode === 'clans' ? (
                      <BossClanDamageRow key={log.id} log={log} rank={index + 1} subtitle={t('boss_panel.clan_damage', { lng: lang })} />
                    ) : (
                      <BossDamageRow key={log.id || log.player_id || index} log={log} rank={index + 1} raidMode={raidMode} isMe={log.player_email === profile?.created_by} language={lang} onOpenPlayerProfile={onOpenPlayerProfile} />
                    ))}
                  </div>
                )}
              </div>
              {leaderboardMode === 'players' && ownDamageRank >= 0 && <div data-leaderboard-position="true" className="mt-2 shrink-0 border-t border-[#28ee90] bg-[#071007] pt-2"><BossDamageRow log={leaderboard[ownDamageRank]} rank={ownDamageRank + 1} isMe language={lang} onOpenPlayerProfile={onOpenPlayerProfile} /></div>}
            </div>
          </div>, document.body
        ) : null}
      <AnimatePresence>
        {escapeConfirmOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[95] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-[390px] rounded-[20px] border-2 border-[#8bff58] bg-[#11190f] p-4 text-center shadow-[0_0_28px_rgba(139,255,88,.35)]"
            >
              <img src={bossEscapeGuideIcon} alt="" aria-hidden="true" className="mx-auto -my-2 h-48 w-48 object-contain" />
              <h2 className="font-sans text-[21px] font-black uppercase text-[#f4ffd9]">{tr.escapeTitle}</h2>
              <p className="mt-3 font-mono text-[12px] font-bold leading-relaxed text-[#d3e7bf]">{tr.escapeText}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <GameTextureButton type="button" tone="dark-green" onClick={() => setEscapeConfirmOpen(false)} className="h-11 w-full">
                  <span className="relative z-10 font-mono text-[11px] font-black uppercase">{tr.keepFighting}</span>
                </GameTextureButton>
                <GameTextureButton type="button" tone="green" disabled={escaping} onClick={() => { setEscapeConfirmOpen(false); void handleEscape(); }} className="h-11 w-full">
                  <span className="relative z-10 font-mono text-[11px] font-black uppercase text-[#15220b]">{tr.confirmEscape}</span>
                </GameTextureButton>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {clanHelpOpen ? (
          <div
            className="absolute inset-0 z-[95] flex items-center justify-center bg-black/75 p-4"
          >
            <div
              className="relative w-full max-w-[390px] rounded-[20px] border-2 border-[#8bff58] bg-[#11190f] p-4 text-center shadow-[0_0_28px_rgba(139,255,88,.35)]"
            >
              <img src={clanHelpGuide} alt="" aria-hidden="true" className="mx-auto -my-2 h-48 w-48 object-contain" />
              <h2 className="font-sans text-[19px] font-black uppercase leading-tight text-[#f4ffd9]">{tr.clanHelpTitle}</h2>
              <p className="mt-3 font-mono text-[12px] font-bold leading-relaxed text-[#d3e7bf]">{tr.clanHelpText}</p>
              {clanHelpStatus ? <p role="status" className="mt-3 font-mono text-[11px] font-black text-[#dfff82]">{clanHelpStatus}</p> : null}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <GameTextureButton type="button" tone="dark-green" onClick={() => setClanHelpOpen(false)} className="h-11 w-full">
                  <span className="relative z-10 font-mono text-[10px] font-black uppercase">{tr.clanHelpCancel}</span>
                </GameTextureButton>
                <GameTextureButton type="button" tone="green" disabled={sendingClanHelp || !canCallClanHelp} onClick={() => { void handleClanHelpInvite(); }} className="h-11 w-full">
                  <span className="relative z-10 font-mono text-[10px] font-black uppercase text-[#15220b]">{profile?.clan_id || profile?.clan_name ? tr.clanHelpSend : tr.findClan}</span>
                </GameTextureButton>
              </div>
            </div>
          </div>
        ) : null}
      <style>{`

        .boss-android-lite [class*="-layer"], .boss-android-lite [class*="-rig"], .boss-android-lite [class*="-composite"] { will-change: auto !important; filter: none !important; animation: none !important; }
        .boss-android-lite [class*="-mask"], .boss-android-lite [class*="-glow"] { display: none !important; }
        @keyframes boss-bg-spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes boss-bg-spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes boss-cloud-float-a { from { transform: translate(-12px, 3px); } to { transform: translate(10px, -4px); } }
        @keyframes boss-cloud-float-b { from { transform: translate(8px, -5px); } to { transform: translate(-14px, 6px); } }
        @keyframes boss-cloud-float-c { from { transform: translate(-7px, 4px); } to { transform: translate(13px, -3px); } }
        @keyframes boss1-blue-monitor-flicker { 0%, 100% { opacity: 0.82; filter: brightness(0.98); } 17% { opacity: 0.94; filter: brightness(1.04); } 46% { opacity: 0.76; filter: brightness(0.94); } 63% { opacity: 1; filter: brightness(1.08); } 68% { opacity: 0.86; filter: brightness(1); } }
        @keyframes boss1-red-monitor-flicker { 0%, 100% { opacity: 0.78; filter: brightness(0.96); } 25% { opacity: 0.95; filter: brightness(1.08); } 54% { opacity: 0.72; filter: brightness(0.92); } 60% { opacity: 1; filter: brightness(1.14); } 65% { opacity: 0.84; filter: brightness(1); } }
        @keyframes boss1-red-light-pulse { 0%, 100% { opacity: 0.65; filter: brightness(0.92) drop-shadow(0 0 2px rgba(255,48,48,0.34)); } 50% { opacity: 1; filter: brightness(1.18) drop-shadow(0 0 6px rgba(255,48,48,0.64)); } }
        @keyframes boss1-top-light-fault { 0%, 19%, 100% { opacity: 0.78; filter: brightness(1); } 24% { opacity: 1; filter: brightness(1.22); } 28% { opacity: 0.52; filter: brightness(0.82); } 32% { opacity: 0.96; filter: brightness(1.16); } 36% { opacity: 0.6; filter: brightness(0.86); } 40% { opacity: 1; filter: brightness(1.2); } 47% { opacity: 0.8; filter: brightness(1); } }
        @keyframes boss1-meteors-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.032); } }
        @keyframes boss1-star-pulse { from { opacity: 0.7; transform: scale(0.98) rotate(-1deg); filter: brightness(0.95) drop-shadow(0 0 2px rgba(255,241,158,0.34)); } to { opacity: 1; transform: scale(1.03) rotate(1deg); filter: brightness(1.22) drop-shadow(0 0 6px rgba(255,241,158,0.72)); } }
        @keyframes boss2-out-colours-blink { 0%, 100% { opacity: 0.12; filter: sepia(0.3) saturate(1.1); } 12% { opacity: 0.12; } 15% { opacity: 0.72; filter: sepia(1) saturate(5) hue-rotate(-26deg) brightness(1.2) drop-shadow(0 0 4px rgba(255,51,51,0.46)); } 18% { opacity: 0.18; } 21% { opacity: 0.56; filter: sepia(1) saturate(4.5) hue-rotate(-26deg) brightness(1.12); } 24%, 67% { opacity: 0.12; filter: sepia(0.3) saturate(1.1); } 70% { opacity: 0.48; filter: sepia(1) saturate(4) hue-rotate(-26deg) brightness(1.1) drop-shadow(0 0 3px rgba(255,51,51,0.34)); } 73% { opacity: 0.12; } }
        @keyframes boss2-point-rainbow-flow { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
        @keyframes boss2-rainbow-wave-pass { 0% { opacity: 0; background-position: 0% 50%; } 12% { opacity: 0.24; background-position: 18% 50%; } 48% { opacity: 0.44; background-position: 52% 50%; } 78% { opacity: 0.3; background-position: 82% 50%; } 100% { opacity: 0; background-position: 100% 50%; } }
        @keyframes boss2-rainbow-wave-glow-pass { 0% { opacity: 0; background-position: 0% 50%; } 18% { opacity: 0.06; background-position: 20% 50%; } 50% { opacity: 0.12; background-position: 54% 50%; } 82% { opacity: 0.07; background-position: 84% 50%; } 100% { opacity: 0; background-position: 100% 50%; } }
        @keyframes boss2-smoke-drift { 0%, 100% { opacity: 0.52; transform: scale(1); } 28% { opacity: 0.7; transform: scale(1.012); } 58% { opacity: 0.58; transform: scale(1.018); } 80% { opacity: 0.66; transform: scale(1.01); } }
        @keyframes boss2-smoke-two-drift { 0%, 100% { opacity: 0.4; transform: scale(1); } 24% { opacity: 0.58; transform: scale(1.01); } 52% { opacity: 0.48; transform: scale(1.016); } 76% { opacity: 0.56; transform: scale(1.008); } }
        @keyframes raid-boss-bg-flag-wave { 0%, 100% { transform: rotate(-0.18deg) skewX(-0.28deg) scaleX(1); } 29% { transform: rotate(0.28deg) skewX(0.48deg) scaleX(1.004); } 55% { transform: rotate(0.04deg) skewX(-0.16deg) scaleX(1.001); } 78% { transform: rotate(0.4deg) skewX(0.62deg) scaleX(1.005); } }
        @keyframes raid-boss-bg-debris-drift { 0%, 100% { transform: translate(-3px, -2px) rotate(-1deg) scale(1); } 26% { transform: translate(1px, 1px) rotate(0.25deg) scale(1.003); } 54% { transform: translate(4px, 3px) rotate(1.5deg) scale(1.005); } 78% { transform: translate(-1px, 0px) rotate(-0.28deg) scale(1.002); } }
        @keyframes raid-boss-bg-lamp-alarm { 0%, 100% { opacity: 0.72; filter: brightness(0.78) drop-shadow(0 0 2px rgba(255,66,57,0.3)); } 9% { opacity: 1; filter: brightness(1.42) drop-shadow(0 0 9px rgba(255,54,48,0.72)); } 17% { opacity: 0.38; filter: brightness(0.56) drop-shadow(0 0 1px rgba(255,54,48,0.18)); } 28% { opacity: 0.94; filter: brightness(1.28) drop-shadow(0 0 7px rgba(255,54,48,0.6)); } 39% { opacity: 0.64; filter: brightness(0.74) drop-shadow(0 0 2px rgba(255,54,48,0.28)); } 61% { opacity: 0.82; filter: brightness(0.98) drop-shadow(0 0 4px rgba(255,54,48,0.4)); } 70% { opacity: 0.3; filter: brightness(0.48) drop-shadow(0 0 1px rgba(255,54,48,0.14)); } 79% { opacity: 1; filter: brightness(1.38) drop-shadow(0 0 9px rgba(255,54,48,0.72)); } }
        @keyframes raid-boss-bg-slime-pulse { 0%, 100% { filter: brightness(0.86) saturate(1.04) drop-shadow(0 0 2px rgba(160,255,58,0.24)); } 21% { filter: brightness(1.12) saturate(1.16) drop-shadow(0 0 7px rgba(160,255,58,0.48)); } 47% { filter: brightness(0.91) saturate(1.06) drop-shadow(0 0 3px rgba(160,255,58,0.28)); } 66% { filter: brightness(1.06) saturate(1.13) drop-shadow(0 0 6px rgba(160,255,58,0.42)); } 82% { filter: brightness(0.95) saturate(1.08) drop-shadow(0 0 4px rgba(160,255,58,0.33)); } }
        @keyframes raid-boss-bg-slime-impulse { 0% { filter: brightness(1.05) saturate(1.12) drop-shadow(0 0 5px rgba(160,255,58,0.4)); } 38% { filter: brightness(1.28) saturate(1.22) drop-shadow(0 0 10px rgba(174,255,63,0.66)); } 100% { filter: brightness(1.02) saturate(1.1) drop-shadow(0 0 4px rgba(160,255,58,0.34)); } }
        @keyframes boss-body-float { from { transform: translateY(-3px); } to { transform: translateY(4px); } }
        @keyframes boss-head-idle { from { transform: rotate(-0.8deg) translateY(-1px); } to { transform: rotate(0.8deg) translateY(1px); } }
        @keyframes boss-left-arm-idle { from { transform: rotate(-1.6deg) translateY(0px); } to { transform: rotate(1.4deg) translateY(2px); } }
        @keyframes boss-right-arm-idle { from { transform: rotate(1.4deg) translateY(1px); } to { transform: rotate(-1.6deg) translateY(-1px); } }
        @keyframes boss-tail-idle { from { transform: rotate(-2.4deg) translateX(-2px); } to { transform: rotate(2.4deg) translateX(2px); } }
        @keyframes boss-bell-idle { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
        @keyframes boss-eyes-pulse { from { opacity: 0.62; filter: brightness(0.95); } to { opacity: 1; filter: brightness(1.15); } }
        @keyframes boss-aura-pulse { from { opacity: 0.36; filter: brightness(0.9); } to { opacity: 0.78; filter: brightness(1.12); } }
        @keyframes boss-head-twitch { 0% { transform: rotate(-2deg) translate(1px,0); } 50% { transform: rotate(2deg) translate(-1px,1px); } 100% { transform: rotate(0deg) translate(0,0); } }
        @keyframes boss-shake { 0% { transform: translate(0,0); } 25% { transform: translate(-2px,1px); } 50% { transform: translate(2px,-1px); } 75% { transform: translate(-1px,1px); } 100% { transform: translate(0,0); } }
        @keyframes boss1-body-breathe { from { transform: scale(1); } to { transform: scale(1.005); } }
        @keyframes boss1-head-idle { from { transform: rotate(-1.2deg) translateY(-2px); } to { transform: rotate(1.2deg) translateY(2px); } }
        @keyframes boss1-label-idle { from { transform: rotate(-2deg); } to { transform: rotate(2deg); } }
        @keyframes boss1-hand-idle { from { transform: rotate(-1deg) translate(-2px, 1px); } to { transform: rotate(1.5deg) translate(2px, -2px); } }
        @keyframes boss1-head-slime-pulse { 0%, 18%, 57%, 100% { opacity: 0.62; filter: brightness(0.95) drop-shadow(0 0 4px rgba(167,255,73,0.46)); } 30%, 52%, 75% { opacity: 1; filter: brightness(1.3) drop-shadow(0 0 11px rgba(167,255,73,0.86)); } 61% { opacity: 0.7; filter: brightness(1.05) drop-shadow(0 0 6px rgba(167,255,73,0.55)); } }
        @keyframes boss1-hand-slime-pulse { 0%, 25%, 68%, 100% { opacity: 0.56; filter: brightness(0.92) drop-shadow(0 0 4px rgba(167,255,73,0.42)); } 15%, 48%, 79% { opacity: 1; filter: brightness(1.34) drop-shadow(0 0 11px rgba(167,255,73,0.88)); } 53% { opacity: 0.64; filter: brightness(1.04) drop-shadow(0 0 6px rgba(167,255,73,0.55)); } }
        @keyframes boss1-hit-shake { 0% { transform: translate(0, 0); } 22% { transform: translate(-4px, 1px); } 48% { transform: translate(5px, -1px); } 72% { transform: translate(-3px, 1px); } 100% { transform: translate(0, 0); } }
        @keyframes boss1-hit-flash { 0%, 100% { opacity: 0; } 20% { opacity: 0.3; } 48% { opacity: 0.12; } }
        @keyframes boss1-red-eyes-hit { 0% { opacity: 0; } 6% { opacity: 1; filter: brightness(1.5) drop-shadow(0 0 13px rgba(255,45,45,0.96)); } 34% { opacity: 1; filter: brightness(1.32) drop-shadow(0 0 9px rgba(255,70,70,0.78)); } 100% { opacity: 0; filter: brightness(1) drop-shadow(0 0 0 rgba(255,45,45,0)); } }
        @keyframes boss1-stamp-hit { 0% { opacity: 0; transform: scale(1); } 4% { opacity: 1; transform: scale(1.14); filter: brightness(1.35) drop-shadow(0 0 15px rgba(255,54,54,1)); } 48% { opacity: 1; transform: scale(1.04); filter: brightness(1.2) drop-shadow(0 0 10px rgba(255,240,240,0.9)); } 100% { opacity: 0; transform: scale(1); filter: drop-shadow(0 0 0 rgba(255,54,54,0)); } }
        @keyframes boss2-wing-idle { from { transform: rotate(-1.4deg) translate(-1px, 1px); } to { transform: rotate(1.5deg) translate(2px, -2px); } }
        @keyframes boss2-head-idle { from { transform: rotate(-0.9deg) translate(-1px, -1px); } to { transform: rotate(0.9deg) translate(1px, 2px); } }
        @keyframes boss2-horns-glow { from { opacity: 0.82; filter: brightness(0.96) drop-shadow(0 0 1px rgba(190,164,255,0.16)); } to { opacity: 1; filter: brightness(1.12) drop-shadow(0 0 5px rgba(190,164,255,0.42)); } }
        @keyframes boss2-arm-one-idle { from { transform: rotate(-8deg); } to { transform: rotate(7deg); } }
        @keyframes boss2-arm-two-idle { from { transform: rotate(8deg); } to { transform: rotate(-7deg); } }
        @keyframes boss2-cube-float { 0%, 100% { transform: translateY(0) rotate(-2deg) scale(0.94); } 50% { transform: translateY(-4px) rotate(2deg) scale(1.06); } }
        @keyframes boss2-belly-rainbow-flow { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
        @keyframes boss2-orb-one-light { 0%, 100% { opacity: 0.48; filter: brightness(0.94) saturate(0.92) drop-shadow(0 0 2px rgba(90,185,255,0.24)); background-position: 0% 45%, 0% 50%; } 50% { opacity: 0.86; filter: brightness(1.2) saturate(1.22) drop-shadow(0 0 6px rgba(94,210,255,0.58)); background-position: 100% 55%, 100% 50%; } }
        @keyframes boss2-orb-two-light { 0%, 100% { opacity: 0.5; filter: brightness(1.18) saturate(1.16) drop-shadow(0 0 5px rgba(114,255,159,0.48)); background-position: 100% 52%, 100% 50%; } 50% { opacity: 0.8; filter: brightness(0.94) saturate(0.9) drop-shadow(0 0 2px rgba(114,255,159,0.2)); background-position: 0% 42%, 0% 50%; } }
        @keyframes boss2-slime-rainbow-flow { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
        @keyframes boss2-horns-wing-vibrate { 0%, 100% { transform: rotate(0deg) scaleX(1); filter: brightness(1.05) drop-shadow(0 0 0 rgba(95,236,255,0)) drop-shadow(0 0 0 rgba(198,92,255,0)); } 10% { transform: rotate(-4.5deg) scaleX(1.018); filter: brightness(1.7) drop-shadow(0 0 5px rgba(95,236,255,0.95)) drop-shadow(0 0 12px rgba(198,92,255,0.85)); } 20% { transform: rotate(4.2deg) scaleX(0.982); } 30% { transform: rotate(-3.8deg) scaleX(1.014); } 40% { transform: rotate(3.5deg) scaleX(0.986); filter: brightness(1.55) drop-shadow(0 0 4px rgba(95,236,255,0.82)) drop-shadow(0 0 10px rgba(198,92,255,0.74)); } 52% { transform: rotate(-2.8deg) scaleX(1.01); } 64% { transform: rotate(2.4deg) scaleX(0.99); } 78% { transform: rotate(-1.5deg); } 90% { transform: rotate(1deg); } }
        @keyframes boss2-wing-hit-vibrate { 0%, 100% { transform: rotate(0deg); } 16% { transform: rotate(-2.8deg); } 32% { transform: rotate(2.4deg); } 48% { transform: rotate(-2deg); } 64% { transform: rotate(1.5deg); } 80% { transform: rotate(-0.9deg); } }
        @keyframes raid-boss-chain-idle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes raid-boss-hand-idle { 0%, 100% { transform: rotate(-1.5deg) translateY(1px); } 50% { transform: rotate(2deg) translateY(-1px); } }
        @keyframes raid-boss-weapon-hand-idle { 0%, 100% { transform: rotate(2.5deg) translateY(-1px); } 50% { transform: rotate(-2deg) translateY(1px); } }
        @keyframes raid-boss-crown-idle { 0%, 100% { transform: rotate(-1.5deg) translateY(0); } 50% { transform: rotate(1.5deg) translateY(-1.5px); } }
        @keyframes raid-boss-tentacle-one { 0%, 100% { transform: rotate(-2.3deg) skewX(-0.5deg); } 50% { transform: rotate(2.7deg) skewX(1.2deg); } }
        @keyframes raid-boss-tentacle-two { 0%, 100% { transform: rotate(2.4deg) skewX(0.8deg); } 50% { transform: rotate(-2deg) skewX(-1.1deg); } }
        @keyframes raid-boss-tentacle-three { 0%, 100% { transform: rotate(-2.6deg) skewX(-0.8deg); } 50% { transform: rotate(2.1deg) skewX(1deg); } }
        @keyframes raid-boss-tentacle-four { 0%, 100% { transform: rotate(1.8deg) skewX(0.7deg); } 50% { transform: rotate(-2.5deg) skewX(-1.2deg); } }
        @keyframes raid-boss-tentacle-five { 0%, 100% { transform: rotate(-2.8deg) skewX(-1deg); } 50% { transform: rotate(2.4deg) skewX(1.1deg); } }
        @keyframes raid-boss-tentacle-six { 0%, 100% { transform: rotate(2.2deg) skewX(0.8deg); } 50% { transform: rotate(-2.7deg) skewX(-1.1deg); } }
        @keyframes raid-boss-wings-idle { 0%, 100% { transform: rotate(-2deg) scaleX(1); } 50% { transform: rotate(2deg) scaleX(1.006); } }
        @keyframes raid-boss-lock-idle { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
        @keyframes raid-boss-head-hit { 0% { opacity: 1; filter: brightness(1.2); } 78% { opacity: 1; filter: brightness(1.06); } 100% { opacity: 0; filter: brightness(1); } }
        @keyframes worm-stalk-sway { 0%, 100% { transform: rotate(-2.5deg); } 23% { transform: rotate(3deg); } 51% { transform: rotate(-2deg); } 74% { transform: rotate(1.5deg); } }
        @keyframes worm-saw-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes worm-parasite-twitch { 0%, 100% { transform: rotate(0deg) scaleX(1); } 25% { transform: rotate(-0.8deg) scaleX(1.006); } 51% { transform: rotate(1.25deg) scaleX(0.995); } 74% { transform: rotate(-0.45deg) scaleX(1.004); } }
        @keyframes worm-belly-digest { 0%, 100% { transform: scale(1, 1); } 27% { transform: scale(1.015, 0.99); } 54% { transform: scale(0.995, 1.015); } 78% { transform: scale(1.01, 1); } }
        @keyframes worm-belly-bubble { 0%, 100% { transform: scale(1, 1); } 35% { transform: scale(1.024, 0.986); } 60% { transform: scale(1.012, 1.006); } }
        @keyframes worm-teeth-chomp { 0%, 100% { transform: scaleX(1); } 42% { transform: scaleX(0.972); } 61% { transform: scaleX(0.972); } }
        @keyframes worm-teeth-snap { 0%, 100% { transform: scaleX(1); } 45% { transform: scaleX(0.958); } 60% { transform: scaleX(1.008); } }
        @keyframes worm-slime-glow { 0%, 100% { filter: brightness(0.95) saturate(1.04) drop-shadow(0 0 2px rgba(183,255,64,0.22)); } 22% { filter: brightness(1.15) saturate(1.14) drop-shadow(0 0 6px rgba(183,255,64,0.42)); } 48% { filter: brightness(1.02) saturate(1.08) drop-shadow(0 0 3px rgba(183,255,64,0.28)); } 69% { filter: brightness(1.22) saturate(1.18) drop-shadow(0 0 8px rgba(183,255,64,0.5)); } 84% { filter: brightness(0.98) saturate(1.06) drop-shadow(0 0 3px rgba(183,255,64,0.26)); } }
        @keyframes worm-slime-impulse { 0% { filter: brightness(1.02) saturate(1.1) drop-shadow(0 0 4px rgba(183,255,64,0.3)); } 43% { filter: brightness(1.34) saturate(1.26) drop-shadow(0 0 11px rgba(190,255,72,0.7)); } 100% { filter: brightness(1.04) saturate(1.12) drop-shadow(0 0 4px rgba(183,255,64,0.34)); } }
        @keyframes worm-bg-pendulum { 0%, 100% { transform: rotate(-3deg); } 22% { transform: rotate(3deg); } 51% { transform: rotate(-2deg); } 77% { transform: rotate(2.5deg); } }
        @keyframes worm-bg-wheel-stuck { 0%, 100% { transform: rotate(2deg) translate(0, 0); } 22% { transform: rotate(7deg) translate(1px, -1px); } 47% { transform: rotate(3deg) translate(0, 1px); } 71% { transform: rotate(10deg) translate(1px, 0); } 84% { transform: rotate(5deg) translate(0, 1px); } }
        @keyframes worm-bg-wheel-lurch { 0%, 100% { transform: rotate(3deg) translate(0, 0); } 32% { transform: rotate(18deg) translate(1px, -1px); } 53% { transform: rotate(8deg) translate(1px, 1px); } 74% { transform: rotate(12deg) translate(0, 0); } }
        @keyframes worm-bg-cone-stuck { 0%, 100% { transform: rotate(-2deg) translate(0, 0); } 23% { transform: rotate(3deg) translate(2px, -2px); } 48% { transform: rotate(1deg) translate(1px, -3px); } 76% { transform: rotate(-3deg) translate(-1px, 1px); } }
        @keyframes worm-bg-cow-stuck { 0%, 100% { transform: rotate(0deg) translate(0, 0); } 19% { transform: rotate(2deg) translate(1px, -2px); } 39% { transform: rotate(1deg) translate(1px, -3px); } 51% { transform: rotate(1deg) translate(1px, -3px); } 60% { transform: rotate(2.3deg) translate(0, -3px); } 78% { transform: rotate(-2.5deg) translate(-1px, -1px); } 91% { transform: rotate(-1deg) translate(0, 0); } }
        @keyframes worm-bg-cow-jolt { 0% { transform: rotate(0deg) translate(0, 0); } 22% { transform: rotate(1.8deg) translate(1px, -4px); } 42% { transform: rotate(1.8deg) translate(1px, -4px); } 100% { transform: rotate(0deg) translate(0, 0); } }
        @keyframes worm-bg-redlamp-glow { 0%, 100% { opacity: 0.2; filter: drop-shadow(0 0 2px rgba(255,58,48,0.28)); } 19% { opacity: 0.64; filter: drop-shadow(0 0 7px rgba(255,55,45,0.68)); } 37% { opacity: 0.28; filter: drop-shadow(0 0 3px rgba(255,58,48,0.34)); } 55% { opacity: 0.55; filter: drop-shadow(0 0 6px rgba(255,55,45,0.62)); } 74% { opacity: 0.22; filter: drop-shadow(0 0 2px rgba(255,58,48,0.28)); } }
        @keyframes worm-bg-slime-sheen { 0%, 100% { opacity: 0.18; background-position: -35% 50%; } 21% { opacity: 0.38; background-position: 15% 50%; } 49% { opacity: 0.24; background-position: 54% 50%; } 73% { opacity: 0.44; background-position: 104% 50%; } }
        @keyframes worm-bg-slime-impulse { 0%, 100% { opacity: 0.26; } 45% { opacity: 0.68; } }
        @keyframes worm-bg-waterfall-flow { from { background-position: 0 0, 0 0; } to { background-position: 0 54px, 0 96px; } }
        @keyframes worm-bg-waterfall-surge { 0% { opacity: 0; background-position: 50% -20%; } 18% { opacity: 0.34; } 76% { opacity: 0.46; background-position: 50% 120%; } 100% { opacity: 0; background-position: 50% 130%; } }
        @keyframes worm-cloud-wave { 0%, 100% { opacity: var(--cloud-base-opacity); transform: scale(1); filter: drop-shadow(0 0 1px rgba(62, 192, 255, 0.12)); } 30% { opacity: var(--cloud-mid-opacity); transform: scale(var(--cloud-mid-scale)); filter: drop-shadow(0 0 2px rgba(62, 192, 255, 0.18)); } 50% { opacity: var(--cloud-peak-opacity); transform: scale(var(--cloud-peak-scale)); filter: drop-shadow(0 0 3px rgba(62, 192, 255, 0.28)); } 54% { filter: drop-shadow(0 0 4px rgba(62, 192, 255, 0.32)); } 70% { opacity: var(--cloud-mid-opacity); transform: scale(var(--cloud-mid-scale)); filter: drop-shadow(0 0 2px rgba(62, 192, 255, 0.18)); } }
        @keyframes sporgol-bg-moon-breathe { 0%,100% { transform:scale(1); } 28% { transform:scale(1.008); } 57% { transform:scale(1.012); } 79% { transform:scale(1.008); } }
        @keyframes sporgol-bg-moon-light { 0%,100% { filter:brightness(1); } 52% { filter:brightness(1.025); } }
        @keyframes sporgol-bg-planet-one { 0%,100% { transform:scale(1); } 50% { transform:scale(1.025); } }
        @keyframes sporgol-bg-planet-two { 0%,100% { transform:scale(1); } 38% { transform:scale(.985); } 72% { transform:scale(1.015); } }
        @keyframes sporgol-bg-planet-three { 0%,100% { transform:scale(1); } 44% { transform:scale(1.018); } 73% { transform:scale(.99); } }
        @keyframes sporgol-bg-mushroom-shake { 0%,100% { transform:rotate(0); } 12% { transform:rotate(-2.5deg); } 24% { transform:rotate(3deg); } 37% { transform:rotate(-2deg); } 51% { transform:rotate(2.5deg); } 65% { transform:rotate(-1deg); } 78% { transform:rotate(1.25deg); } }
        @keyframes sporgol-bg-hand-sway { 0%,100% { transform:rotate(0); } 22% { transform:rotate(-2.5deg); } 46% { transform:rotate(3deg); } 67% { transform:rotate(-1deg); } 84% { transform:rotate(1.5deg); } }
        @keyframes shork-antenna-signal { 0% { transform: scale(1); filter: brightness(0.84) drop-shadow(0 0 2px rgba(164,255,88,0.24)); } 46% { transform: scale(1.03); filter: brightness(1.48) drop-shadow(0 0 8px rgba(164,255,88,0.74)); } 100% { transform: scale(1); filter: brightness(0.92) drop-shadow(0 0 3px rgba(164,255,88,0.3)); } }
        @keyframes shork-banana-glow { 0%, 100% { filter: brightness(0.9) drop-shadow(0 0 2px rgba(255,211,58,0.2)); } 30% { filter: brightness(1.15) drop-shadow(0 0 5px rgba(255,211,58,0.42)); } 62% { filter: brightness(1.01) drop-shadow(0 0 3px rgba(255,211,58,0.28)); } 81% { filter: brightness(1.2) drop-shadow(0 0 6px rgba(255,211,58,0.48)); } }
        @keyframes shork-chair-hand-idle { 0%, 100% { transform: rotate(-1.5deg) translateY(0); } 50% { transform: rotate(2deg) translateY(1px); } }
        @keyframes shork-weapon-hand-idle { 0%, 100% { transform: rotate(-2deg) translateY(0); } 50% { transform: rotate(1.5deg) translateY(1px); } }
        @keyframes shork-head-idle { 0%, 100% { transform: rotate(-0.7deg) translateY(0); } 50% { transform: rotate(0.7deg) translateY(1px); } }
        @keyframes shork-head-hit { 0%, 100% { transform: rotate(0) translate(0, 0); } 28% { transform: rotate(-0.9deg) translate(-1px, 1px); } 60% { transform: rotate(0.55deg) translate(1px, 0); } }
        @keyframes shork-head-lid-open { 0%, 100% { transform: rotate(0deg); } 42% { transform: rotate(-10deg); } 64% { transform: rotate(-10deg); } }
        @keyframes shork-leg-stomp { 0% { transform: rotate(0deg); } 35% { transform: rotate(3deg); } 65% { transform: rotate(-0.75deg); } 100% { transform: rotate(0deg); } }
        @keyframes shork-fork-pendulum { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes shork-bg-lamp-glow { 0%, 100% { opacity: 0.82; filter: brightness(0.9) drop-shadow(0 0 2px rgba(255,211,74,0.26)); } 27% { opacity: 1; filter: brightness(1.15) drop-shadow(0 0 6px rgba(255,211,74,0.48)); } 51% { opacity: 0.9; filter: brightness(1) drop-shadow(0 0 3px rgba(255,211,74,0.3)); } 76% { opacity: 0.72; filter: brightness(0.72) drop-shadow(0 0 1px rgba(255,211,74,0.16)); } 82% { opacity: 1; filter: brightness(1.1) drop-shadow(0 0 5px rgba(255,211,74,0.42)); } }
        @keyframes shork-bg-big-planet-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
        @keyframes shork-bg-mini-planet-breathe { 0%, 100% { transform: translateY(0) scale(1); } 48% { transform: translateY(-2px) scale(1.045); } }
        @keyframes shork-bg-crane-swing { 0%, 100% { transform: rotate(-2.3deg); } 50% { transform: rotate(2.3deg); } }
        @keyframes shork-bg-screen-static { 0%, 100% { opacity: 0.48; filter: brightness(0.96) contrast(1.2); background-position: 0 0, 0 0, 0 0; } 22% { opacity: 0.66; filter: brightness(1.12) contrast(1.38); background-position: 4px 2px, 0 10px, 2px 0; } 49% { opacity: 0.55; filter: brightness(1.02) contrast(1.28); background-position: 1px 3px, 0 4px, 4px 0; } 71% { opacity: 0.7; filter: brightness(1.18) contrast(1.45); background-position: 5px 1px, 0 14px, 1px 0; } }
        @keyframes shork-bg-screen-grain { 0%, 100% { opacity: 0.18; background-position: 0 0, 0 0; } 43% { opacity: 0.31; background-position: 4px 2px, 0 3px; } 71% { opacity: 0.22; background-position: 1px 3px, 0 1px; } }
        @keyframes shork-bg-screen-glitch { 0% { transform: translateX(0); opacity: 0.56; filter: brightness(1); } 45% { transform: translateX(2px); opacity: 0.8; filter: brightness(1.26); } 100% { transform: translateX(0); opacity: 0.54; filter: brightness(1.05); } }
        @keyframes shork-bg-screen-band-pass { 0% { opacity: 0; background-position: 50% 29%; } 12% { opacity: 0.12; background-position: 50% 31%; } 62% { opacity: 0.62; background-position: 50% 40%; } 100% { opacity: 0; background-position: 50% 45%; } }
        @keyframes shork-bg-slime-pulse { 0%, 100% { filter: brightness(0.9) saturate(1.04) drop-shadow(0 0 2px rgba(152,255,61,0.24)); } 22% { filter: brightness(1.2) saturate(1.16) drop-shadow(0 0 7px rgba(152,255,61,0.48)); } 48% { filter: brightness(1) saturate(1.08) drop-shadow(0 0 3px rgba(152,255,61,0.28)); } 69% { filter: brightness(1.12) saturate(1.13) drop-shadow(0 0 6px rgba(152,255,61,0.4)); } 84% { filter: brightness(0.94) saturate(1.06) drop-shadow(0 0 3px rgba(152,255,61,0.28)); } }
        @keyframes shork-bg-slime-impulse { 0% { filter: brightness(1.04) saturate(1.1) drop-shadow(0 0 4px rgba(152,255,61,0.34)); } 38% { filter: brightness(1.32) saturate(1.22) drop-shadow(0 0 9px rgba(152,255,61,0.62)); } 100% { filter: brightness(1.02) saturate(1.1) drop-shadow(0 0 4px rgba(152,255,61,0.34)); } }
        .bg-planet { position: absolute; will-change: transform; }
        .bg-planet-1 { transform-origin: 15.897% 9.67%; animation: boss-bg-spin-cw 100s linear infinite; }
        .bg-planet-2 { transform-origin: 87.648% 19.699%; animation: boss-bg-spin-ccw 120s linear infinite; }
        .boss-bg-cloud1 { animation: boss-cloud-float-a 27s ease-in-out infinite alternate; }
        .boss-bg-cloud2 { animation: boss-cloud-float-b 33s ease-in-out infinite alternate; }
        .boss-bg-cloud3 { animation: boss-cloud-float-c 41s ease-in-out infinite alternate; }
        .boss1-bg-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; will-change: transform, opacity; }
        .boss1-window-clip { position: absolute; inset: 0; overflow: hidden; clip-path: polygon(22.5% 20.1%, 70.8% 20.1%, 70.8% 38.8%, 22.5% 38.8%); pointer-events: none; }
        .boss1-bg-blue-monitors { animation: boss1-blue-monitor-flicker 2.57s ease-in-out infinite; }
        .boss1-bg-red-monitor { animation: boss1-red-monitor-flicker 1.93s ease-in-out infinite; animation-delay: -0.71s; }
        .boss1-bg-red-lights { animation: boss1-red-light-pulse 1.32s ease-in-out infinite; animation-delay: -0.38s; }
        .boss1-bg-top-light { animation: boss1-top-light-fault 5.6s ease-in-out infinite; animation-delay: -1.8s; }
        .boss1-bg-meteors { transform-origin: 49% 29%; animation: boss1-meteors-breathe 6.7s ease-in-out infinite; }
        .boss1-bg-star { transform-origin: 60% 23%; animation: boss1-star-pulse 4.1s ease-in-out infinite alternate; }
        .boss2-background { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; isolation: isolate; }
        .boss2-bg-layer, .boss2-bg-mask { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .boss2-bg-layer { object-fit: cover; will-change: transform, opacity, filter; }
        .boss2-bg-mask { -webkit-mask-image: var(--boss2-bg-mask); mask-image: var(--boss2-bg-mask); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: cover; mask-size: cover; will-change: background-position, opacity; }
        .boss2-bg-base { z-index: 0; }
        .boss2-bg-chameleon { z-index: 1; transition: filter 760ms ease-in-out; }
        .boss2-bg-chameleon.is-green { filter: sepia(0.92) hue-rotate(68deg) saturate(2.4) brightness(1.05); }
        .boss2-bg-chameleon.is-cyan { filter: sepia(0.44) hue-rotate(142deg) saturate(2.45) brightness(1.04); }
        .boss2-bg-chameleon.is-blue { filter: sepia(0.68) hue-rotate(184deg) saturate(2.35) brightness(1.03); }
        .boss2-bg-chameleon.is-violet { filter: sepia(0.78) hue-rotate(226deg) saturate(2.5) brightness(1.05); }
        .boss2-bg-chameleon.is-pink { filter: sepia(0.86) hue-rotate(286deg) saturate(2.45) brightness(1.06); }
        .boss2-bg-chameleon.is-orange { filter: sepia(0.95) hue-rotate(332deg) saturate(2.4) brightness(1.08); }
        .boss2-bg-chameleon.is-gold { filter: sepia(1) hue-rotate(8deg) saturate(2.15) brightness(1.1); }
        .boss2-bg-chameleon.is-red { filter: sepia(1) hue-rotate(302deg) saturate(2.3) brightness(1.06); }
        .boss2-bg-out-colours { z-index: 2; animation: boss2-out-colours-blink 5.8s ease-in-out infinite; }
        .boss2-bg-point { z-index: 1; }
        .boss2-bg-point-rainbow { z-index: 2; opacity: 0.82; background: linear-gradient(120deg, #ff304d, #ff8a22, #ffe942, #51e86f, #39d9ff, #3d6fff, #b449ff, #ff35aa, #ff304d); background-size: 360% 100%; mix-blend-mode: normal; animation: boss2-point-rainbow-flow 8.2s linear infinite; }
        .boss2-bg-point-detail { z-index: 3; opacity: 0.42; }
        .boss2-bg-rainbow { z-index: 4; }
        .boss2-bg-rainbow-detail { z-index: 5; opacity: 0.68; }
        .boss2-bg-rainbow-wave, .boss2-bg-rainbow-wave-glow { z-index: 6; opacity: 0; background: repeating-linear-gradient(105deg, rgba(255,42,68,0.72) 0%, rgba(255,42,68,0.72) 8%, rgba(255,220,46,0.84) 17%, rgba(75,236,104,0.86) 33%, rgba(45,218,255,0.86) 49%, rgba(57,100,255,0.82) 65%, rgba(179,64,255,0.72) 81%, rgba(255,42,68,0.72) 96%); background-size: 150% 100%; background-position: 0% 50%; mix-blend-mode: color; }
        .boss2-bg-rainbow-wave.is-active { animation: boss2-rainbow-wave-pass 2.7s ease-in-out both; }
        .boss2-bg-rainbow-wave-glow { z-index: 7; filter: blur(4px); mix-blend-mode: screen; }
        .boss2-bg-rainbow-wave-glow.is-active { animation: boss2-rainbow-wave-glow-pass 2.7s ease-in-out both; }
        .boss2-bg-smoke { z-index: 9; transform-origin: 84% 20%; animation: boss2-smoke-drift 7.6s ease-in-out infinite; }
        .boss2-bg-smoke-two { z-index: 10; transform-origin: 77% 16%; animation: boss2-smoke-two-drift 9.4s ease-in-out -3.2s infinite; }
        .raid-boss-background { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; isolation: isolate; }
        .raid-boss-bg-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
        .raid-boss-bg-base { z-index: 0; }
        .raid-boss-bg-flag { z-index: 1; transform-origin: 51.2% 19%; will-change: transform; animation: raid-boss-bg-flag-wave 3.45s ease-in-out infinite; }
        .raid-boss-bg-eyes { z-index: 2; transform-origin: 19.7% 36.3%; transition: transform 42ms ease-in-out; will-change: transform; }
        .raid-boss-bg-eyes.is-closed { transform: scaleY(0.05); }
        .raid-boss-bg-debris { z-index: 3; transform-origin: 45% 12.5%; will-change: transform; animation: raid-boss-bg-debris-drift 11.7s ease-in-out -2.4s infinite; }
        .raid-boss-bg-lamp { z-index: 4; transform-origin: 49% 6%; will-change: opacity, filter; animation: raid-boss-bg-lamp-alarm 2.07s ease-in-out -0.54s infinite; }
        .raid-boss-bg-slime { z-index: 5; will-change: filter; animation: raid-boss-bg-slime-pulse 3.14s ease-in-out -1.12s infinite; }
        .raid-boss-bg-slime.is-impulsing { animation: raid-boss-bg-slime-impulse 420ms ease-out both; }
        .shork-background { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; isolation: isolate; }
        .shork-bg-layer, .shork-bg-lightboard-glow, .shork-bg-screen-glow, .shork-bg-screen-noise, .shork-bg-screen-grain, .shork-bg-screen-band { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .shork-bg-layer { object-fit: cover; }
        .shork-bg-base { z-index: 0; }
        .shork-bg-big-planet { z-index: 1; transform-origin: 86.3% 5%; will-change: transform; animation: shork-bg-big-planet-breathe 13.5s ease-in-out infinite; }
        .shork-bg-mini-planet { z-index: 2; transform-origin: 28.5% 3.8%; will-change: transform; animation: shork-bg-mini-planet-breathe 17.2s ease-in-out -6.1s infinite; }
        .shork-bg-crane { z-index: 3; transform-origin: 15.6% 2.4%; will-change: transform; animation: shork-bg-crane-swing 5.2s ease-in-out -1.8s infinite; }
        .shork-bg-lightboard-base { z-index: 4; background: transparent; }
        .shork-bg-lightboard-glow { z-index: 5; background: rgba(255,224,142,0.9); -webkit-mask-image: var(--shork-lightboard-mask); mask-image: var(--shork-lightboard-mask); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: cover; mask-size: cover; opacity: var(--shork-lightboard-emission, 0.36); filter: drop-shadow(0 0 3px rgba(255,224,142,0.56)) drop-shadow(0 0 7px rgba(255,224,142,0.28)); transition: opacity 38ms linear; will-change: opacity; }
        .shork-bg-screen-glow, .shork-bg-screen-noise, .shork-bg-screen-grain, .shork-bg-screen-band { -webkit-mask-image: var(--shork-screen-mask); mask-image: var(--shork-screen-mask); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: cover; mask-size: cover; }
        .shork-bg-screen-glow { z-index: 5; background: rgba(246,249,255,0.72); opacity: var(--shork-screen-glow, 0.5); filter: drop-shadow(0 0 1px rgba(255,255,255,0.95)) drop-shadow(0 0 5px rgba(235,242,255,0.58)) drop-shadow(0 0 10px rgba(235,242,255,0.25)); mix-blend-mode: screen; will-change: opacity, filter; }
        .shork-bg-screen { z-index: 6; filter: brightness(var(--shork-screen-brightness, 1.15)) contrast(1.08); will-change: filter; }
        .shork-bg-screen-noise { z-index: 7; background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.62) 0 1px, rgba(18,22,28,0.42) 1px 2px, rgba(174,184,194,0.28) 2px 3px), repeating-linear-gradient(0deg, transparent 0 7px, rgba(255,255,255,0.32) 7px 8px, transparent 8px 12px), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 1px, rgba(0,0,0,0.1) 1px 3px); background-size: 6px 4px, 100% 12px, 5px 100%; background-blend-mode: screen, normal, normal; mix-blend-mode: overlay; will-change: background-position, opacity, filter, transform; animation: shork-bg-screen-static 160ms steps(3, end) infinite; }
        .shork-bg-screen-noise.is-glitching { animation: shork-bg-screen-glitch 100ms steps(2, end) both; }
        .shork-bg-screen-grain { z-index: 8; background-image: repeating-linear-gradient(90deg, rgba(0,0,0,0.32) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,0.16) 3px 4px); background-size: 5px 4px, 100% 5px; mix-blend-mode: multiply; animation: shork-bg-screen-grain 110ms steps(2, end) infinite; }
        .shork-bg-screen-band { z-index: 9; opacity: 0; background-image: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.12) 26%, rgba(255,255,255,0.82) 50%, rgba(255,255,255,0.12) 74%, transparent 100%); background-repeat: no-repeat; background-size: 100% 7%; mix-blend-mode: screen; }
        .shork-bg-screen-band.is-active { animation: shork-bg-screen-band-pass 700ms linear both; }
        .shork-bg-lamp { z-index: 10; will-change: opacity, filter; animation: shork-bg-lamp-glow 3.1s ease-in-out -0.8s infinite; }
        .shork-bg-eye { z-index: 11; transform-origin: 96.8% 48.4%; transition: transform 42ms ease-in-out; will-change: transform; }
        .shork-bg-eye.is-blinking { transform: scaleY(0.05); }
        .shork-bg-slime { z-index: 12; will-change: filter; animation: shork-bg-slime-pulse 3.6s ease-in-out -1.4s infinite; }
        .shork-bg-slime.is-impulsing { animation: shork-bg-slime-impulse 420ms ease-out both; }
        .boss-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
        .boss-layer-aura { animation: boss-aura-pulse 3.3s ease-in-out infinite alternate; }
        .boss-layer-tail { transform-origin: 49% 52%; animation: boss-tail-idle 3.6s ease-in-out infinite alternate; }
        .boss-layer-left-arm { transform-origin: 31% 33%; animation: boss-left-arm-idle 2.8s ease-in-out infinite alternate; }
        .boss-layer-right-arm { transform-origin: 69% 33%; animation: boss-right-arm-idle 3.1s ease-in-out infinite alternate; }
        .boss-layer-bell { transform-origin: 34% 45%; animation: boss-bell-idle 2.2s ease-in-out infinite alternate; }
        .boss-layer-body { animation: boss-body-float 3.2s ease-in-out infinite alternate; }
        .boss-layer-head { transform-origin: 50% 88%; animation: boss-head-idle 2.7s ease-in-out infinite alternate; }
        .boss-layer-eyes-green { animation: boss-eyes-pulse 2.1s ease-in-out infinite alternate; mix-blend-mode: screen; }
        .boss-layer-eyes-red { opacity: 0; mix-blend-mode: screen; }
        .poison-hit .boss-layer-eyes-green { opacity: 1 !important; filter: brightness(1.45) drop-shadow(0 0 10px rgba(164,255,84,0.65)); }
        .poison-hit .boss-layer-aura { filter: brightness(1.24); opacity: 0.85; }
        .big-poison-hit { animation: boss-shake 0.28s ease-in-out 2; }
        .big-poison-hit .boss-layer-eyes-green { opacity: 0 !important; }
        .big-poison-hit .boss-layer-eyes-red { opacity: 1 !important; filter: brightness(1.35) drop-shadow(0 0 12px rgba(255,48,48,0.8)); }
        .big-poison-hit .boss-layer-head { animation: boss-head-twitch 0.3s ease-in-out, boss-head-idle 2.7s ease-in-out infinite alternate; }
        .boss1-composite { isolation: isolate; will-change: transform; }
        .boss1-layer, .boss1-rig { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
        .boss1-layer { pointer-events: none; }
        .boss1-new-body { animation: boss1-body-breathe 3.6s ease-in-out infinite alternate; transform-origin: 50% 62%; will-change: transform; }
        .boss1-head-rig { transform-origin: 50% 42%; animation: boss1-head-idle 2.75s ease-in-out infinite alternate; will-change: transform; }
        .boss1-head-label { transform-origin: 50% 36%; }
        .boss1-hand-rig { transform-origin: 38% 31%; animation: boss1-hand-idle 3.25s ease-in-out infinite alternate; will-change: transform; }
        .boss1-head-slime { animation: boss1-head-slime-pulse 4.7s ease-in-out infinite; will-change: opacity, filter; }
        .boss1-hand-slime { animation: boss1-hand-slime-pulse 5.3s ease-in-out infinite; will-change: opacity, filter; }
        .boss1-return-stamp { z-index: 3; opacity: 0.42; filter: saturate(0.82) brightness(0.9) drop-shadow(0 0 3px rgba(255,54,54,0.35)); pointer-events: none; }
        .boss1-red-eyes { z-index: 4; opacity: 0; pointer-events: none; }
        .boss1-hit-flash { position: absolute; inset: 17%; z-index: 2; pointer-events: none; opacity: 0; background: radial-gradient(ellipse at 50% 42%, rgba(255,76,76,0.32) 0%, rgba(255,44,44,0.08) 36%, transparent 68%); mix-blend-mode: screen; }
        .boss1-composite.boss1-hit { animation: boss1-hit-shake 0.23s ease-out; }
        .boss1-composite.boss1-hit .boss1-hit-flash { animation: boss1-hit-flash 0.23s ease-out; }
        .boss1-composite.boss1-hit .boss1-red-eyes { animation: boss1-red-eyes-hit 0.42s ease-out; }
        .boss1-composite.boss1-hit .boss1-return-stamp { transform-origin: 62% 53%; animation: boss1-stamp-hit 0.45s ease-out; }
        .boss2-composite { isolation: isolate; will-change: transform; }
        .boss2-layer, .boss2-belly-rig, .boss2-head-rig { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; will-change: transform, filter; }
        .boss2-mask { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; -webkit-mask-image: var(--boss2-mask); mask-image: var(--boss2-mask); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: 100% 100%; mask-size: 100% 100%; will-change: background-position, filter, opacity; }
        .boss2-wing { z-index: 1; transform-origin: 47% 48%; animation: boss2-wing-idle 4.8s ease-in-out infinite alternate; }
        .boss2-body { z-index: 2; }
        .boss2-belly-rig { z-index: 3; }
        .boss2-belly-rainbow-mask { z-index: 1; opacity: 0.76; background: linear-gradient(115deg, #ff2f4d, #ff8a25, #ffe94d, #50e873, #42d9ff, #4274ff, #b84cff, #ff2f9d, #ff2f4d); background-size: 320% 100%; mix-blend-mode: color; animation: boss2-belly-rainbow-flow 4.6s linear infinite alternate; }
        .boss2-belly-detail { z-index: 2; opacity: 0.52; }
        .boss2-cube { transform-origin: 61% 49%; animation: boss2-cube-float 3.8s ease-in-out infinite; }
        .boss2-orb-one, .boss2-orb-two { transform: none; }
        .boss2-orb-one-glow, .boss2-orb-two-glow { z-index: 4; background-image: radial-gradient(circle at 22% 23%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.28) 13%, transparent 31%), linear-gradient(120deg, rgba(92,204,255,0.18), rgba(255,255,255,0.55), rgba(102,255,182,0.2)); background-size: 210% 210%, 260% 100%; mix-blend-mode: screen; }
        .boss2-orb-one-glow { animation: boss2-orb-one-light 2.7s ease-in-out infinite; }
        .boss2-orb-two-glow { animation: boss2-orb-two-light 3.35s ease-in-out -0.8s infinite; }
        .boss2-head-rig { z-index: 4; transform-origin: 66% 35%; animation: boss2-head-idle 3.35s ease-in-out infinite alternate; }
        .boss2-head-hit { opacity: 0; }
        .boss2-composite.boss2-hit .boss2-head-standard { opacity: 0; }
        .boss2-composite.boss2-hit .boss2-head-hit { opacity: 1; }
        .boss2-horns { transform-origin: 66% 24%; animation: boss2-horns-glow 4.1s ease-in-out -0.7s infinite alternate; }
        .boss2-slime, .boss2-slime-rainbow-mask, .boss2-slime-detail { transform-origin: top center; }
        .boss2-slime-rainbow-mask { z-index: 3; opacity: 0.9; background: linear-gradient(110deg, #ff2745, #ff8b24, #ffe94c, #4fec71, #36dcff, #3a72ff, #ae46ff, #ff2faa, #ff2745); background-size: 360% 100%; mix-blend-mode: screen; animation: boss2-slime-rainbow-flow 2.8s linear infinite alternate; }
        .boss2-slime-detail { z-index: 3; opacity: 0.38; }
        .boss2-arm-one { z-index: 5; transform-origin: 26% 64%; animation: boss2-arm-one-idle 2.7s ease-in-out infinite alternate; }
        .boss2-arm-two { z-index: 6; transform-origin: 86% 57%; animation: boss2-arm-two-idle 3.25s ease-in-out -1.35s infinite alternate; }
        .boss2-composite.boss2-hit .boss2-horns { animation: boss2-horns-wing-vibrate 0.46s linear; }
        .boss2-composite.boss2-hit .boss2-wing { animation: boss2-wing-hit-vibrate 0.4s ease-out; }
        .worm-background { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; isolation: isolate; }
        .worm-bg-layer, .worm-bg-mask { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .worm-bg-layer { object-fit: cover; }
        .worm-bg-mask { -webkit-mask-image: var(--worm-bg-mask); mask-image: var(--worm-bg-mask); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: cover; mask-size: cover; }
        .worm-bg-base { z-index: 0; }
        .worm-bg-eye-base { z-index: 1; }
        .worm-bg-pupil { z-index: 2; transform: translate(var(--worm-pupil-x, 0), var(--worm-pupil-y, 0)); transition: transform var(--worm-pupil-duration, 480ms) ease-in-out; will-change: transform; }
        .worm-bg-blink-eye { z-index: 3; }
        .worm-bg-blink-lid { position: absolute; inset: 0; z-index: 4; background: #92484D; -webkit-mask-image: var(--worm-bg-mask); mask-image: var(--worm-bg-mask); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: cover; mask-size: cover; clip-path: inset(13.754% 0 86.246% 0); transition: clip-path 60ms ease-in; pointer-events: none; }
        .worm-bg-blink-lid.is-closed { clip-path: inset(11.605% 0 86.246% 0); }
        .worm-bg-pendulum-eye { z-index: 5; transform-origin: 82.9% 0%; animation: worm-bg-pendulum 5.1s ease-in-out -1.4s infinite; will-change: transform; }
        .worm-bg-wheel { z-index: 6; transform-origin: 51.1% 4%; animation: worm-bg-wheel-stuck 5.3s ease-in-out -0.8s infinite; will-change: transform; }
        .worm-bg-wheel.is-lurching { animation: worm-bg-wheel-lurch 680ms ease-out both; }
        .worm-bg-red-lamp-base { z-index: 7; background: transparent; }
        .worm-bg-red-lamp-glow { position: absolute; inset: 0; z-index: 8; background: rgba(255,58,48,0.9); -webkit-mask-image: var(--worm-bg-mask); mask-image: var(--worm-bg-mask); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: cover; mask-size: cover; animation: worm-bg-redlamp-glow 1.63s ease-in-out -0.31s infinite; will-change: opacity, filter; }
        .worm-bg-cone { z-index: 9; transform-origin: 33.4% 4%; animation: worm-bg-cone-stuck 7.2s ease-in-out -2.2s infinite; will-change: transform; }
        .worm-bg-cow { z-index: 10; transform-origin: 38.51% 8.56%; animation: worm-bg-cow-stuck 8.4s ease-in-out -3.7s infinite; will-change: transform; }
        .worm-bg-cow.is-jolting { animation: worm-bg-cow-jolt 950ms cubic-bezier(0.22, 0.72, 0.28, 1) both; }
        .worm-bg-slime-base { z-index: 10; background: transparent; }
        .worm-bg-slime-sheen { z-index: 11; background-image: linear-gradient(102deg, transparent 0%, rgba(218,255,84,0.05) 28%, rgba(231,255,111,0.48) 48%, rgba(197,255,69,0.14) 64%, transparent 82%); background-size: 250% 100%; background-repeat: no-repeat; animation: worm-bg-slime-sheen 4.3s ease-in-out -1.2s infinite; will-change: background-position, opacity; }
        .worm-bg-slime-sheen.is-impulsing { animation: worm-bg-slime-impulse 400ms ease-out both; }
        .worm-bg-waterfall-base { z-index: 12; background: transparent; }
        .worm-bg-waterfall-flow { z-index: 13; background-image: repeating-linear-gradient(180deg, transparent 0 10px, rgba(236,255,124,0.36) 12px 17px, transparent 21px 35px), repeating-linear-gradient(180deg, transparent 0 28px, rgba(196,255,62,0.24) 31px 39px, transparent 44px 64px); background-size: 100% 54px, 100% 96px; animation: worm-bg-waterfall-flow 1.1s linear infinite; will-change: background-position; }
        .worm-bg-waterfall-surge { z-index: 14; opacity: 0; background-image: linear-gradient(180deg, transparent 0%, rgba(240,255,146,0.1) 30%, rgba(244,255,170,0.68) 50%, rgba(207,255,77,0.16) 70%, transparent 100%); background-size: 100% 18%; background-repeat: no-repeat; }
        .worm-bg-waterfall-surge.is-active { animation: worm-bg-waterfall-surge 820ms linear both; }
        .sporgol-background { position:absolute; inset:0; z-index:0; overflow:hidden; pointer-events:none; isolation:isolate; }
        .sporgol-bg-layer { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; pointer-events:none; }
        .sporgol-bg-base { z-index:0; }
        .sporgol-bg-moon { z-index:1; transform-origin:75% 10%; animation:sporgol-bg-moon-breathe 12.4s cubic-bezier(.45,0,.55,1) -2.8s infinite, sporgol-bg-moon-light 9.1s ease-in-out -5.4s infinite; will-change:transform,filter; }
        .sporgol-bg-planet { z-index:2; transform-origin:var(--planet-origin); will-change:transform; }
        .sporgol-bg-planet-one { --planet-origin:29% 10%; clip-path:inset(7% 66% 85% 25%); animation:sporgol-bg-planet-one 7.5s ease-in-out -1.1s infinite; }
        .sporgol-bg-planet-two { --planet-origin:44% 18%; clip-path:inset(15% 51% 77% 41%); animation:sporgol-bg-planet-two 9.2s ease-in-out -4.6s infinite; }
        .sporgol-bg-planet-three { --planet-origin:46% 32%; clip-path:inset(28% 50% 65% 43%); animation:sporgol-bg-planet-three 8.4s ease-in-out -2.9s infinite; }
        .sporgol-bg-mushroom { z-index:3; transform-origin:93% 64%; }
        .sporgol-bg-mushroom.is-shaking { animation:sporgol-bg-mushroom-shake 1.05s cubic-bezier(.36,.03,.64,.98) both; }
        .sporgol-bg-hand { z-index:4; transform-origin:29.7% 79%; animation:sporgol-bg-hand-sway 3.7s cubic-bezier(.45,0,.55,1) -.9s infinite; will-change:transform; }
        .sporgol-bg-eye { z-index:5; }
        .sporgol-bg-pupil { z-index:6; transform:translate(var(--sporgol-pupil-x,0),var(--sporgol-pupil-y,0)); transition:transform var(--sporgol-pupil-duration,360ms) cubic-bezier(.35,0,.2,1); will-change:transform; }
        .worm-composite { isolation: isolate; width: min(398px, calc(100vw - 16px)); aspect-ratio: 1373 / 1145; }
        .worm-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; will-change: transform, filter; }
        .worm-base { z-index: 0; }
        .worm-belly { z-index: 1; transform-origin: 56.8% 64.5%; animation: worm-belly-digest 4.1s ease-in-out -1.3s infinite; }
        .worm-belly.is-bubbling { animation: worm-belly-bubble 440ms ease-out both; }
        .worm-teeth { z-index: 2; transform-origin: 63.9% 56.5%; }
        .worm-teeth.is-chomping { animation: worm-teeth-chomp 560ms ease-in-out both; }
        .worm-teeth.is-snapping { animation: worm-teeth-snap 220ms ease-out both; }
        .worm-stalk-eye { z-index: 3; transform-origin: 49.7% 24.7%; animation: worm-stalk-sway 4.6s ease-in-out -1.15s infinite; }
        .worm-big-eye { z-index: 4; transform-origin: 73.7% 5.5%; transition: transform 42ms ease-in-out; }
        .worm-big-eye.is-blinking { transform: scaleY(0.05); }
        .worm-saw-mouth { z-index: 5; transform-origin: 32.6% 39.3%; animation: worm-saw-spin 2.75s linear infinite; }
        .worm-saw-mouth.is-boosting { animation-duration: 1.35s; }
        .worm-parasite { z-index: 6; transform-origin: 72.8% 62.7%; }
        .worm-parasite.is-twitching { animation: worm-parasite-twitch 820ms ease-in-out both; }
        .worm-slime { z-index: 7; animation: worm-slime-glow 3.4s ease-in-out -0.9s infinite; }
        .worm-slime.is-impulsing { animation: worm-slime-impulse 420ms ease-out both; }
        @media (min-width: 640px) { .worm-composite { width: min(492px, calc(100vw - 48px)); } }
        @keyframes sporgol-large-mushroom-idle { 0%,100% { transform: scale(1); } 30% { transform: scaleX(1.02) scaleY(1.05); } 66% { transform: scaleX(1.01) scaleY(1.02); } }
        @keyframes sporgol-spore-cluster-idle { 0%,100% { transform: scale(1); } 27% { transform: scale(1.1); } 58% { transform: scale(.97); } 80% { transform: scale(1.06); } }
        @keyframes sporgol-spore-one-idle { 0%,100% { transform:translateY(0) scale(1); filter:drop-shadow(0 0 2px rgba(75,226,255,.34)); } 31% { transform:translateY(-1px) scale(1.035); filter:drop-shadow(0 0 4px rgba(75,226,255,.58)); } 62% { transform:scale(1.01); filter:drop-shadow(0 0 5px rgba(75,226,255,.65)); } 84% { transform:translateY(-1px) scale(1.045); filter:drop-shadow(0 0 5px rgba(75,226,255,.56)); } }
        @keyframes sporgol-spore-two-idle { 0%,100% { transform:translateX(0) rotate(0deg) scale(1); filter:drop-shadow(0 0 3px rgba(75,226,255,.4)); } 23% { transform:translateX(1px) rotate(.7deg) scale(1.05); filter:drop-shadow(0 0 6px rgba(75,226,255,.7)); } 47% { transform:translateX(-.5px) rotate(-.5deg) scale(.985); filter:drop-shadow(0 0 4px rgba(75,226,255,.55)); } 72% { transform:translateX(.3px) rotate(.2deg) scale(1.025); filter:drop-shadow(0 0 7px rgba(75,226,255,.7)); } }
        @keyframes sporgol-spore-three-idle { 0%,100% { transform:scaleX(1) scaleY(1); filter:drop-shadow(0 0 2px rgba(75,226,255,.3)); } 38% { transform:scaleX(1.02) scaleY(1.055); filter:drop-shadow(0 0 5px rgba(75,226,255,.58)); } 53% { transform:scaleX(1.02) scaleY(1.055); filter:drop-shadow(0 0 7px rgba(75,226,255,.72)); } 74% { transform:scaleX(1.008) scaleY(1.015); filter:drop-shadow(0 0 4px rgba(75,226,255,.44)); } }
        @keyframes sporgol-spore-four-idle { 0%,100% { transform:translateY(0) scale(1); filter:drop-shadow(0 0 3px rgba(75,226,255,.42)); } 20% { transform:translateY(-1px) scale(1.04); filter:drop-shadow(0 0 5px rgba(75,226,255,.65)); } 39% { transform:translateY(.5px) scale(1.01); filter:drop-shadow(0 0 4px rgba(75,226,255,.48)); } 61% { transform:translateY(-1px) scale(1.055); filter:drop-shadow(0 0 7px rgba(75,226,255,.78)); } 80% { transform:translateY(.5px) scale(.995); filter:drop-shadow(0 0 3px rgba(75,226,255,.4)); } }
        @keyframes sporgol-spore-five-idle { 0%,100% { transform:translateX(0) rotate(-.5deg) scaleX(1) scaleY(1); filter:drop-shadow(0 0 2px rgba(75,226,255,.32)); } 29% { transform:translateX(.5px) rotate(.5deg) scaleX(1.035) scaleY(.985); filter:drop-shadow(0 0 5px rgba(75,226,255,.58)); } 58% { transform:translateX(-.5px) rotate(-.25deg) scaleX(.995) scaleY(1.04); filter:drop-shadow(0 0 6px rgba(75,226,255,.68)); } 80% { transform:translateX(.3px) rotate(-.4deg) scaleX(1.012) scaleY(1.015); filter:drop-shadow(0 0 4px rgba(75,226,255,.42)); } }
        @keyframes sporgol-spore-six-idle { 0%,100% { transform:scale(1); filter:drop-shadow(0 0 3px rgba(75,226,255,.45)); } 27% { transform:scale(1.03); filter:drop-shadow(0 0 6px rgba(75,226,255,.68)); } 54% { transform:scale(.99); filter:drop-shadow(0 0 4px rgba(75,226,255,.46)); } 76% { transform:scale(1.04); filter:drop-shadow(0 0 7px rgba(75,226,255,.78)); } }
        @keyframes sporgol-spore-six-surge { 0%,100% { transform:scale(1); filter:drop-shadow(0 0 4px rgba(75,226,255,.55)); } 30% { transform:scale(1.08); filter:drop-shadow(0 0 9px rgba(75,226,255,.84)); } 55% { transform:scale(.985); filter:drop-shadow(0 0 6px rgba(75,226,255,.65)); } 76% { transform:scale(1.05); filter:drop-shadow(0 0 8px rgba(75,226,255,.76)); } }
        @keyframes sporgol-spore-idle { 0%,100% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(77,220,255,.4)); } 32% { transform: scale(1.06); filter: drop-shadow(0 0 8px rgba(83,231,255,.82)); } 61% { transform: scale(1.02); filter: drop-shadow(0 0 5px rgba(77,220,255,.58)); } 82% { transform: scale(1.08); filter: drop-shadow(0 0 10px rgba(83,231,255,.92)); } }
        @keyframes sporgol-tongue-idle { 0%,100% { transform:rotate(-2deg) scaleX(1) scaleY(1); } 25% { transform:rotate(3deg) scaleX(.985) scaleY(1.04); } 53% { transform:rotate(-1deg) scaleX(1) scaleY(1.01); } 78% { transform:rotate(2deg) scaleX(.98) scaleY(1.06); } }
        @keyframes sporgol-tongue-tick { 0%,100% { transform:rotate(0) scale(1); } 45% { transform:rotate(4deg) scaleX(.99) scaleY(1.025); } }
        @keyframes sporgol-leg-idle { 0%,100% { transform:rotate(-1deg); } 32% { transform:rotate(1.4deg); } 63% { transform:rotate(-.7deg); } 82% { transform:rotate(.6deg); } }
        @keyframes sporgol-foot-idle { 0%,100% { transform:scaleX(1) scaleY(1); } 28% { transform:scaleX(1.045) scaleY(1.07); } 57% { transform:scaleX(1.018) scaleY(1.025); } 80% { transform:scaleX(1.055) scaleY(1.08); } }
        .sporgol-composite { isolation:isolate; width:min(330px,calc(100vw - 32px)); aspect-ratio:1024 / 1536; }
        .sporgol-layer { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; pointer-events:none; will-change:transform,filter,opacity; }
        .sporgol-body { z-index:1; }
        .sporgol-large-mushroom { z-index:1; transform-origin:19% 31%; animation:sporgol-large-mushroom-idle 2.6s ease-in-out -.5s infinite; }
        .sporgol-eye { z-index:2; }
        .sporgol-pupil { z-index:3; transform:translate(var(--look-x),var(--look-y)); transition:transform 620ms cubic-bezier(.35,0,.2,1); }
        .sporgol-pupil-two { transition-duration:730ms; }
        .sporgol-pupil-three { transition-duration:540ms; }
        .sporgol-spore-individual { z-index:4; transform-origin:center; }
        .sporgol-spore-one { animation:sporgol-spore-one-idle 5.5s ease-in-out -.7s infinite; }
        .sporgol-spore-two { animation:sporgol-spore-two-idle 3.2s cubic-bezier(.45,.04,.55,.96) -1.1s infinite; }
        .sporgol-spore-three { animation:sporgol-spore-three-idle 5.8s ease-in-out -2.3s infinite; }
        .sporgol-spore-four { animation:sporgol-spore-four-idle 4.3s ease-in-out -.25s infinite; }
        .sporgol-spore-five { animation:sporgol-spore-five-idle 5.4s ease-in-out -1.8s infinite; }
        .sporgol-spore-six { animation:sporgol-spore-six-idle 4.7s ease-in-out -.4s infinite; }
        .sporgol-spore-six.is-surging { animation:sporgol-spore-six-surge 680ms ease-out both; }
        .sporgol-spore { z-index:5; transform-origin:14% 58%; animation:sporgol-spore-idle 4.2s ease-in-out -.8s infinite; }
        .sporgol-cloud-anchor { position:absolute; inset:0; z-index:6; pointer-events:none; }
        .sporgol-cloud { transform-origin:center center; animation:worm-cloud-wave var(--cloud-duration) cubic-bezier(.45,0,.55,1) var(--cloud-delay) infinite; }
        .sporgol-leg { z-index:7; transform-origin:49% 61%; animation:sporgol-leg-idle 3.6s ease-in-out -1.7s infinite; }
        .sporgol-foot { z-index:0; transform-origin:22% 78%; animation:sporgol-foot-idle 4.2s ease-in-out -.9s infinite; }
        .sporgol-tongue { z-index:9; transform-origin:78.5% 47%; animation:sporgol-tongue-idle 3.7s ease-in-out -.65s infinite; }
        .sporgol-tongue.is-ticking { animation:sporgol-tongue-tick 280ms ease-out both; }
        @media (min-width:640px) { .sporgol-composite { width:min(400px,calc(100vw - 48px)); } }
        @keyframes suckhole-hole-spin { to { transform:rotate(360deg); } }
        @keyframes suckhole-hole-breathe { 0%,100% { transform:scale(1); } 50% { transform:scale(1.018); } }
        @keyframes suckhole-worm-writhe { 0%,100% { transform:rotate(0) scaleY(1); } 20% { transform:rotate(-4deg) scaleY(.98); } 42% { transform:rotate(5deg) scaleY(.95); } 64% { transform:rotate(-3deg) scaleY(.98); } 82% { transform:rotate(2deg) scaleY(1); } }
        @keyframes suckhole-bra-sway { 0%,100% { transform:rotate(-3deg); } 50% { transform:rotate(4deg); } }
        @keyframes suckhole-burger-sway { 0%,100% { transform:rotate(-4deg) scale(1); } 48% { transform:rotate(3deg) scale(.97); } }
        @keyframes suckhole-cat-twitch { 0%,100% { transform:rotate(0); } 18% { transform:rotate(-3deg); } 38% { transform:rotate(4deg); } 58% { transform:rotate(-2deg); } 78% { transform:rotate(2deg); } }
        @keyframes suckhole-cow-sway { 0%,100% { transform:rotate(-3deg); } 50% { transform:rotate(3deg); } }
        @keyframes suckhole-duck-sway { 0%,100% { transform:rotate(-5deg) scale(1); } 50% { transform:rotate(4deg) scale(1.015); } }
        @keyframes suckhole-gesture-sway { 0%,100% { transform:rotate(-2.5deg); } 50% { transform:rotate(2.5deg); } }
        @keyframes suckhole-gamepad-glitch { 0%,100% { transform:rotate(0); } 26% { transform:rotate(-2deg); } 51% { transform:rotate(2deg); } 75% { transform:rotate(-1deg); } }
        @keyframes suckhole-green-ass-twitch { 0%,100% { transform:rotate(0) scaleY(1); } 24% { transform:rotate(-3deg) scaleY(.97); } 49% { transform:rotate(4deg) scaleY(1.02); } 73% { transform:rotate(-2deg) scaleY(1); } }
        @keyframes suckhole-big-hand-reach { 0%,100% { transform:rotate(-2deg) scale(1); } 50% { transform:rotate(3deg) scale(1.015); } }
        @keyframes suckhole-mini-hand-twitch { 0%,100% { transform:rotate(0); } 33% { transform:rotate(2deg); } 66% { transform:rotate(-2deg); } }
        @keyframes suckhole-hand-pendulum { 0%,100% { transform:rotate(-4deg); } 50% { transform:rotate(4deg); } }
        @keyframes suckhole-leg-one-pendulum { 0%,100% { transform:rotate(-5deg); } 50% { transform:rotate(3deg); } }
        @keyframes suckhole-leg-two-pendulum { 0%,100% { transform:rotate(4deg); } 50% { transform:rotate(-3deg); } }
        @keyframes suckhole-antenna-signal { 0% { opacity:.25; transform:translate(-50%,-50%) scale(1); box-shadow:0 0 1px rgba(225,250,255,.12); } 1.1% { opacity:1; transform:translate(-50%,-50%) scale(1.06); box-shadow:0 0 5px 2px rgba(255,255,255,.98),0 0 12px 5px rgba(130,224,255,.84); } 2.2%,4% { opacity:.25; transform:translate(-50%,-50%) scale(1); box-shadow:0 0 1px rgba(225,250,255,.12); } 5.1% { opacity:1; transform:translate(-50%,-50%) scale(1.06); box-shadow:0 0 5px 2px rgba(255,255,255,.98),0 0 12px 5px rgba(130,224,255,.84); } 6.2%,21.4% { opacity:.25; transform:translate(-50%,-50%) scale(1); box-shadow:0 0 1px rgba(225,250,255,.12); } 24.3% { opacity:1; transform:translate(-50%,-50%) scale(1.15); box-shadow:0 0 8px 4px rgba(255,255,255,1),0 0 20px 9px rgba(117,220,255,.98); } 27.1%,100% { opacity:.2; transform:translate(-50%,-50%) scale(1); box-shadow:0 0 1px rgba(225,250,255,.1); } }
        @keyframes suckhole-beacon-signal { 0%,1% { opacity:.25; transform:translate(-50%,-50%) scale(1); box-shadow:0 0 1px rgba(255,216,45,.1); } 2.8%,5.5% { opacity:1; transform:translate(-50%,-50%) scale(1.1); box-shadow:0 0 5px 2px rgba(255,250,185,.98),0 0 12px 5px rgba(255,214,30,.94); } 7.8% { opacity:.7; transform:translate(-50%,-50%) scale(1.04); box-shadow:0 0 3px 1px rgba(255,243,119,.8),0 0 8px 3px rgba(255,200,24,.64); } 10%,12.3% { opacity:1; transform:translate(-50%,-50%) scale(1.12); box-shadow:0 0 6px 2px rgba(255,252,198,1),0 0 18px 7px rgba(255,209,25,.96); } 15.7%,100% { opacity:.25; transform:translate(-50%,-50%) scale(1); box-shadow:0 0 1px rgba(255,216,45,.1); } }
        @keyframes suckhole-pizza-sway { 0%,100% { transform:rotate(-4deg) scaleX(1); } 50% { transform:rotate(4deg) scaleX(1.025); } }
        @keyframes suckhole-tentacle-sway { 0%,100% { transform:rotate(-4deg); } 25% { transform:rotate(5deg); } 50% { transform:rotate(-3deg); } 75% { transform:rotate(2deg); } }
        @keyframes suckhole-toilet-tug { 0%,100% { transform:rotate(0) scale(1); } 34% { transform:rotate(-1.5deg) scale(.985); } 65% { transform:rotate(2deg) scale(1.02); } }
        @keyframes suckhole-paper-sway { 0%,100% { transform:rotate(-5deg) scaleX(1); } 50% { transform:rotate(5deg) scaleX(1.035); } }
        .suckhole-composite { isolation:isolate; width:min(330px,calc(100vw - 32px)); aspect-ratio:931 / 1396; }
        .suckhole-layer { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; pointer-events:none; will-change:transform,opacity; }
        .suckhole-leg-one { z-index:1; transform-origin:68% 70%; animation:suckhole-leg-one-pendulum 3.8s ease-in-out -.7s infinite; }
        .suckhole-leg-two { z-index:1; transform-origin:25% 71%; animation:suckhole-leg-two-pendulum 4.6s ease-in-out -2.2s infinite; }
        .suckhole-body { z-index:2; }
        .suckhole-hole-rig { position:absolute; inset:0; z-index:1; transform-origin:center; animation:suckhole-hole-breathe 5.2s cubic-bezier(.45,0,.55,1) -1.7s infinite; will-change:transform; }
        .suckhole-black-hole { transform-origin:center; animation:suckhole-hole-spin 18.3s linear infinite; }
        .suckhole-eye { z-index:4; }
        .suckhole-pupil { z-index:5; transform:translate(var(--suckhole-pupil-x,0),var(--suckhole-pupil-y,0)); transition:transform var(--suckhole-pupil-duration,340ms) cubic-bezier(.35,0,.2,1); }
        .suckhole-big-hand { z-index:6; transform-origin:29% 49%; animation:suckhole-big-hand-reach 4.1s ease-in-out -1.2s infinite; }
        .suckhole-hand { z-index:6; transform-origin:96% 56%; animation:suckhole-hand-pendulum 4.1s cubic-bezier(.45,0,.55,1) -.9s infinite; }
        .suckhole-mini-hand { z-index:6; transform-origin:43% 48%; }
        .suckhole-mini-hand.is-twitching { animation:suckhole-mini-hand-twitch 450ms ease-out both; }
        .suckhole-worm { z-index:7; transform-origin:7% 72%; animation:suckhole-worm-writhe 3.1s cubic-bezier(.45,.04,.55,.96) -1.5s infinite; }
        .suckhole-tentacle { z-index:7; transform-origin:50% 63%; animation:suckhole-tentacle-sway 5.2s cubic-bezier(.45,0,.55,1) -2.7s infinite; }
        .suckhole-antenna { z-index:8; }
        .suckhole-antenna-flash, .suckhole-beacon-flash { position:absolute; z-index:10; border-radius:50%; pointer-events:none; will-change:transform,opacity,box-shadow; mix-blend-mode:screen; }
        .suckhole-antenna-flash { left:71.05%; top:12.32%; width:max(2.4%,8px); aspect-ratio:1; background:#f7feff; animation:suckhole-antenna-signal 5.6s ease-out -.65s infinite; }
        .suckhole-beacon { z-index:9; }
        .suckhole-beacon-flash { left:69.86%; top:19.92%; width:max(2.8%,9px); aspect-ratio:1; background:#fff36b; animation:suckhole-beacon-signal 4.4s ease-out -2.9s infinite; }
        .suckhole-bra { z-index:7; transform-origin:87% 21%; animation:suckhole-bra-sway 5.1s cubic-bezier(.45,0,.55,1) -1.6s infinite; }
        .suckhole-burger { z-index:7; transform-origin:10% 89%; animation:suckhole-burger-sway 6.2s ease-in-out -3.2s infinite; }
        .suckhole-cat { z-index:7; transform-origin:87% 87%; }
        .suckhole-cat.is-twitching { animation:suckhole-cat-twitch 560ms ease-out both; }
        .suckhole-cow { z-index:7; transform-origin:18% 12%; animation:suckhole-cow-sway 6.3s cubic-bezier(.45,0,.55,1) -3.7s infinite; }
        .suckhole-duck { z-index:7; transform-origin:40% 70%; animation:suckhole-duck-sway 5.3s ease-in-out -2.1s infinite; }
        .suckhole-gesture { z-index:7; transform-origin:58% 9%; animation:suckhole-gesture-sway 4.4s cubic-bezier(.45,0,.55,1) -1.4s infinite; }
        .suckhole-gamepad { z-index:7; transform-origin:86% 10%; }
        .suckhole-gamepad.is-glitching { animation:suckhole-gamepad-glitch 420ms ease-out both; }
        .suckhole-green-ass { z-index:7; transform-origin:88% 71%; }
        .suckhole-green-ass.is-twitching { animation:suckhole-green-ass-twitch 720ms ease-out both; }
        .suckhole-pizza { z-index:7; transform-origin:52% 69%; animation:suckhole-pizza-sway 6.1s ease-in-out -4.2s infinite; }
        .suckhole-toilet { z-index:7; transform-origin:60% 66%; }
        .suckhole-toilet.is-tugging { animation:suckhole-toilet-tug 680ms ease-out both; }
        .suckhole-toilet-paper { z-index:7; transform-origin:47% 84%; animation:suckhole-paper-sway 4.1s ease-in-out -2.9s infinite; }
        @media (min-width:640px) { .suckhole-composite { width:min(400px,calc(100vw - 48px)); } }
        .shork-composite { isolation: isolate; }
        .shork-layer, .shork-head-rig { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
        .shork-body { z-index: 1; }
        .shork-banana { z-index: 2; will-change: filter; animation: shork-banana-glow 3.1s ease-in-out -0.6s infinite; }
        .shork-antenna { z-index: 3; transform-origin: 37.3% 2.6%; filter: brightness(0.9) drop-shadow(0 0 2px rgba(164,255,88,0.24)); will-change: transform, filter; }
        .shork-antenna.is-pulsing { animation: shork-antenna-signal 360ms ease-out both; }
        .shork-chair-hand { z-index: 4; transform-origin: 68.6% 36.3%; will-change: transform; animation: shork-chair-hand-idle 3.2s ease-in-out -0.4s infinite; }
        .shork-weapon-hand { z-index: 5; transform-origin: 33.4% 30.6%; will-change: transform; animation: shork-weapon-hand-idle 3.7s ease-in-out -1.3s infinite; }
        .shork-leg { z-index: 6; transform-origin: 58.7% 93.6%; will-change: transform; }
        .shork-leg.is-stomping { animation: shork-leg-stomp 460ms ease-out both; }
        .shork-head-rig { z-index: 7; transform-origin: 66% 31%; will-change: transform; animation: shork-head-idle 4.1s ease-in-out -0.9s infinite; }
        .shork-head { z-index: 1; }
        .shork-eyes { z-index: 2; transform-origin: 69.8% 17.7%; transition: transform 42ms ease-in-out; will-change: transform, opacity; }
        .shork-eyes.is-blinking { transform: scaleY(0.05); }
        .shork-damage-eyes { z-index: 3; opacity: 0; }
        .shork-head-lid { z-index: 4; transform-origin: 84.7% 12.3%; will-change: transform; }
        .shork-head-lid.is-opening { animation: shork-head-lid-open 1.18s ease-in-out both; }
        .shork-fork { z-index: 8; transform-origin: 62% 49.2%; will-change: transform; animation: shork-fork-pendulum 4.3s ease-in-out -1.7s infinite; }
        .shork-composite.shork-hit .shork-head-rig { animation: shork-head-hit 170ms ease-out both; }
        .shork-composite.shork-hit .shork-eyes { opacity: 0; transform: scaleY(1) !important; }
        .shork-composite.shork-hit .shork-damage-eyes { opacity: 1; }
        .raid-boss-composite { isolation: isolate; will-change: transform; }
        .raid-boss-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; will-change: transform, filter, opacity; }
        .raid-boss-wings { z-index: 1; transform-origin: 50% 45%; animation: raid-boss-wings-idle 4.35s ease-in-out infinite; }
        .raid-boss-body { z-index: 2; }
        .raid-boss-tentacle { z-index: 3; }
        .raid-boss-tentacle-one { transform-origin: 49.5% 30%; animation: raid-boss-tentacle-one 2.7s ease-in-out -0.65s infinite; }
        .raid-boss-tentacle-two { transform-origin: 57% 30%; animation: raid-boss-tentacle-two 3.4s ease-in-out -1.3s infinite; }
        .raid-boss-tentacle-three { transform-origin: 63% 30.5%; animation: raid-boss-tentacle-three 2.9s ease-in-out -0.4s infinite; }
        .raid-boss-tentacle-four { transform-origin: 63% 30.5%; animation: raid-boss-tentacle-four 3.7s ease-in-out -1.8s infinite; }
        .raid-boss-tentacle-five { transform-origin: 68% 30.5%; animation: raid-boss-tentacle-five 3.1s ease-in-out -0.9s infinite; }
        .raid-boss-tentacle-six { transform-origin: 60% 31%; animation: raid-boss-tentacle-six 4s ease-in-out -2.2s infinite; }
        .raid-boss-weapon-hand { z-index: 4; transform-origin: 18.5% 54.5%; animation: raid-boss-weapon-hand-idle 3.2s ease-in-out -1.25s infinite; }
        .raid-boss-hand { z-index: 5; transform-origin: 83.5% 57.4%; animation: raid-boss-hand-idle 2.75s ease-in-out infinite; }
        .raid-boss-chain { z-index: 6; transform-origin: 64% 54.7%; animation: raid-boss-chain-idle 3.1s cubic-bezier(0.42,0,0.58,1) infinite; }
        .raid-boss-lock { z-index: 7; transform-origin: 44.5% 49.3%; animation: raid-boss-lock-idle 3.6s cubic-bezier(0.42,0,0.58,1) -1.4s infinite; }
        .raid-boss-crown { z-index: 8; transform-origin: 59% 26.7%; animation: raid-boss-crown-idle 2.65s ease-in-out -0.75s infinite; }
        .raid-boss-head-hit { z-index: 2; opacity: 0; }
        .raid-boss-composite.raid-boss-hit .raid-boss-head-hit { animation: raid-boss-head-hit 160ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .boss1-bg-blue-monitors, .boss1-bg-red-monitor, .boss1-bg-red-lights, .boss1-bg-top-light, .boss1-bg-meteors, .boss1-bg-star, .boss2-bg-out-colours, .boss2-bg-point-rainbow, .boss2-bg-rainbow-wave, .boss2-bg-rainbow-wave-glow, .boss2-bg-smoke, .boss2-bg-smoke-two, .raid-boss-bg-flag, .raid-boss-bg-debris, .raid-boss-bg-lamp, .raid-boss-bg-slime, .shork-bg-big-planet, .shork-bg-mini-planet, .shork-bg-crane, .shork-bg-lightboard, .shork-bg-screen-noise, .shork-bg-lamp, .shork-bg-slime { animation: none !important; }
          .raid-boss-bg-eyes, .raid-boss-bg-eyes.is-closed { transform: none !important; transition: none !important; }
          .shork-bg-eye, .shork-bg-eye.is-blinking { transform: none !important; transition: none !important; }
          .boss1-bg-star { opacity: 0.88; filter: brightness(1.08) drop-shadow(0 0 3px rgba(255,241,158,0.45)); }
          .boss2-composite *, .boss2-composite { animation: none !important; }
          .worm-composite * { animation: none !important; }
          .sporgol-background *, .sporgol-composite * { animation: none !important; }
          .suckhole-composite *, .suckhole-composite { animation: none !important; }
          .sporgol-bg-pupil { transform:none !important; transition:none !important; }
          .sporgol-pupil { transform:none !important; transition:none !important; }
          .suckhole-pupil { transform:none !important; transition:none !important; }
          .worm-big-eye, .worm-big-eye.is-blinking { transform: none !important; transition: none !important; }
          .worm-bg-pendulum-eye, .worm-bg-wheel, .worm-bg-red-lamp-glow, .worm-bg-cone, .worm-bg-cow, .worm-bg-slime-sheen, .worm-bg-waterfall-flow, .worm-bg-waterfall-surge { animation: none !important; }
          .worm-bg-pupil { transform: none !important; transition: none !important; }
          .shork-banana, .shork-antenna, .shork-chair-hand, .shork-weapon-hand, .shork-leg, .shork-head-rig, .shork-head-lid, .shork-fork { animation: none !important; }
          .shork-eyes, .shork-eyes.is-blinking { transform: none !important; transition: none !important; }
          .raid-boss-composite *, .raid-boss-composite { animation: none !important; }
        }
      `}</style>
      </div>
    </AssetStage>
  );
}
