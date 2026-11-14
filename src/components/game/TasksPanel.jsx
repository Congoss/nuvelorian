import GameWindow from './GameWindow';
import { serverNow } from '@/lib/serverClock.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getQuestMission } from '@/lib/questMissionCatalog.js';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Loader2, Lock, MapPinned, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { completeMission } from '@/services/gameApi';
import { calculateEnergy, GAME_CONFIG, getLocalizedBossName } from '@/lib/gameConfig';
import { getQuestLocationUnlock, isQuestLocationUnlocked } from '@/lib/questUnlocks';
import laboratoryBanner from '@/assets/quests/laboratory-banner.png';
import labIcon from '@/assets/optimized/nav-quests.webp';
import missionBanner from '@/assets/quests/ui/mission-banner.png';
import dnkIcon from '@/assets/quests/portal.png';
import flaconIcon from '@/assets/skills/small-poison.png';
import nanochipIcon from '@/assets/optimized/cosmohand.webp';
import plasmBatteryIcon from '@/assets/ui/energy+50.png';
import quantcubeIcon from '@/assets/optimized/paper.webp';
import reactorIcon from '@/assets/boss/boss-ico.png';
import syringeIcon from '@/assets/skills/medium-poison.png';
import dnkFramedIcon from '@/assets/quests/portal.png';
import flaconFramedIcon from '@/assets/skills/small-poison.png';
import nanochipFramedIcon from '@/assets/optimized/cosmohand.webp';
import plasmBatteryFramedIcon from '@/assets/ui/energy+50.png';
import quantcubeFramedIcon from '@/assets/optimized/paper.webp';
import reactorFramedIcon from '@/assets/boss/boss-ico.png';
import syringeFramedIcon from '@/assets/skills/medium-poison.png';
import portalIcon from '@/assets/quests/portal.png';
import tentaclesRewardIcon from '@/assets/optimized/cosmohand.webp';
import treasure1 from '@/assets/box/green-box.png';
import smallPoisonIcon from '@/assets/skills/small-poison.png';
import mediumPoisonIcon from '@/assets/skills/medium-poison.png';
import largePoisonIcon from '@/assets/skills/large-poison.png';
import LootBoxModal from './LootBoxModal';
import MarkerFrame from './MarkerFrame';
import BossKeyIcon from './BossKeyIcon';
import GameTextureButton from './GameTextureButton';
import expUiIcon from '@/assets/ui/EXP.png';
import levelUiIcon from '@/assets/optimized/level.webp';
import energy25Icon from '@/assets/ui/energy+25.png';
import { getResourceIcon } from '@/lib/resourceIcons';
import artifactNamelessLabel from '@/assets/quests/P4 QUESTS/P4-U00/Nameless Label.png';
import artifactBlackBarcode from '@/assets/quests/P4 QUESTS/P4-U00/Black Barcode.png';
import artifactEndlessTape from '@/assets/quests/P4 QUESTS/P4-U00/Endless Tape.png';
import artifactRustyStaple from '@/assets/quests/P4 QUESTS/P4-U00/Rusty Staple.png';
import artifactPostalSeal from '@/assets/quests/P4 QUESTS/P4-U00/Postal Seal.png';
import artifactBottomlessBox from '@/assets/quests/P4 QUESTS/P4-U00/Bottomless Box.png';
import artifactFragileSticker from '@/assets/quests/P4 QUESTS/P4-U00/Green “FRAGILE” Sticker.png';
import artifactWhitePencil from '@/assets/quests/P4 QUESTS/P4-U01/White Pencil.png';
import artifactInkDrop from '@/assets/quests/P4 QUESTS/P4-U01/Ink Drop.png';
import artifactGrayMirror from '@/assets/quests/P4 QUESTS/P4-U01/Gray Mirror.png';
import artifactEmptyPalette from '@/assets/quests/P4 QUESTS/P4-U01/Empty Palette.png';
import artifactBrokenFilter from '@/assets/quests/P4 QUESTS/P4-U01/Broken Filter.png';
import artifactPaintlessCan from '@/assets/quests/P4 QUESTS/P4-U01/Paintless Can.png';
import artifactFirstColorSpark from '@/assets/quests/P4 QUESTS/P4-U01/First Color Spark.png';
import artifactToothFromElsewhere from '@/assets/quests/P4 QUESTS/P4-U03/Tooth From Elsewhere.png';
import artifactWarmStone from '@/assets/quests/P4 QUESTS/P4-U03/Warm Stone.png';
import artifactStickyCoin from '@/assets/quests/P4 QUESTS/P4-U03/Sticky Coin.png';
import artifactEyeInAJar from '@/assets/quests/P4 QUESTS/P4-U03/Eye in a Jar.png';
import artifactBoneWithAHandle from '@/assets/quests/P4 QUESTS/P4-U03/Bone With a Handle.png';
import artifactHeartPlug from '@/assets/quests/P4 QUESTS/P4-U03/Heart Plug.png';
import artifactSlimeThatChoseYou from '@/assets/quests/P4 QUESTS/P4-U03/Slime That Chose You.png';
import artifactSporeUmbrella from '@/assets/quests/P4 QUESTS/P4-U04/Spore Umbrella.png';
import artifactMyceliumMap from '@/assets/quests/P4 QUESTS/P4-U04/Mycelium Map.png';
import artifactBreathingCap from '@/assets/quests/P4 QUESTS/P4-U04/Breathing Cap.png';
import artifactSporeSaltShaker from '@/assets/quests/P4 QUESTS/P4-U04/Spore Salt Shaker.png';
import artifactRootThreadBall from '@/assets/quests/P4 QUESTS/P4-U04/Root Thread Ball.png';
import artifactSuspiciousMushroom from '@/assets/quests/P4 QUESTS/P4-U04/Suspicious Mushroom.png';
import artifactDoNotEatCrown from '@/assets/quests/P4 QUESTS/P4-U04/“Do Not Eat” Crown.png';
import artifactWardenWhistle from '@/assets/quests/P4 QUESTS/P4-U06/Warden Whistle.png';
import artifactCarouselKey from '@/assets/quests/P4 QUESTS/P4-U06/Carousel Key.png';
import artifactNotThisWayChalk from '@/assets/quests/P4 QUESTS/P4-U06/“Not This Way” Chalk.png';
import artifactBottomlessBucket from '@/assets/quests/P4 QUESTS/P4-U06/Bottomless Bucket.png';
import artifactSwingSpring from '@/assets/quests/P4 QUESTS/P4-U06/Swing Spring.png';
import artifactFirstInLineMedal from '@/assets/quests/P4 QUESTS/P4-U06/“First in Line” Medal.png';
import artifactSeniorScoop from '@/assets/quests/P4 QUESTS/P4-U06/Senior Scoop.png';
import artifactNoOffRemote from '@/assets/quests/P4 QUESTS/P4-U07/No-Off Remote.png';
import artifactAntennaWhisker from '@/assets/quests/P4 QUESTS/P4-U07/Antenna Whisker.png';
import artifactRewindMeTape from '@/assets/quests/P4 QUESTS/P4-U07/“Rewind Me” Tape.png';
import artifactTestPatternShard from '@/assets/quests/P4 QUESTS/P4-U07/Test Pattern Shard.png';
import artifactVolumeKnob from '@/assets/quests/P4 QUESTS/P4-U07/Volume Knob.png';
import artifactLiveOnAirBadge from '@/assets/quests/P4 QUESTS/P4-U07/“Live On Air” Badge.png';
import artifactMicCap from '@/assets/quests/P4 QUESTS/P4-U07/Mic Cap.png';
import artifactUsefulBolt from '@/assets/quests/P4 QUESTS/P4-U02/Useful Bolt.png';
import artifactWheelWithoutPlan from '@/assets/quests/P4 QUESTS/P4-U02/Wheel Without a Plan.png';
import artifactStickyTape from '@/assets/quests/P4 QUESTS/P4-U02/Sticky Tape.png';
import artifactMoodSpring from '@/assets/quests/P4 QUESTS/P4-U02/Mood Spring.png';
import artifactDoNotPressButton from '@/assets/quests/P4 QUESTS/P4-U02/“Do Not Press” Button.png';
import artifactUnexplainedCanister from '@/assets/quests/P4 QUESTS/P4-U02/Unexplained Canister.png';
import artifactGoldenNut from '@/assets/quests/P4 QUESTS/P4-U02/Golden Nut.png';
import artifactNoThatWayCompass from '@/assets/quests/P4 QUESTS/P4-U05/“No, That Way” Compass.png';
import artifactUpFallingRock from '@/assets/quests/P4 QUESTS/P4-U05/Up-Falling Rock.png';
import artifactTicketToNowhere from '@/assets/quests/P4 QUESTS/P4-U05/Ticket to Nowhere.png';
import artifactSingularitySpoon from '@/assets/quests/P4 QUESTS/P4-U05/Singularity Spoon.png';
import artifactZeroInAJar from '@/assets/quests/P4 QUESTS/P4-U05/Zero in a Jar.png';
import artifactOwnerlessOrbit from '@/assets/quests/P4 QUESTS/P4-U05/Ownerless Orbit.png';
import artifactEyeThatBlinkedFirst from '@/assets/quests/P4 QUESTS/P4-U05/Eye That Blinked First.png';
import p4u00MiniBanner from '@/assets/quests/P4 QUESTS/MINI BANNERS/P4-U00MB.png';
import p4u01MiniBanner from '@/assets/quests/P4 QUESTS/MINI BANNERS/P4-U01MB.png';
import p4u02MiniBanner from '@/assets/quests/P4 QUESTS/MINI BANNERS/P4-U02MB.png';
import p4u03MiniBanner from '@/assets/quests/P4 QUESTS/MINI BANNERS/P4-U03MB.png';
import p4u04MiniBanner from '@/assets/quests/P4 QUESTS/MINI BANNERS/P4-U04MB.png';
import p4u05MiniBanner from '@/assets/quests/P4 QUESTS/MINI BANNERS/P4-U05MB.png';
import p4u06MiniBanner from '@/assets/quests/P4 QUESTS/MINI BANNERS/P4-U06MB.png';
import p4u07MiniBanner from '@/assets/quests/P4 QUESTS/MINI BANNERS/P4-U07MB.png';
import p4u00BigBanner from '@/assets/quests/P4 QUESTS/BIG BANNERS/P4-U00BB.png';
import p4u01BigBanner from '@/assets/quests/P4 QUESTS/BIG BANNERS/P4-U01BB.png';
import p4u02BigBanner from '@/assets/quests/P4 QUESTS/BIG BANNERS/P4-U02BB.png';
import p4u03BigBanner from '@/assets/quests/P4 QUESTS/BIG BANNERS/P4-U03BB.png';
import p4u04BigBanner from '@/assets/quests/P4 QUESTS/BIG BANNERS/P4-U04BB.png';
import p4u05BigBanner from '@/assets/quests/P4 QUESTS/BIG BANNERS/P4-U05BB.png';
import p4u06BigBanner from '@/assets/quests/P4 QUESTS/BIG BANNERS/P4-U06BB.png';
import p4u07BigBanner from '@/assets/quests/P4 QUESTS/BIG BANNERS/P4-U07BB.png';

const PASSIVE_REWARD_INTERVAL_HOURS = 4;
const LAB_FINAL_KEY_CHANCE = 0.1;
const LAB_FINAL_POISON_CHANCE = 0.01;
const LAB_FINAL_POISON_BY_LOCATION = ['small-poison', 'small-poison', 'medium-poison', 'medium-poison', 'medium-poison', 'large-poison', 'large-poison', 'large-poison'];
const BONUS_ARTIFACT_DROP_CHANCE = 0.05;

const ARTIFACT_ICONS = [
  { icon: dnkIcon, framedIcon: dnkFramedIcon },
  { icon: nanochipIcon, framedIcon: nanochipFramedIcon },
  { icon: flaconIcon, framedIcon: flaconFramedIcon },
  { icon: syringeIcon, framedIcon: syringeFramedIcon },
  { icon: quantcubeIcon, framedIcon: quantcubeFramedIcon },
  { icon: plasmBatteryIcon, framedIcon: plasmBatteryFramedIcon },
  { icon: reactorIcon, framedIcon: reactorFramedIcon },
];

const P4_U00_ARTIFACTS = [
  { icon: artifactNamelessLabel, framedIcon: artifactNamelessLabel, nameI18n: { uk: 'Бірка Без Імені', en: 'Nameless Label', ru: 'Бирка Без Имени' } },
  { icon: artifactBlackBarcode, framedIcon: artifactBlackBarcode, nameI18n: { uk: 'Чорний Штрихкод', en: 'Black Barcode', ru: 'Чёрный Штрихкод' } },
  { icon: artifactEndlessTape, framedIcon: artifactEndlessTape, nameI18n: { uk: 'Скотч Без Кінця', en: 'Endless Tape', ru: 'Бесконечный Скотч' } },
  { icon: artifactRustyStaple, framedIcon: artifactRustyStaple, nameI18n: { uk: 'Іржава Скоба', en: 'Rusty Staple', ru: 'Ржавая Скоба' } },
  { icon: artifactPostalSeal, framedIcon: artifactPostalSeal, nameI18n: { uk: 'Поштова Пломба', en: 'Postal Seal', ru: 'Почтовая Пломба' } },
  { icon: artifactBottomlessBox, framedIcon: artifactBottomlessBox, nameI18n: { uk: 'Коробка Без Дна', en: 'Bottomless Box', ru: 'Коробка Без Дна' } },
  { icon: artifactFragileSticker, framedIcon: artifactFragileSticker, nameI18n: { uk: 'Зелена Наклейка “FRAGILE”', en: 'Green “FRAGILE” Sticker', ru: 'Зелёная Наклейка “FRAGILE”' } },
];

const P4_U00_MISSIONS = [
  { uk: 'Кратер Доставки', en: 'Delivery Crater', ru: 'Кратер Доставки' },
  { uk: 'Чорний Штрихкод', en: 'Black Barcode', ru: 'Чёрный Штрихкод' },
  { uk: 'Склад Забутих Коробок', en: 'Forgotten Boxes Warehouse', ru: 'Склад Забытых Коробок' },
  { uk: 'Скотч і Скоби', en: 'Tape and Staples', ru: 'Скотч и Скобы' },
  { uk: 'Конвеєр Нікуди', en: 'Conveyor to Nowhere', ru: 'Конвейер в Никуда' },
  { uk: 'Пакет із Шипінням', en: 'Hissing Package', ru: 'Шипящая Посылка' },
  { uk: 'Вихід у U01', en: 'Exit to U01', ru: 'Выход в U01' },
];

const P4_U01_ARTIFACTS = [
  { icon: artifactWhitePencil, framedIcon: artifactWhitePencil, nameI18n: { uk: 'Білий Олівець', en: 'White Pencil', ru: 'Белый Карандаш' } },
  { icon: artifactInkDrop, framedIcon: artifactInkDrop, nameI18n: { uk: 'Чорнильна Крапля', en: 'Ink Drop', ru: 'Чернильная Капля' } },
  { icon: artifactGrayMirror, framedIcon: artifactGrayMirror, nameI18n: { uk: 'Сіре Дзеркало', en: 'Gray Mirror', ru: 'Серое Зеркало' } },
  { icon: artifactEmptyPalette, framedIcon: artifactEmptyPalette, nameI18n: { uk: 'Порожня Палітра', en: 'Empty Palette', ru: 'Пустая Палитра' } },
  { icon: artifactBrokenFilter, framedIcon: artifactBrokenFilter, nameI18n: { uk: 'Зламаний Фільтр', en: 'Broken Filter', ru: 'Сломанный Фильтр' } },
  { icon: artifactPaintlessCan, framedIcon: artifactPaintlessCan, nameI18n: { uk: 'Банка Без Фарби', en: 'Paintless Can', ru: 'Банка Без Краски' } },
  { icon: artifactFirstColorSpark, framedIcon: artifactFirstColorSpark, nameI18n: { uk: 'Перша Кольорова Іскра', en: 'First Color Spark', ru: 'Первая Цветная Искра' } },
];

const P4_U01_MISSIONS = [
  { uk: 'Сірий Горизонт', en: 'Gray Horizon', ru: 'Серый Горизонт' },
  { uk: 'Місто Без Фарби', en: 'Paintless City', ru: 'Город Без Краски' },
  { uk: 'Вулиця Білих Тіней', en: 'Street of White Shadows', ru: 'Улица Белых Теней' },
  { uk: 'Чорнильний Провал', en: 'Ink Pit', ru: 'Чернильный Провал' },
  { uk: 'Фабрика Сірого Диму', en: 'Gray Smoke Factory', ru: 'Фабрика Серого Дыма' },
  { uk: 'Музей Зниклого Кольору', en: 'Museum of Lost Color', ru: 'Музей Исчезнувшего Цвета' },
  { uk: 'Брама Наглядача', en: 'Warden’s Gate', ru: 'Врата Надзирателя' },
];

const P4_U03_ARTIFACTS = [
  { icon: artifactToothFromElsewhere, framedIcon: artifactToothFromElsewhere, nameI18n: { uk: 'Зуб Не Звідси', en: 'Tooth From Elsewhere', ru: 'Зуб Не Отсюда' } },
  { icon: artifactWarmStone, framedIcon: artifactWarmStone, nameI18n: { uk: 'Теплий Камінь', en: 'Warm Stone', ru: 'Тёплый Камень' } },
  { icon: artifactStickyCoin, framedIcon: artifactStickyCoin, nameI18n: { uk: 'Липка Монета', en: 'Sticky Coin', ru: 'Липкая Монета' } },
  { icon: artifactEyeInAJar, framedIcon: artifactEyeInAJar, nameI18n: { uk: 'Око В Банці', en: 'Eye in a Jar', ru: 'Глаз В Банке' } },
  { icon: artifactBoneWithAHandle, framedIcon: artifactBoneWithAHandle, nameI18n: { uk: 'Кістка З Ручкою', en: 'Bone With a Handle', ru: 'Кость С Ручкой' } },
  { icon: artifactHeartPlug, framedIcon: artifactHeartPlug, nameI18n: { uk: 'Серцева Пробка', en: 'Heart Plug', ru: 'Сердечная Пробка' } },
  { icon: artifactSlimeThatChoseYou, framedIcon: artifactSlimeThatChoseYou, nameI18n: { uk: 'Слиз, Який Вибрав Тебе', en: 'Slime That Chose You', ru: 'Слизь, Которая Выбрала Тебя' } },
];

const P4_U03_MISSIONS = [
  { uk: 'Вхід Через Горло', en: 'Throat Entrance', ru: 'Вход Через Горло' },
  { uk: 'Липкий Коридор', en: 'Sticky Corridor', ru: 'Липкий Коридор' },
  { uk: 'Ребра З Видом', en: 'Ribs With a View', ru: 'Рёбра С Видом' },
  { uk: 'Озеро Теплого Слизу', en: 'Warm Slime Lake', ru: 'Озеро Тёплой Слизи' },
  { uk: 'Кишеня Забутих Речей', en: 'Pocket of Lost Stuff', ru: 'Карман Забытых Вещей' },
  { uk: 'Серце, Яке Не В Темі', en: 'Heart That Missed the Point', ru: 'Сердце Не В Теме' },
  { uk: 'Вихід, Який Не Вихід', en: 'Exit That Isn’t Exit', ru: 'Выход, Который Не Выход' },
];

const P4_U04_ARTIFACTS = [
  { icon: artifactSporeUmbrella, framedIcon: artifactSporeUmbrella, nameI18n: { uk: 'Спорова Парасолька', en: 'Spore Umbrella', ru: 'Споровый Зонтик' } },
  { icon: artifactMyceliumMap, framedIcon: artifactMyceliumMap, nameI18n: { uk: 'Міцелієва Карта', en: 'Mycelium Map', ru: 'Мицелиевая Карта' } },
  { icon: artifactBreathingCap, framedIcon: artifactBreathingCap, nameI18n: { uk: 'Шапка, Що Дихає', en: 'Breathing Cap', ru: 'Дышащая Шляпка' } },
  { icon: artifactSporeSaltShaker, framedIcon: artifactSporeSaltShaker, nameI18n: { uk: 'Спорова Сільничка', en: 'Spore Salt Shaker', ru: 'Споровая Солонка' } },
  { icon: artifactRootThreadBall, framedIcon: artifactRootThreadBall, nameI18n: { uk: 'Клубок Кореневих Ниток', en: 'Root Thread Ball', ru: 'Клубок Корневых Нитей' } },
  { icon: artifactSuspiciousMushroom, framedIcon: artifactSuspiciousMushroom, nameI18n: { uk: 'Гриб, Який Підозрює', en: 'Suspicious Mushroom', ru: 'Гриб, Который Подозревает' } },
  { icon: artifactDoNotEatCrown, framedIcon: artifactDoNotEatCrown, nameI18n: { uk: 'Корона “Не Їсти”', en: '“Do Not Eat” Crown', ru: 'Корона “Не Есть”' } },
];

const P4_U04_MISSIONS = [
  { uk: 'Перша Пляма', en: 'First Stain', ru: 'Первое Пятно' },
  { uk: 'Ліс Мокрих Шапок', en: 'Forest of Wet Caps', ru: 'Лес Мокрых Шляпок' },
  { uk: 'Стежка Спорового Туману', en: 'Spore Fog Trail', ru: 'Тропа Спорового Тумана' },
  { uk: 'Поляна Підозрілих Грибів', en: 'Clearing of Suspicious Mushrooms', ru: 'Поляна Подозрительных Грибов' },
  { uk: 'Міцелієві Тунелі', en: 'Mycelium Tunnels', ru: 'Мицелиевые Туннели' },
  { uk: 'Болото Тихого Кашлю', en: 'Swamp of Silent Cough', ru: 'Болото Тихого Кашля' },
  { uk: 'Трон Короля Плями', en: 'Throne of the Stain King', ru: 'Трон Короля Пятна' },
];

const P4_U06_ARTIFACTS = [
  { icon: artifactWardenWhistle, framedIcon: artifactWardenWhistle, nameI18n: { uk: 'Свисток Чергового', en: 'Warden Whistle', ru: 'Свисток Дежурного' } },
  { icon: artifactCarouselKey, framedIcon: artifactCarouselKey, nameI18n: { uk: 'Ключ Каруселі', en: 'Carousel Key', ru: 'Ключ Карусели' } },
  { icon: artifactNotThisWayChalk, framedIcon: artifactNotThisWayChalk, nameI18n: { uk: 'Крейда “Не Сюди”', en: '“Not This Way” Chalk', ru: 'Мел “Не Сюда”' } },
  { icon: artifactBottomlessBucket, framedIcon: artifactBottomlessBucket, nameI18n: { uk: 'Відерце Без Дна', en: 'Bottomless Bucket', ru: 'Ведёрко Без Дна' } },
  { icon: artifactSwingSpring, framedIcon: artifactSwingSpring, nameI18n: { uk: 'Пружина Гойдалки', en: 'Swing Spring', ru: 'Пружина Качели' } },
  { icon: artifactFirstInLineMedal, framedIcon: artifactFirstInLineMedal, nameI18n: { uk: 'Медаль “Перший У Черзі”', en: '“First in Line” Medal', ru: 'Медаль “Первый В Очереди”' } },
  { icon: artifactSeniorScoop, framedIcon: artifactSeniorScoop, nameI18n: { uk: 'Совок Старшого', en: 'Senior Scoop', ru: 'Совок Старшего' } },
];

const P4_U06_MISSIONS = [
  { uk: 'Вхід Без Дорослих', en: 'No Adults Entrance', ru: 'Вход Без Взрослых' },
  { uk: 'Скрипучі Гойдалки', en: 'Creaking Swings', ru: 'Скрипучие Качели' },
  { uk: 'Пісочниця Без Дна', en: 'Bottomless Sandbox', ru: 'Песочница Без Дна' },
  { uk: 'Карусель 404', en: 'Carousel 404', ru: 'Карусель 404' },
  { uk: 'Гірка В Нікуди', en: 'Slide to Nowhere', ru: 'Горка В Никуда' },
  { uk: 'Лабіринт Крейди', en: 'Chalk Maze', ru: 'Лабиринт Мела' },
  { uk: 'Будка Чергового', en: 'Warden Booth', ru: 'Будка Дежурного' },
];

const P4_U07_ARTIFACTS = [
  { icon: artifactNoOffRemote, framedIcon: artifactNoOffRemote, nameI18n: { uk: 'Пульт “Не Вимкнути”', en: 'No-Off Remote', ru: 'Пульт “Не Выключить”' } },
  { icon: artifactAntennaWhisker, framedIcon: artifactAntennaWhisker, nameI18n: { uk: 'Вус Антени', en: 'Antenna Whisker', ru: 'Ус Антенны' } },
  { icon: artifactRewindMeTape, framedIcon: artifactRewindMeTape, nameI18n: { uk: 'Касета “Перемотай Назад”', en: '“Rewind Me” Tape', ru: 'Кассета “Перемотай Назад”' } },
  { icon: artifactTestPatternShard, framedIcon: artifactTestPatternShard, nameI18n: { uk: 'Осколок Тест-Екрану', en: 'Test Pattern Shard', ru: 'Осколок Тест-Экрана' } },
  { icon: artifactVolumeKnob, framedIcon: artifactVolumeKnob, nameI18n: { uk: 'Ручка Гучності', en: 'Volume Knob', ru: 'Ручка Громкости' } },
  { icon: artifactLiveOnAirBadge, framedIcon: artifactLiveOnAirBadge, nameI18n: { uk: 'Значок “У Прямому Ефірі”', en: '“Live On Air” Badge', ru: 'Значок “В Прямом Эфире”' } },
  { icon: artifactMicCap, framedIcon: artifactMicCap, nameI18n: { uk: 'Мікрофонна Заглушка', en: 'Mic Cap', ru: 'Микрофонная Заглушка' } },
];

const P4_U07_MISSIONS = [
  { uk: 'Вхід Через Скло', en: 'Through-the-Glass Entrance', ru: 'Вход Через Стекло' },
  { uk: 'Рекламний Блок Без Кінця', en: 'Endless Ad Break', ru: 'Рекламный Блок Без Конца' },
  { uk: 'Канал 13½', en: 'Channel 13½', ru: 'Канал 13½' },
  { uk: 'Шумова Зала', en: 'Static Hall', ru: 'Зал Шума' },
  { uk: 'Кімната Перемикання', en: 'Switch Room', ru: 'Комната Переключения' },
  { uk: 'Лабіринт Телетексту', en: 'Teletext Maze', ru: 'Лабиринт Телетекста' },
  { uk: 'Студія Без Глядачів', en: 'Audience-Free Studio', ru: 'Студия Без Зрителей' },
];

const P4_U02_ARTIFACTS = [
  { icon: artifactUsefulBolt, framedIcon: artifactUsefulBolt, nameI18n: { uk: 'Корисний Болт', en: 'Useful Bolt', ru: 'Полезный Болт' } },
  { icon: artifactWheelWithoutPlan, framedIcon: artifactWheelWithoutPlan, nameI18n: { uk: 'Колесо Без Плану', en: 'Wheel Without a Plan', ru: 'Колесо Без Плана' } },
  { icon: artifactStickyTape, framedIcon: artifactStickyTape, nameI18n: { uk: 'Липкий Скотч', en: 'Sticky Tape', ru: 'Липкий Скотч' } },
  { icon: artifactMoodSpring, framedIcon: artifactMoodSpring, nameI18n: { uk: 'Пружина Настрою', en: 'Mood Spring', ru: 'Пружина Настроения' } },
  { icon: artifactDoNotPressButton, framedIcon: artifactDoNotPressButton, nameI18n: { uk: 'Кнопка “Не Натискати”', en: '“Do Not Press” Button', ru: 'Кнопка “Не Нажимать”' } },
  { icon: artifactUnexplainedCanister, framedIcon: artifactUnexplainedCanister, nameI18n: { uk: 'Каністра Без Пояснень', en: 'Unexplained Canister', ru: 'Канистра Без Объяснений' } },
  { icon: artifactGoldenNut, framedIcon: artifactGoldenNut, nameI18n: { uk: 'Золота Гайка', en: 'Golden Nut', ru: 'Золотая Гайка' } },
];

const P4_U02_MISSIONS = [
  { uk: 'Купа, Яка Ще Потрібна', en: 'Pile That Might Be Useful', ru: 'Куча, Которая Ещё Нужна' },
  { uk: 'Прохід Між Холодильниками', en: 'Passage Between Fridges', ru: 'Проход Между Холодильниками' },
  { uk: 'Поле Загублених Коліс', en: 'Field of Lost Wheels', ru: 'Поле Потерянных Колёс' },
  { uk: 'Сектор Дроту І Скотчу', en: 'Wire and Tape Sector', ru: 'Сектор Провода И Скотча' },
  { uk: 'Гараж, Де Все Дзвенить', en: 'Garage Where Everything Rattles', ru: 'Гараж, Где Всё Гремит' },
  { uk: 'Цех Дуже Важливого Мотлоху', en: 'Workshop of Very Important Junk', ru: 'Цех Очень Важного Хлама' },
  { uk: 'Трон Із Холодосів', en: 'Fridge Throne', ru: 'Трон Из Холодильников' },
];

const P4_U05_ARTIFACTS = [
  { icon: artifactNoThatWayCompass, framedIcon: artifactNoThatWayCompass, nameI18n: { uk: 'Компас “Та Ні, Туди”', en: '“No, That Way” Compass', ru: 'Компас “Да Нет, Туда”' } },
  { icon: artifactUpFallingRock, framedIcon: artifactUpFallingRock, nameI18n: { uk: 'Камінь, Що Падає Вгору', en: 'Up-Falling Rock', ru: 'Камень, Падающий Вверх' } },
  { icon: artifactTicketToNowhere, framedIcon: artifactTicketToNowhere, nameI18n: { uk: 'Квиток В Нікуди', en: 'Ticket to Nowhere', ru: 'Билет В Никуда' } },
  { icon: artifactSingularitySpoon, framedIcon: artifactSingularitySpoon, nameI18n: { uk: 'Ложка Сингулярності', en: 'Singularity Spoon', ru: 'Ложка Сингулярности' } },
  { icon: artifactZeroInAJar, framedIcon: artifactZeroInAJar, nameI18n: { uk: 'Нуль У Банці', en: 'Zero in a Jar', ru: 'Ноль В Банке' } },
  { icon: artifactOwnerlessOrbit, framedIcon: artifactOwnerlessOrbit, nameI18n: { uk: 'Орбіта Без Власника', en: 'Ownerless Orbit', ru: 'Орбита Без Хозяина' } },
  { icon: artifactEyeThatBlinkedFirst, framedIcon: artifactEyeThatBlinkedFirst, nameI18n: { uk: 'Око, Яке Моргнуло Перше', en: 'Eye That Blinked First', ru: 'Глаз, Который Моргнул Первым' } },
];

const P4_U05_MISSIONS = [
  { uk: 'Підлога Над Головою', en: 'Floor Above Head', ru: 'Пол Над Головой' },
  { uk: 'Сходи, Які Забули Куди', en: 'Stairs That Forgot Where', ru: 'Лестница, Которая Забыла Куда' },
  { uk: 'Камінь Падає Вгору', en: 'Rock Falls Up', ru: 'Камень Падает Вверх' },
  { uk: 'Черга В Нікуди', en: 'Queue to Nowhere', ru: 'Очередь В Никуда' },
  { uk: 'Вівтар “Не Підходь Близько”', en: '“Don’t Come Close” Altar', ru: 'Алтарь “Не Подходи Близко”' },
  { uk: 'Кільця, Які Крутять Тебе', en: 'Rings That Spin You', ru: 'Кольца, Которые Крутят Тебя' },
  { uk: 'Діра, Яка Дивиться Перша', en: 'Hole That Looks First', ru: 'Дыра, Которая Смотрит Первой' },
];

const LOCATION_MINI_BANNERS = {
  'p4-u00': p4u00MiniBanner,
  'p4-u01': p4u01MiniBanner,
  'p4-u02': p4u02MiniBanner,
  'p4-u03': p4u03MiniBanner,
  'p4-u04': p4u04MiniBanner,
  'p4-u05': p4u05MiniBanner,
  'p4-u06': p4u06MiniBanner,
  'p4-u07': p4u07MiniBanner,
};

const LOCATION_BIG_BANNERS = {
  'p4-u00': p4u00BigBanner,
  'p4-u01': p4u01BigBanner,
  'p4-u02': p4u02BigBanner,
  'p4-u03': p4u03BigBanner,
  'p4-u04': p4u04BigBanner,
  'p4-u05': p4u05BigBanner,
  'p4-u06': p4u06BigBanner,
  'p4-u07': p4u07BigBanner,
};

function localizeText(value, language = 'uk') {
  if (value && typeof value === 'object' && (value.uk || value.en || value.ru)) {
    return value[language] || value.uk || value.en || value.ru || '';
  }
  return value || '';
}

function localizeDifficulty(value, language = 'uk') {
  const map = {
    'Низька': { uk: 'Низька', en: 'Low', ru: 'Низкая' },
    'Низька+': { uk: 'Низька+', en: 'Low+', ru: 'Низкая+' },
    'Середня': { uk: 'Середня', en: 'Medium', ru: 'Средняя' },
    'Середня+': { uk: 'Середня+', en: 'Medium+', ru: 'Средняя+' },
    'Висока': { uk: 'Висока', en: 'High', ru: 'Высокая' },
    'Висока+': { uk: 'Висока+', en: 'High+', ru: 'Высокая+' },
    'Елітна': { uk: 'Елітна', en: 'Elite', ru: 'Элитная' },
    'Екстремальна': { uk: 'Екстремальна', en: 'Extreme', ru: 'Экстремальная' },
  };
  return localizeText(map[value] || value, language);
}

const LOCATION_PICKER_TITLE = {
  uk: 'Обери планету для проблем',
  en: 'Choose a planet for trouble',
  ru: 'Выбери планету для проблем',
};

const TASK_TEMPLATES = [
  { slug: 'scout', name: 'Розвідка', energy: 3, tentacles: 18, strength: 2, xp: 3, target: 4 },
  { slug: 'loot', name: 'Обшук', energy: 4, tentacles: 24, strength: 2, xp: 4, target: 5 },
  { slug: 'repair', name: 'Ремонт', energy: 4, tentacles: 27, strength: 2, xp: 4, target: 5 },
  { slug: 'trade', name: 'Обмін', energy: 5, tentacles: 34, strength: 3, xp: 5, target: 6 },
  { slug: 'fight', name: 'Сутичка', energy: 6, tentacles: 40, strength: 3, xp: 5, target: 6 },
  { slug: 'cache', name: 'Сховок', energy: 7, tentacles: 46, strength: 3, xp: 8, target: 7 },
  { slug: 'final', name: 'Фінал', energy: 8, tentacles: 58, strength: 3, xp: 10, target: 8 },
];

const SMALL_POISON_I18N = { uk: 'Мала отрута', en: 'Small Poison', ru: 'Малый яд' };
const MEDIUM_POISON_I18N = { uk: 'Середня отрута', en: 'Medium Poison', ru: 'Средний яд' };
const LARGE_POISON_I18N = { uk: 'Фляга з отрутою', en: 'Poison flask', ru: 'Фляга с ядом' };

const LOCATION_BLUEPRINTS = [
  {
    id: 'p4-u00',
    name: 'ПОСИЛКА БЕЗ ОТРИМУВАЧА',
    nameI18n: { uk: 'ПОСИЛКА БЕЗ ОТРИМУВАЧА', en: 'PACKAGE WITHOUT RECIPIENT', ru: 'ПОСЫЛКА БЕЗ ПОЛУЧАТЕЛЯ' },
    nickname: 'P4-U00',
    difficulty: 'Низька',
    accent: '#8bff58',
    icon: labIcon,
    bannerImage: laboratoryBanner,
    bannerI18n: {
      uk: 'Посилка без адреси, але з характером і поганими намірами.',
      en: 'A package with no address, but plenty of attitude and bad ideas.',
      ru: 'Посылка без адреса, но с характером и плохими намерениями.',
    },
    rewardWeapon: { id: 'small-poison', name: 'Мала отрута', nameI18n: SMALL_POISON_I18N, icon: smallPoisonIcon, count: 1 },
    collectionName: 'Загублена Доставка',
    collectionNameI18n: { uk: 'Загублена Доставка', en: 'Lost Delivery', ru: 'Потерянная Доставка' },
    missions: P4_U00_MISSIONS,
    artifacts: P4_U00_ARTIFACTS,
  },
  {
    id: 'p4-u01',
    name: 'ПЛАНЕТА БЕЗ КОЛЬОРУ',
    nameI18n: { uk: 'ПЛАНЕТА БЕЗ КОЛЬОРУ', en: 'COLORLESS PLANET', ru: 'ПЛАНЕТА БЕЗ ЦВЕТА' },
    nickname: 'P4-U01',
    difficulty: 'Низька+',
    accent: '#a66bff',
    emoji: '🌀',
    rewardWeapon: { id: 'small-poison', name: 'Мала отрута', nameI18n: SMALL_POISON_I18N, icon: smallPoisonIcon, count: 2 },
    bannerI18n: {
      uk: 'Сірий світ, де навіть веселка здалась і пішла курити.',
      en: 'A gray world where even the rainbow gave up and went for a smoke.',
      ru: 'Серый мир, где даже радуга сдалась и ушла курить.',
    },
    collectionName: 'Залишки Кольору',
    collectionNameI18n: { uk: 'Залишки Кольору', en: 'Remains of Color', ru: 'Остатки Цвета' },
    missions: P4_U01_MISSIONS,
    artifacts: P4_U01_ARTIFACTS,
  },
  {
    id: 'p4-u02',
    name: 'ЗВАЛИЩЕ КОРИСНОГО ХЛАМУ',
    nameI18n: { uk: 'ЗВАЛИЩЕ КОРИСНОГО ХЛАМУ', en: 'USEFUL TRASH YARD', ru: 'СВАЛКА ПОЛЕЗНОГО ХЛАМА' },
    nickname: 'P4-U02',
    difficulty: 'Середня',
    accent: '#ff8c42',
    emoji: '🧰',
    rewardWeapon: { id: 'medium-poison', name: 'Середня отрута', nameI18n: MEDIUM_POISON_I18N, icon: mediumPoisonIcon, count: 3 },
    bannerI18n: {
      uk: 'Звалище, де сміття образиться, якщо назвати його сміттям.',
      en: 'A junkyard where trash gets offended if you call it trash.',
      ru: 'Свалка, где хлам обидится, если назвать его мусором.',
    },
    missions: P4_U02_MISSIONS,
    artifacts: P4_U02_ARTIFACTS,
  },
  {
    id: 'p4-u03',
    name: 'ШЛУНОК КОСМОКИТА',
    nameI18n: { uk: 'ШЛУНОК КОСМОКИТА', en: 'COSMIC WHALE STOMACH', ru: 'ЖЕЛУДОК КОСМОКИТА' },
    nickname: 'P4-U03',
    difficulty: 'Середня+',
    accent: '#62d7ff',
    emoji: '🫀',
    rewardWeapon: { id: 'small-poison', name: 'Мала отрута', nameI18n: SMALL_POISON_I18N, icon: smallPoisonIcon, count: 3 },
    bannerI18n: {
      uk: 'Всередині космокита тепло, слизько і підозріло булькає.',
      en: 'Inside the space whale, it is warm, slimy, and suspiciously bubbly.',
      ru: 'Внутри космокита тепло, скользко и подозрительно булькает.',
    },
    collectionName: 'Те, Що Перетравилось Не До Кінця',
    collectionNameI18n: { uk: 'Те, Що Перетравилось Не До Кінця', en: 'Half-Digested Things', ru: 'То, Что Не До Конца Переварилось' },
    missions: P4_U03_MISSIONS,
    artifacts: P4_U03_ARTIFACTS,
  },
  {
    id: 'p4-u04',
    name: 'СПОРОВА ПУСТКА',
    nameI18n: { uk: 'СПОРОВА ПУСТКА', en: 'SPORE WASTELAND', ru: 'СПОРОВАЯ ПУСТОШЬ' },
    nickname: 'P4-U04',
    difficulty: 'Висока',
    accent: '#ff6ea8',
    emoji: '🍄',
    rewardWeapon: { id: 'medium-poison', name: 'Середня отрута', nameI18n: MEDIUM_POISON_I18N, icon: mediumPoisonIcon, count: 1 },
    bannerI18n: {
      uk: 'Грибна пустка, де спори чхають першими, а ти вже потім.',
      en: 'A mushroom wasteland where spores sneeze first, and you sneeze later.',
      ru: 'Грибная пустошь, где споры чихают первыми, а ты уже потом.',
    },
    collectionName: 'ФІНАЛЬНИЙ НАБІР P4-U04',
    missions: P4_U04_MISSIONS,
    artifacts: P4_U04_ARTIFACTS,
  },
  {
    id: 'p4-u05',
    name: 'ЧОРНА ДІРА 025',
    nameI18n: { uk: 'ЧОРНА ДІРА 025', en: 'BLACK HOLE 025', ru: 'ЧЁРНАЯ ДЫРА 025' },
    nickname: 'P4-U05',
    difficulty: 'Висока+',
    accent: '#e86cff',
    emoji: '🕳️',
    rewardWeapon: { id: 'large-poison', name: 'Фляга з отрутою', nameI18n: LARGE_POISON_I18N, icon: largePoisonIcon, count: 1 },
    bannerI18n: {
      uk: 'Діра, що засмоктує речі, надію і нормальні пояснення.',
      en: 'A hole that sucks in stuff, hope, and any normal explanation.',
      ru: 'Дыра, которая засасывает вещи, надежду и нормальные объяснения.',
    },
    collectionName: 'Речі, Які Не Втримались',
    collectionNameI18n: { uk: 'Речі, Які Не Втримались', en: 'Things That Didn’t Hold', ru: 'Вещи, Которые Не Удержались' },
    missions: P4_U05_MISSIONS,
    artifacts: P4_U05_ARTIFACTS,
  },
  {
    id: 'p4-u06',
    name: 'ПЛОЩАДКА 404',
    nameI18n: { uk: 'ПЛОЩАДКА 404', en: 'PLAYGROUND 404', ru: 'ПЛОЩАДКА 404' },
    nickname: 'P4-U06',
    difficulty: 'Елітна',
    accent: '#ffc857',
    emoji: '🛝',
    rewardWeapon: { id: 'medium-poison', name: 'Середня отрута', nameI18n: MEDIUM_POISON_I18N, icon: mediumPoisonIcon, count: 2 },
    bannerI18n: {
      uk: 'Майданчик, де гойдалки качаються без дітей і без совісті.',
      en: 'A playground where swings move without kids and without shame.',
      ru: 'Площадка, где качели качаются без детей и без совести.',
    },
    collectionName: 'Заборонені Іграшки',
    collectionNameI18n: { uk: 'Заборонені Іграшки', en: 'Forbidden Toys', ru: 'Запрещённые Игрушки' },
    missions: P4_U06_MISSIONS,
    artifacts: P4_U06_ARTIFACTS,
  },
  {
    id: 'p4-u07',
    name: 'ТЕЛЕТРОН',
    nameI18n: { uk: 'ТЕЛЕТРОН', en: 'TELETRON', ru: 'ТЕЛЕТРОН' },
    nickname: 'P4-U07',
    difficulty: 'Екстремальна',
    accent: '#f4e66f',
    emoji: '📺',
    rewardWeapon: { id: 'large-poison', name: 'Фляга з отрутою', nameI18n: LARGE_POISON_I18N, icon: largePoisonIcon, count: 1 },
    bannerI18n: {
      uk: 'Планета старого телика, де реклама голосніша за закони фізики.',
      en: 'A planet of old TV static, where ads are louder than physics.',
      ru: 'Планета старого телика, где реклама громче законов физики.',
    },
    collectionName: 'Артефакти Заборонені Іграшки',
    collectionNameI18n: { uk: 'Артефакти Заборонені Іграшки', en: 'Forbidden Toys Artifacts', ru: 'Артефакты Запрещённые Игрушки' },
    missions: P4_U07_MISSIONS,
    artifacts: P4_U07_ARTIFACTS,
  },
];

const COLLECTION_REWARDS = {
  'p4-u00': { mediumPoison: 1, tentacles: 2000, energy: 50 },
  'p4-u01': { mediumPoison: 1, tentacles: 2500, strength: 10, energy: 60 },
  'p4-u02': { largePoison: 1, tentacles: 3000, strength: 15, premium: 2, energy: 70 },
  'p4-u03': { largePoison: 1, tentacles: 4500, strength: 20, premium: 3, energy: 100, freeSpins: 1 },
  'p4-u04': { largePoison: 2, tentacles: 6500, strength: 30, premium: 5, energy: 130 },
  'p4-u05': { largePoison: 2, tentacles: 8000, strength: 40, premium: 7, energy: 150, freeSpins: 1 },
  'p4-u06': { largePoison: 3, tentacles: 10000, strength: 60, premium: 10, energy: 190, freeSpins: 2 },
  'p4-u07': { largePoison: 4, tentacles: 13000, strength: 80, premium: 15, energy: 220, freeSpins: 2 },
};

const QUEST_LOCATIONS = LOCATION_BLUEPRINTS.map((location, locationIndex) => {
  const nextBoss = GAME_CONFIG.BOSSES[locationIndex + 1];

  return {
  ...location,
  collectionReward: COLLECTION_REWARDS[location.id] || {},
  miniBanner: LOCATION_MINI_BANNERS[location.id] || null,
  bannerImage: LOCATION_BIG_BANNERS[location.id] || location.bannerImage || null,
  banner: localizeText(location.bannerI18n || location.banner, 'uk') || 'Закрий 7 місій, збери 7 артефактів і забери зброю локації.',
  bannerI18n: location.bannerI18n || null,
  rewardPreview: [
    { uk: '+CA', en: '+CA', ru: '+CA' },
    { uk: '+EXP', en: '+EXP', ru: '+EXP' },
    {
      uk: `+${location.rewardWeapon.count} ${localizeText(location.rewardWeapon.nameI18n || location.rewardWeapon.name, 'uk')}`,
      en: `+${location.rewardWeapon.count} ${localizeText(location.rewardWeapon.nameI18n || location.rewardWeapon.name, 'en')}`,
      ru: `+${location.rewardWeapon.count} ${localizeText(location.rewardWeapon.nameI18n || location.rewardWeapon.name, 'ru')}`,
    },
  ],
  collectionItems: (location.artifacts || ARTIFACT_ICONS).map((icons, artifactIndex) => ({
    id: `${location.id}-artifact-${artifactIndex + 1}`,
    name: localizeText(icons.nameI18n, 'uk') || `Артефакт ${artifactIndex + 1}`,
    nameI18n: icons.nameI18n || null,
    ...icons,
  })),
  tasks: TASK_TEMPLATES.map((task, taskIndex) => {
    const icons = (location.artifacts || ARTIFACT_ICONS)[taskIndex];

    return {
      ...getQuestMission(`${location.id}-${task.slug}`),
      artifactId: `${location.id}-artifact-${taskIndex + 1}`,
      keyReward: task.slug === 'final' && nextBoss
        ? {
            bossId: nextBoss.id,
            keycardLocation: nextBoss.keycardLocation,
            rank: locationIndex + 2,
            chance: LAB_FINAL_KEY_CHANCE,
            bossNameI18n: {
              uk: nextBoss.names?.ua || nextBoss.name,
              en: nextBoss.names?.en || nextBoss.name,
              ru: nextBoss.names?.ru || nextBoss.name,
            },
          }
        : null,
      poisonReward: task.slug === 'final' ? { id: LAB_FINAL_POISON_BY_LOCATION[locationIndex], chance: LAB_FINAL_POISON_CHANCE } : null,
      ...icons,
      name: localizeText(location.missions?.[taskIndex], 'uk') || `${task.name}: ${location.name}`,
      nameI18n: location.missions?.[taskIndex] || null,
    };
  }),
  };
});

function getTaskTotalRuns(profile, taskId) {
  return (profile?.task_completions || {})[taskId] || 0;
}

function getTaskLoopProgress(profile, task) {
  return getTaskTotalRuns(profile, task.id) % task.target;
}

function getTaskLoopCount(profile, task) {
  return Math.floor(getTaskTotalRuns(profile, task.id) / task.target);
}

function getCollectionItemCounts(profile) {
  return profile?.collection_item_counts || {};
}

function getOwnedCollectionSet(profile) {
  const counts = getCollectionItemCounts(profile);
  const ids = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([id]) => id);
  if (ids.length) return new Set(ids);
  return new Set(profile?.collection_items || []);
}

function getCollectionRewardClaims(profile) {
  return profile?.collection_rewards_claimed || {};
}

function getCollectionRewardDrops(location) {
  const reward = location?.collectionReward || {};
  const drops = [];
  if (reward.mediumPoison) drops.push({ type: 'weapon', id: 'medium-poison', qty: reward.mediumPoison });
  if (reward.largePoison) drops.push({ type: 'weapon', id: 'large-poison', qty: reward.largePoison });
  if (reward.tentacles) drops.push({ type: 'tentacles', qty: reward.tentacles });
  if (reward.premium) drops.push({ type: 'premium', qty: reward.premium });
  if (reward.strength) drops.push({ type: 'strength', qty: reward.strength });
  if (reward.energy) drops.push({ type: 'energy', qty: reward.energy });
  if (reward.freeSpins) drops.push({ type: 'spin', qty: reward.freeSpins });
  return drops;
}

function isLocationCompleted(profile, location) {
  return location.tasks.every((task) => getTaskTotalRuns(profile, task.id) >= task.target);
}

function getLocationClearReward(location) {
  return location.tasks.reduce(
    (total, task) => ({
      tentacles: total.tentacles + task.tentacles,
      xp: total.xp + task.xp,
      strength: total.strength + (task.strength || 0),
    }),
    { tentacles: 0, xp: 0, strength: 0 },
  );
}

function getLocationClearCount(profile, location) {
  return Math.min(...location.tasks.map((task) => getTaskLoopCount(profile, task)));
}

function getPassiveClaimPercent(profile, location) {
  const clearCount = getLocationClearCount(profile, location);
  if (clearCount < 1) return 0;
  return 50 + Math.max(0, clearCount - 1);
}

function getPassiveClaimReward(profile, location) {
  const percent = getPassiveClaimPercent(profile, location);
  const reward = getLocationClearReward(location);

  return {
    percent,
    tentacles: Math.max(0, Math.floor(reward.tentacles * percent / 100)),
    xp: Math.max(0, Math.floor(reward.xp * percent / 100)),
    strength: Math.max(0, Math.floor(reward.strength * percent / 100)),
  };
}

function getPassiveClaimReadyAt(profile, location) {
  const readyAtMap = profile?.location_passive_ready_at || {};
  return readyAtMap.global || readyAtMap[location.id] || null;
}

function formatPassiveCountdown(readyAt) {
  const msLeft = Math.max(0, new Date(readyAt).getTime() - serverNow());
  const totalSeconds = Math.ceil(msLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getPassiveAccrualRatio(readyAt) {
  if (!readyAt) return 0;
  const readyMs = new Date(readyAt).getTime();
  const cycleMs = PASSIVE_REWARD_INTERVAL_HOURS * 60 * 60 * 1000;
  const startMs = readyMs - cycleMs;
  const nowMs = serverNow();
  if (nowMs <= startMs) return 0;
  if (nowMs >= readyMs) return 1;
  return (nowMs - startMs) / cycleMs;
}

function getPassiveLiveReward(profile, location) {
  const readyAt = getPassiveClaimReadyAt(profile, location);
  const baseReward = getPassiveClaimReward(profile, location);
  const ratio = getPassiveAccrualRatio(readyAt);

  return {
    ...baseReward,
    tentacles: baseReward.tentacles > 0 ? Math.max(0, Math.floor(baseReward.tentacles * ratio)) : 0,
    xp: baseReward.xp > 0 ? Math.max(0, Math.floor(baseReward.xp * ratio)) : 0,
    strength: baseReward.strength > 0 ? Math.max(0, Math.floor(baseReward.strength * ratio)) : 0,
  };
}

function getPassiveAggregateReward(profile, locations, live = false) {
  return locations.reduce(
    (total, location) => {
      const reward = live ? getPassiveLiveReward(profile, location) : getPassiveClaimReward(profile, location);
      return {
        percent: total.percent + (reward.percent || 0),
        tentacles: total.tentacles + (reward.tentacles || 0),
        xp: total.xp + (reward.xp || 0),
        strength: total.strength + (reward.strength || 0),
      };
    },
    { percent: 0, tentacles: 0, xp: 0, strength: 0 },
  );
}



function BossStyleFrame({ children, className = '', innerClassName = '' }) {
  return (
    <MarkerFrame className={className} innerClassName={innerClassName} variant="transparent">
      {children}
    </MarkerFrame>
  );
}

function PanelFrame({ children, className = '', innerClassName = '' }) {
  return (
    <MarkerFrame className={className} innerClassName={innerClassName} variant="transparent">
      {children}
    </MarkerFrame>
  );
}

function StageCard({ location, onSelect, language, locked = false, lockHint = '' }) {
  const locationName = localizeText(location.nameI18n || location.name, language);
  const [displayLockHint, setDisplayLockHint] = useState(lockHint);

  useEffect(() => {
    if (!locked) {
      setDisplayLockHint(lockHint);
      return undefined;
    }

    const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&?';
    const startedAt = Date.now();
    const duration = 1800;
    const scramble = (revealed) => lockHint.split('').map((character, index) => (
      character === ' ' || index < revealed ? character : symbols[Math.floor(Math.random() * symbols.length)]
    )).join('');
    setDisplayLockHint(scramble(0));
    const intervalId = window.setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / duration, 1);
      const revealed = Math.floor(progress * (lockHint.length + 3));
      setDisplayLockHint(scramble(revealed));
      if (progress >= 1) window.clearInterval(intervalId);
    }, 70);

    return () => window.clearInterval(intervalId);
  }, [locked, lockHint]);

  return (
    <MarkerFrame className="shadow-[0_8px_20px_rgba(0,0,0,0.32)]" innerClassName="relative z-10" variant="transparent">
      <button
        type="button"
        data-tutorial-target={location.id === QUEST_LOCATIONS[0]?.id ? 'first-quest-location' : undefined}
        onClick={() => onSelect(location.id)}
        disabled={locked}
        className={`relative w-full overflow-hidden px-3 py-3 text-left transition ${locked ? 'cursor-not-allowed' : 'hover:bg-white/[0.03]'}`}
      >
        <div className="absolute inset-y-0 left-0 w-[5px]" style={{ background: `linear-gradient(180deg, ${location.accent} 0%, transparent 100%)` }} />
        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
          <div className="relative flex h-full min-h-[72px] w-[72px] self-stretch items-center justify-center overflow-hidden bg-[#0d120c]">
            {location.miniBanner ? (
              <img src={location.miniBanner} alt={locationName} loading="lazy" decoding="async" className="relative h-full w-full object-cover" />
            ) : location.icon ? (
              <img src={location.icon} alt={locationName} loading="lazy" decoding="async" className="relative h-full w-full object-cover" />
            ) : (
              <span className="relative text-[34px]">{location.emoji}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[16px] font-bold text-[#edf8d9]">{locationName}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: location.accent }}>{location.nickname}</p>
              </div>
              <span className="border border-[#28ee90] bg-[#121812] px-2 py-1 font-mono text-[10px] text-[#d7e8c7]">{localizeDifficulty(location.difficulty, language)}</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#b9caa8]">{localizeText(location.bannerI18n || location.banner, language)}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {location.rewardPreview.map((reward) => {
                const rewardLabel = localizeText(reward, language);
                const isStrengthReward = /CA/i.test(rewardLabel);
                const isPoisonReward = /отрута|poison|яд/i.test(rewardLabel);
                const isExpReward = /EXP/i.test(rewardLabel);
                const poisonIcon = /серед|medium/i.test(rewardLabel)
                  ? mediumPoisonIcon
                  : /велик|large|больш/i.test(rewardLabel)
                    ? largePoisonIcon
                    : smallPoisonIcon;
                return (
                  <span
                    key={typeof reward === 'string' ? reward : JSON.stringify(reward)}
                    className={`rounded-full bg-[#10140f] px-2 py-1 font-mono text-[9px] ${isPoisonReward || isExpReward || isStrengthReward ? '' : 'border border-[#28ee90]'}`}
                    style={{ color: location.accent }}
                  >
                    {isStrengthReward ? (
                      <span className="inline-flex items-center gap-1">
                        <img src={getResourceIcon('strength')} alt="CA" loading="lazy" decoding="async" className="h-9 w-9 object-contain" />
                        {rewardLabel.replace(/CA/ig, '').trim() || '+1'}
                      </span>
                    ) : isExpReward ? (
                      <span className="inline-flex items-center gap-1">
                        <img src={expUiIcon} alt="EXP" loading="lazy" decoding="async" className="h-9 w-9 object-contain" />
                        {rewardLabel}
                      </span>
                    ) : isPoisonReward ? (
                      <span className="inline-flex items-center gap-1">
                        <img src={poisonIcon} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-9 w-9 object-contain" />
                        {rewardLabel}
                      </span>
                    ) : rewardLabel}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        {locked ? <div className="absolute inset-[3px] z-20 flex items-center justify-center bg-[#050805]/65 px-4 text-center backdrop-blur-[3px]"><span className="inline-flex items-center gap-2 px-3 py-2 font-jura text-[13px] font-bold uppercase leading-none tracking-[0.04em] text-[#ff3b30] opacity-100 [text-shadow:0_0_2px_#ff3b30,0_0_6px_rgba(255,59,48,0.55)]"><Lock className="h-4 w-4 shrink-0" />{displayLockHint}</span></div> : null}
      </button>
    </MarkerFrame>
  );
}

function RewardSlot({ icon, label, count = 0, owned, locked = false, claimable = false, claimed = false, onClick, showCountBadge = true, tutorialTarget = undefined, collectionItemId = undefined }) {
  return (
    <button
      type="button"
      data-tutorial-target={tutorialTarget}
      data-collection-item={collectionItemId}
      onClick={onClick}
      disabled={locked || claimed}
      className={`overflow-hidden rounded-[12px] p-1.5 text-left transition ${
        claimable ? 'bg-[#172010]' : 'bg-[#0b0f0a]'
      } ${locked ? 'cursor-not-allowed' : 'cursor-pointer'} ${claimed ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {showCountBadge && count > 0 ? (
          <span className="absolute right-1 top-1 z-10 rounded-full border border-[#28ee90] bg-[#1a2a12] px-1.5 py-[1px] font-mono text-[9px] font-black leading-none text-[#d8ffb6]">
            x{count}
          </span>
        ) : null}
        <img
          src={icon}
          alt={label}
          className={`absolute inset-0 h-full w-full object-contain ${(locked || (!owned && !claimable && count === 0)) ? 'opacity-45 grayscale' : ''}`}
        />
      </div>
      <p className="mt-1 text-center font-mono text-[7px] leading-tight text-[#d6e3c8]">{label}</p>
    </button>
  );
}

function CollectionGrid({ items, owned, counts, rewardUnlocked, rewardClaimsCount, onClaimReward, language, rewardIcon }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => {
        const isOwned = owned.has(item.id);
        return <RewardSlot key={item.id} collectionItemId={item.id} icon={item.framedIcon || item.icon} label={localizeText(item.nameI18n || item.name, language)} count={counts[item.id] || 0} owned={isOwned} onClick={() => {}} />;
      })}
      <RewardSlot
        icon={rewardIcon || treasure1}
        label={
          rewardUnlocked
            ? localizeText({ uk: 'Забрати приз', en: 'Claim prize', ru: 'Забрать приз' }, language)
            : localizeText({ uk: 'Заблокований слот', en: 'Locked slot', ru: 'Заблокированный слот' }, language)
        }
        count={rewardClaimsCount}
        locked={!rewardUnlocked}
        claimable={rewardUnlocked}
        claimed={false}
        onClick={onClaimReward}
        showCountBadge={false}
        tutorialTarget={rewardUnlocked ? 'quest-claim-reward' : undefined}
      />
    </div>
  );
}

function PassiveClaimButton({ claimable, onClick, label, rewardLabel }) {
  const handlePress = (event) => {
    if (!claimable) return;
    event?.stopPropagation?.();
    onClick?.();
  };

  return (
    <GameTextureButton
      type="button"
      onClick={handlePress}
      disabled={!claimable}
      tone={claimable ? 'green' : 'gray'}
      className={`h-11 flex-1 ${claimable ? '' : 'opacity-80'}`}
    >
      <span className={`relative z-10 flex h-full flex-col items-center justify-center px-3 ${claimable ? 'text-[#13200e] [text-shadow:0_1px_0_rgba(255,255,255,0.38)]' : 'text-[#f0f6eb] [text-shadow:0_1px_2px_rgba(0,0,0,0.95)]'}`}>
        <span className="font-mono text-[12px] font-black leading-none tabular-nums tracking-[0.08em]">{label}</span>
        {rewardLabel ? (
          <span className="font-mono text-[8px] uppercase tracking-[0.08em]">{rewardLabel}</span>
        ) : null}
      </span>
    </GameTextureButton>
  );
}

function PassiveClaimCard({ profile, passiveLocations, onClaim, onOpenArtifacts, sharedReadyAt, claiming, afkTitle, claimLabel, readyLabel, language }) {
  const { t } = useTranslation();
  const [, forceTick] = useState(0);
  const reward = getPassiveAggregateReward(profile, passiveLocations, true);
  const readyAt = sharedReadyAt || profile?.location_passive_ready_at?.global || null;
  const claimable = !claiming && Boolean(readyAt) && new Date(readyAt).getTime() <= serverNow() - 1500;
  const timerLabel = readyAt ? formatPassiveCountdown(readyAt) : `${PASSIVE_REWARD_INTERVAL_HOURS}:00:00`;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      forceTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="mt-3 bg-[#10170d] px-3 py-3">
      <div className="flex min-h-[136px] flex-col">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8bff58]">{afkTitle}</p>
        <p className="mt-1 font-mono text-[11px] text-[#edf8d9]">
          {t('tasks.afkLine1', { hours: PASSIVE_REWARD_INTERVAL_HOURS, percent: reward.percent })}
        </p>
        <p className="mt-1 font-mono text-[9px] text-[#9db57a]">
          {t('tasks.afkLine2')}
        </p>
        <div className="mt-2 flex flex-col gap-2 font-mono text-[9px] uppercase">
          <div className="flex w-full gap-2">
            <PassiveClaimButton claimable={claimable} onClick={onClaim} label={claimable ? claimLabel : timerLabel} rewardLabel={claimable ? readyLabel : ''} />
            <GameTextureButton type="button" onClick={onOpenArtifacts} tone="green" className="h-11 flex-1 rounded-[8px]"><span className="relative z-10 font-mono text-[10px] font-black uppercase text-[#172016]">{language === 'en' ? 'ARTIFACTS' : language === 'ru' ? 'АРТЕФАКТЫ' : 'АРТЕФАКТИ'}</span></GameTextureButton>
          </div>
          <div className="flex w-full flex-wrap gap-1">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10140f] px-1.5 py-0.5 text-[#8bff58]">
            <img src={getResourceIcon('tentacles')} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
            <span>+{reward.tentacles} tentacles</span>
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10140f] px-1.5 py-0.5 text-[#ffd95f]">
            <img src={expUiIcon} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
            <span>+{reward.xp} EXP</span>
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10140f] px-1.5 py-0.5 text-[#ffb36b]">
            <img src={levelUiIcon} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
            <span>+{reward.strength} CA</span>
          </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, progress, loopCount, onRun, isRunning, canRun, accent, resultDropHint, isLocked, lockHint, goLabel, language, tutorialTarget = undefined, tutorialGoIndex = undefined, tutorialBlock = undefined, tutorialSegmentIndex = undefined }) {
  const isUnavailable = !canRun || isLocked;
  const taskName = localizeText(task.nameI18n || task.name, language);
  const segmentCount = task.target;
  const segmentProgress = progress;
  const miniSegments = Array.from({ length: segmentCount }, (_, index) => index < segmentProgress);

  return (
    <motion.div data-tutorial-block={tutorialBlock} data-tutorial-progress={tutorialBlock !== undefined ? progress : undefined} data-tutorial-total={tutorialBlock !== undefined ? task.target : undefined} data-tutorial-loop={tutorialBlock !== undefined ? loopCount : undefined} data-tutorial-target={tutorialBlock !== undefined ? `quest-block-${tutorialBlock}` : undefined} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <MarkerFrame className={`shadow-[0_8px_18px_rgba(0,0,0,0.24)] ${isLocked ? 'opacity-65 grayscale-[0.22]' : ''}`} innerClassName="relative overflow-hidden px-2.5 py-2.5" variant="transparent">
        <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: `linear-gradient(180deg, ${accent} 0%, transparent 100%)` }} />
        <div className="grid grid-cols-[40px_46px_minmax(0,1fr)_40px] items-center gap-2">
        <div className="flex h-[44px] w-[44px] items-center justify-center overflow-hidden bg-[#0d120c]">
          <div className="relative flex h-[36px] w-[36px] items-center justify-center">
            <img src={portalIcon} alt="" aria-hidden="true" className="h-full w-full object-contain" />
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[18px] font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)]">
              {loopCount}
            </span>
          </div>
        </div>

        <div data-artifact-icon={task.id} className="flex h-[50px] w-[50px] items-center justify-center overflow-visible bg-[#0d120c]">
          {task.icon ? <img src={task.framedIcon || task.icon} alt={taskName} className="h-full w-full scale-[1.28] object-contain" /> : <span className="text-[26px]">{task.iconEmoji}</span>}
        </div>

        <div className="min-w-0">
          <p className="font-mono text-[14px] font-black text-[#edf8d9]">{taskName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] font-bold text-[#e1edd3]">
            <span className="flex items-center gap-1 text-[#d8d8d8]">
              <img src={tentaclesRewardIcon} alt="" aria-hidden="true" className="h-[18px] w-[18px] object-contain" />
              +{task.tentacles} tentacles
            </span>
            <span className="flex items-center gap-1 text-[#ffb36b]">
              <img src={levelUiIcon} alt="" aria-hidden="true" className="h-[18px] w-[18px] object-contain" />
              +{task.strength} CA
            </span>
            <span className="flex items-center gap-1 text-[#ffd95f]">
              <img src={expUiIcon} alt="" aria-hidden="true" className="h-[18px] w-[18px] object-contain" />
              +{task.xp} EXP
            </span>
            {task.keyReward ? (
              <span className="flex items-center gap-1 text-[#8fdcff]">
                <BossKeyIcon rank={task.keyReward.rank} title="Boss key" className="h-[16px] w-[16px]" />
                {Math.round(task.keyReward.chance * 100)}%
              </span>
            ) : null}
            {task.poisonReward ? (
              <span className="flex items-center gap-1 text-[#c8ff62]">
                <img src={task.poisonReward.id === 'large-poison' ? largePoisonIcon : task.poisonReward.id === 'medium-poison' ? mediumPoisonIcon : smallPoisonIcon} alt="" aria-hidden="true" className="h-[16px] w-[16px] object-contain" />
                1%
              </span>
            ) : null}
          </div>
          <div className="mt-2 grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${segmentCount}, minmax(0, 1fr))` }}>
            {miniSegments.map((filled, index) => (
              <div key={`${task.id}-segment-${index}`} data-tutorial-target={index === 0 ? tutorialTarget : undefined} data-tutorial-quest-segment={index === tutorialSegmentIndex ? 'active' : undefined} data-tutorial-quest-sector={tutorialGoIndex} className={`relative h-[10px] min-w-0 overflow-hidden rounded-[4px] border border-[#527419] bg-[linear-gradient(180deg,#b7dc59_0%,#719b29_58%,#466717_100%)] shadow-[inset_0_1px_rgba(255,255,255,0.24)] ${filled ? '' : 'opacity-30 grayscale'}`}>
              </div>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[8px] leading-tight">
            <span className="max-w-[75%]" style={{ color: accent }}>{isLocked ? lockHint : resultDropHint}</span>
            <span className={progress === 0 ? 'text-[#8bff58]' : 'text-[#8f7c68]'}>{progress}/{task.target}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          <GameTextureButton
            type="button"
            data-tutorial-quest-go={tutorialGoIndex}
            data-tutorial-quest-required={tutorialGoIndex !== undefined ? task.target : undefined}
            onClick={onRun}
            disabled={isUnavailable}
            className={`h-[40px] w-[40px] p-0 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-[#edf8d9] outline-none focus-visible:outline-none ${
              isUnavailable
                ? 'cursor-not-allowed opacity-50 grayscale-[0.45] brightness-75'
                : 'active:scale-95 active:brightness-90'
            }`}
          >
            {isRunning ? (
              <span className="absolute inset-0 z-10 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            ) : (
              <span className={`relative z-10 inline-flex h-full w-full items-center justify-center text-[12px] font-black [text-shadow:0_1px_2px_rgba(0,0,0,0.9)] ${isLocked ? 'opacity-35' : ''}`}>
                {goLabel}
              </span>
            )}
          </GameTextureButton>
          <span className="inline-flex items-center gap-1 font-mono text-[9px] font-black text-[#f5f0dd]">
            <img src={energy25Icon} alt="" aria-hidden="true" className="h-3 w-3 object-contain" />
            <span>-{task.energy}</span>
          </span>
        </div>
        </div>
      </MarkerFrame>
    </motion.div>
  );
}

export default function TasksPanel({ profile, onSpendEnergy, onUpdateProfile, onAddXp, onSyncProfile, onRefreshProfile }) {
  const { t, i18n } = useTranslation();
  void onSpendEnergy;
  void onAddXp;
  const activeLanguage = profile?.language || i18n.language || 'en';
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [runningId, setRunningId] = useState(null);
  const runningRef = useRef(false);
  const [result, setResult] = useState(null);
  const [artifactFlight, setArtifactFlight] = useState(null);

  const [passiveClaimingId, setPassiveClaimingId] = useState(null);
  const [artifactsOverviewOpen, setArtifactsOverviewOpen] = useState(false);
  const [openingCollectionReward, setOpeningCollectionReward] = useState(null);
  const availableEnergy = useMemo(
    () => Math.floor(
      calculateEnergy(
        profile?.last_energy_update,
        profile?.energy,
        profile?.max_energy,
        profile?.energy_regen_rate,
      ) || 0,
    ),
    [profile?.energy, profile?.last_energy_update, profile?.max_energy, profile?.energy_regen_rate],
  );

  const selectedLocation = useMemo(() => QUEST_LOCATIONS.find((location) => location.id === selectedLocationId) || null, [selectedLocationId]);
  const getLocationLockHint = (location) => {
    const unlock = getQuestLocationUnlock(location.id);
    if (!unlock) return '';
    const boss = GAME_CONFIG.BOSSES.find((entry) => entry.id === unlock.bossId);
    return t('tasks_panel.location_unlock_hint', { boss: getLocalizedBossName(boss, activeLanguage), level: unlock.fallbackLevel });
  };
  const ownedCollection = useMemo(() => getOwnedCollectionSet(profile), [profile]);
  const collectionCounts = useMemo(() => getCollectionItemCounts(profile), [profile]);
  const collectionRewardClaims = useMemo(() => getCollectionRewardClaims(profile), [profile]);
  const collectionRewardUnlocked = useMemo(
    () => !!selectedLocation?.collectionItems?.length && selectedLocation.collectionItems.every((item) => (collectionCounts[item.id] || 0) >= 1),
    [collectionCounts, selectedLocation],
  );
  const collectionRewardClaimsCount = selectedLocation
    ? typeof collectionRewardClaims[selectedLocation.id] === 'number'
      ? collectionRewardClaims[selectedLocation.id]
      : collectionRewardClaims[selectedLocation.id]
        ? 1
        : 0
    : 0;
  const finalTaskUnlocked = useMemo(() => {
    if (!selectedLocation || selectedLocation.tasks.length < 7) return false;
    const finalTask = selectedLocation.tasks[6];
    const finalLoops = getTaskLoopCount(profile, finalTask);
    return selectedLocation.tasks.slice(0, 6).every((task) => getTaskLoopCount(profile, task) > finalLoops);
  }, [profile, selectedLocation]);

  const passiveLocations = useMemo(
    () => QUEST_LOCATIONS.filter((location) => getLocationClearCount(profile, location) >= 1),
    [profile],
  );
  const passiveSharedReadyAt = profile?.location_passive_ready_at?.global || null;
  const goLabel = t('tasks.go');
  const afkTitle = t('tasks.afkBonus');
  const claimLabel = t('tasks.claim');
  const readyLabel = t('tasks.ready');

  useEffect(() => {
    const nextLanguage = profile?.language || 'en';
    if (i18n.language !== nextLanguage) {
      i18n.changeLanguage(nextLanguage);
    }
  }, [i18n, profile?.language]);

  const passiveClaimRef = useRef(false);
  const claimPassiveReward = async () => {
    if (!profile || passiveClaimRef.current) return;
    passiveClaimRef.current = true;
    setPassiveClaimingId('global');
    try {
      let latestProfile = null;
      try { latestProfile = await onRefreshProfile?.(); } catch { /* Keep the loaded profile if refresh is unavailable. */ }
      const readyAt = Date.parse(latestProfile?.location_passive_ready_at?.global || profile.location_passive_ready_at?.global || '');
      if (!Number.isFinite(readyAt) || readyAt > serverNow() - 1500) {
        setResult({ task: t('tasks.afkNotReady') });
        return;
      }
      const saved = await onUpdateProfile({ playerAction: { type: 'claim-afk' } });
      if (saved?.reward) {
        setResult({ task: 'AFK bonus claim', ...saved.reward });
        setTimeout(() => setResult(null), 2800);
      }
    } catch (error) {
      if (error?.code === 'AFK_NOT_READY') {
        try { await onRefreshProfile?.(); } catch { /* Keep the server rejection visible if refresh fails. */ }
        setResult({ task: t('tasks.afkNotReady') });
      } else {
        setResult({ task: error?.message || 'AFK claim failed' });
      }
    } finally {
      passiveClaimRef.current = false;
      setPassiveClaimingId(null);
    }
  };

  const runTask = async (task) => {
    if (runningRef.current || runningId || !profile || !selectedLocation || !isQuestLocationUnlocked(profile, selectedLocation.id)) return;
    if (availableEnergy < task.energy) return;
    runningRef.current = true;


    setRunningId(task.id);
    setResult(null);

    try {
      console.log('[tasks] mission click', { taskId: task.id, locationId: selectedLocation.id });
      const missionPayload = {
        ...task,
        locationId: selectedLocation.id,
      };

      const applyLocalMissionFallback = async () => {
        const successRate = Number(missionPayload.successRate ?? 1);
        const success = Math.random() <= (Number.isFinite(successRate) ? successRate : 1);
        const nextRuns = getTaskTotalRuns(profile, task.id) + 1;
        const nextTaskCompletions = {
          ...(profile?.task_completions || {}),
          [task.id]: nextRuns,
        };
        const localPatch = {
          energy: Math.max(0, availableEnergy - task.energy),
          last_energy_update: new Date().toISOString(),
          energy_spent_total: (profile.energy_spent_total || 0) + task.energy,
          energy_spent_today: (profile.energy_spent_today || 0) + task.energy,
          total_tasks_today: (profile.total_tasks_today || 0) + 1,
          task_completions: nextTaskCompletions,
          active_location: selectedLocation.id,
        };

        if (success) {
          localPatch.tentacles = (profile.tentacles || 0) + task.tentacles;
          localPatch.stat_strength = (profile.stat_strength || 1) + (task.strength || 0);
        }

        console.warn('[tasks] mission fallback', {
          taskId: task.id,
          locationId: selectedLocation.id,
          reason: 'mission_complete_endpoint_unavailable',
        });
        await onUpdateProfile(localPatch);
        if (success && task.xp > 0) {
          await onAddXp(task.xp).catch(() => {});
        }

        return {
          taskId: task.id,
          success,
          spentEnergy: task.energy,
          gainedTentacles: success ? task.tentacles : 0,
          gainedXp: success ? task.xp : 0,
          questProgress: nextRuns,
          player: {
            ...profile,
            ...localPatch,
          },
          __localFallback: true,
        };
      };

      let missionResult;
      try {
        missionResult = await completeMission({
          profileId: profile.id,
          task: missionPayload,
          requestId: crypto.randomUUID(),
        });
        console.log('[tasks] mission response', missionResult);
      } catch (error) {
        const missingRoute = error?.code === 'ROUTE_NOT_FOUND';
        if (!missingRoute) throw error;
        missionResult = await applyLocalMissionFallback();
      }

      const sourceProfile = missionResult?.player || profile;
      const previousRuns = getTaskTotalRuns(profile, task.id);
      const reportedRuns = Number(missionResult?.questProgress ?? getTaskTotalRuns(sourceProfile, task.id));
      const nextRuns = Math.max(previousRuns + 1, Number.isFinite(reportedRuns) ? reportedRuns : 0);
      const updates = {};

      let droppedCollectionItem = null;
      const serverHandlesArtifacts = Object.prototype.hasOwnProperty.call(missionResult || {}, 'collectionDrop');
      if (serverHandlesArtifacts) {
        droppedCollectionItem = selectedLocation.collectionItems?.find((item) => item.id === missionResult.collectionDrop?.id) || null;
      } else {
        // Compatibility with servers that have not yet deployed atomic drops.
        const completedTaskCycle = nextRuns > previousRuns && nextRuns % task.target === 0;
        const artifactForTask = selectedLocation.collectionItems?.find((item) => item.id === task.artifactId) || null;
        const bonusArtifactDrop = artifactForTask && Math.random() < BONUS_ARTIFACT_DROP_CHANCE ? 1 : 0;
        if (artifactForTask && (completedTaskCycle || bonusArtifactDrop > 0)) {
          droppedCollectionItem = artifactForTask;
          const currentCounts = { ...(sourceProfile?.collection_item_counts || {}) };
          const currentOwned = new Set(sourceProfile?.collection_items || []);
          currentCounts[artifactForTask.id] = Number(currentCounts[artifactForTask.id] || 0) + Number(completedTaskCycle) + bonusArtifactDrop;
          currentOwned.add(artifactForTask.id);
          updates.collection_item_counts = currentCounts;
          updates.collection_items = Array.from(currentOwned);
        }
      }
      const artifactFlightStart = droppedCollectionItem && typeof document !== 'undefined'
        ? document.querySelector(`[data-artifact-icon="${task.id}"]`)?.getBoundingClientRect()
        : null;

      let droppedBossKey = null;
      if (!missionResult.__localFallback) {
        droppedBossKey = missionResult.keyDrop ? task.keyReward : null;
      } else if (task.keyReward && finalTaskUnlocked && Math.random() < task.keyReward.chance) {
        updates.keycards = {
          ...(sourceProfile?.keycards || {}),
          [task.keyReward.keycardLocation]: ((sourceProfile?.keycards || {})[task.keyReward.keycardLocation] || 0) + 1,
        };
        droppedBossKey = task.keyReward;
      }

      let droppedPoison = null;
      if (!missionResult.__localFallback) {
        droppedPoison = missionResult.poisonDrop ? task.poisonReward : null;
      } else if (task.poisonReward && finalTaskUnlocked && Math.random() < task.poisonReward.chance) {
        const weaponInventory = { ...(sourceProfile?.weapon_inventory || {}) };
        weaponInventory[task.poisonReward.id] = (weaponInventory[task.poisonReward.id] || 0) + 1;
        updates.weapon_inventory = weaponInventory;
        droppedPoison = task.poisonReward;
      }

      if (!missionResult.__localFallback) {
        onSyncProfile?.(sourceProfile);
      } else if (Object.keys(updates).length > 0) {
        await onUpdateProfile(updates);
      }

      setResult({
        task: localizeText(task.nameI18n || task.name, activeLanguage),
        tentacles: task.tentacles,
        xp: task.xp,
        strength: task.strength || 0,
        collectionDrop: null,
        bossKeyDrop: droppedBossKey,
        poisonDrop: droppedPoison,
      });

      if (droppedCollectionItem && artifactFlightStart) {
        window.requestAnimationFrame(() => {
          const targetRect = document.querySelector(`[data-collection-item="${droppedCollectionItem.id}"] img`)?.getBoundingClientRect();
          if (!targetRect) return;
          setArtifactFlight({
            key: `${droppedCollectionItem.id}-${Date.now()}`,
            icon: droppedCollectionItem.framedIcon || droppedCollectionItem.icon,
            label: localizeText(droppedCollectionItem.nameI18n || droppedCollectionItem.name, activeLanguage),
            fromX: artifactFlightStart.left + artifactFlightStart.width / 2,
            fromY: artifactFlightStart.top + artifactFlightStart.height / 2,
            deltaX: targetRect.left + targetRect.width / 2 - (artifactFlightStart.left + artifactFlightStart.width / 2),
            deltaY: targetRect.top + targetRect.height / 2 - (artifactFlightStart.top + artifactFlightStart.height / 2),
          });
          window.setTimeout(() => setArtifactFlight(null), 850);
        });
      }

      setTimeout(() => setResult(null), 2800);
    } catch (error) {
      console.error('[tasks] mission completion failed', {
        taskId: task?.id,
        locationId: selectedLocation?.id,
        message: error?.message || 'unknown_error',
        code: error?.code || null,
      });
    } finally {
      runningRef.current = false;
      setRunningId(null);
    }
  };

  const claimCollectionReward = async (locationOverride = null) => {
    const rewardLocation = locationOverride || selectedLocation;
    if (!rewardLocation || !rewardLocation.collectionItems?.every((item) => (collectionCounts[item.id] || 0) >= 1)) {
      throw Object.assign(new Error('Collection is incomplete'), { code: 'COLLECTION_INCOMPLETE' });
    }
    const rewardWeapon = rewardLocation.rewardWeapon;
    await onUpdateProfile({ playerAction: { type: 'collection-claim', locationId: rewardLocation.id } });

    setResult({
      task: `${localizeText(rewardLocation.nameI18n || rewardLocation.name, activeLanguage)} reward`,
      tentacles: 0,
      xp: 0,
      rewardClaimed: true,
      rewardWeapon,
    });
    setTimeout(() => setResult(null), 2800);
  };

  if (!selectedLocation) {
    return (
      <div className="flex min-h-0 flex-col overflow-hidden" style={{ height: 'calc(100% - var(--bottom-nav-space, 0px))' }}>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-2 pb-2 pt-2" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <BossStyleFrame innerClassName="px-3 py-3">
          <div className="relative h-[116px] w-full overflow-hidden">
            <img src={missionBanner} alt={localizeText(LOCATION_PICKER_TITLE, activeLanguage)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,245,230,0.12)_0%,rgba(255,245,230,0.04)_40%,rgba(0,0,0,0.2)_100%)]" />
            <div className="absolute inset-x-0 top-[50%] -translate-y-1/2 flex items-center justify-center px-4 text-center font-mono text-[19px] font-bold text-[#ffffff] drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
              {localizeText(LOCATION_PICKER_TITLE, activeLanguage)}
            </div>
          </div>
          {passiveLocations.length > 0 ? (
            <PassiveClaimCard
              passiveLocations={passiveLocations}
              profile={profile}
              sharedReadyAt={passiveSharedReadyAt}
              claiming={Boolean(passiveClaimingId)}
              afkTitle={afkTitle}
              claimLabel={claimLabel}
              readyLabel={readyLabel}
              language={activeLanguage}
              onClaim={claimPassiveReward}
              onOpenArtifacts={() => setArtifactsOverviewOpen(true)}
            />
          ) : null}
        </BossStyleFrame>

        <div className="space-y-3">
          {QUEST_LOCATIONS.map((location) => (
            <StageCard key={location.id} location={location} onSelect={setSelectedLocationId} language={activeLanguage} locked={!isQuestLocationUnlocked(profile, location.id)} lockHint={getLocationLockHint(location)} />
          ))}
        </div>
        </div>
        {artifactsOverviewOpen ? <ArtifactsOverview profile={profile} language={activeLanguage} counts={collectionCounts} rewardClaims={collectionRewardClaims} onClose={() => setArtifactsOverviewOpen(false)} onGo={(locationId) => { setSelectedLocationId(locationId); setArtifactsOverviewOpen(false); }} onClaim={claimCollectionReward} /> : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden" style={{ height: 'calc(100% - var(--bottom-nav-space, 0px))' }}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-2 pb-2 pt-2" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <button type="button" onClick={() => setSelectedLocationId(null)} className="mb-1 ml-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8fa75f]">
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('tasks_panel.back_to_locations')}
      </button>
      <PanelFrame innerClassName="px-2.5 py-2.5">

        {selectedLocation.bannerImage ? (
          <div className="-mt-0.5 overflow-hidden">
            <img src={selectedLocation.bannerImage} alt={localizeText(selectedLocation.nameI18n || selectedLocation.name, activeLanguage)} loading="lazy" decoding="async" className="h-[104px] w-full object-cover object-top" />
          </div>
        ) : null}

        <div className={`${selectedLocation.bannerImage ? 'mt-1.5' : ''} px-4 pb-3 pt-4`}>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: selectedLocation.accent }}>{selectedLocation.nickname}</p>
            <h3 className="mt-1 font-mono text-[22px] font-bold text-[#edf8d9]">{localizeText(selectedLocation.nameI18n || selectedLocation.name, activeLanguage)}</h3>
            <p className="mt-2 font-mono text-[11px] leading-[1.45] text-[#b9caa8]">{localizeText(selectedLocation.bannerI18n || selectedLocation.banner, activeLanguage)}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#28ee90] bg-[#10140f] px-2.5 py-1 font-mono text-[10px] text-[#d7e8c7]">{localizeDifficulty(selectedLocation.difficulty, activeLanguage)}</span>
            <span className="rounded-full border border-[#28ee90] bg-[#10140f] px-2.5 py-1 font-mono text-[10px]" style={{ color: selectedLocation.accent }}>
              <MapPinned className="mr-1 inline h-3 w-3" />
              {t('tasks_panel.missions_count', { count: selectedLocation.tasks.length })}
            </span>
          </div>
        </div>
      </PanelFrame>


      <AnimatePresence>
        {result?.collectionDrop ? (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="pointer-events-none fixed inset-x-0 top-[88px] z-[225] flex justify-center px-4"
          >
            <div className="pointer-events-auto w-[min(calc(100vw-28px),420px)] rounded-[10px] border border-[#28ee90] bg-[linear-gradient(180deg,#121812_0%,#090c08_100%)] px-4 py-4 shadow-[0_18px_38px_rgba(0,0,0,0.5)]">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[#8bff58]">reward</p>
            <p className="mt-1 text-center font-mono text-[14px] font-bold text-[#edf8d9]">{result.task}</p>
            {(result.tentacles || result.xp || result.strength) ? (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-[#9ddf74]">
                <span className="inline-flex items-center gap-1">
                  <img src={tentaclesRewardIcon} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-3.5 w-3.5 object-contain" />
                  <span>+{result.tentacles || 0} tentacles</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <img src={expUiIcon} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-3.5 w-3.5 object-contain" />
                  <span>+{result.xp || 0} EXP</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <img src={levelUiIcon} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-3.5 w-3.5 object-contain" />
                  <span>+{result.strength || 0} CA</span>
                </span>
              </div>
            ) : null}

            {result.collectionDrop ? (<>
              <div className="artifact-drop-reveal mt-2 flex items-center gap-2 rounded-[12px] border border-[#28ee90] bg-[#10210b] px-2 py-2">
                <img src={result.collectionDrop.framedIcon || result.collectionDrop.icon} alt={localizeText(result.collectionDrop.nameI18n || result.collectionDrop.name, activeLanguage)} loading="lazy" decoding="async" className="artifact-drop-float h-[46px] w-[46px] shrink-0 object-contain" />
                <div>
                  <p className="font-mono text-[9px] uppercase text-[#8bff58]">
                    {activeLanguage === 'en' ? 'Collection part found' : activeLanguage === 'ru' ? 'Найдена часть коллекции' : 'Знайдено частину колекції'}
                  </p>
                  <p className="font-mono text-[11px] text-[#edf8d9]">{localizeText(result.collectionDrop.nameI18n || result.collectionDrop.name, activeLanguage)}</p>
                </div>
              </div>
              <style>{`.artifact-drop-reveal { animation: artifact-drop-reveal .35s ease-out both; } .artifact-drop-float { animation: artifact-drop-float 1.8s ease-out .2s both; filter: drop-shadow(0 0 7px rgba(139,255,88,.8)); } @keyframes artifact-drop-reveal { from { opacity: 0; transform: translateY(10px) scale(.92); } to { opacity: 1; transform: translateY(0) scale(1); } } @keyframes artifact-drop-float { 0% { opacity: 0; transform: translateY(16px) scale(.72); } 25% { opacity: 1; transform: translateY(0) scale(1.08); } 72% { opacity: 1; transform: translateY(-18px) scale(1); } 100% { opacity: 0; transform: translateY(-38px) scale(.72); } }`}</style>
            </>) : null}

            {result.bossKeyDrop ? (
              <div className="mt-2 flex items-center gap-2 rounded-[12px] border border-[#28ee90] bg-[#0d1721] px-2 py-2">
                <BossKeyIcon rank={result.bossKeyDrop.rank} title="Boss key" className="h-[46px] w-[46px] shrink-0" />
                <div>
                  <p className="font-mono text-[9px] uppercase text-[#8fdcff]">
                    {activeLanguage === 'en' ? 'Boss key found' : activeLanguage === 'ru' ? 'Найден ключ от босса' : 'Знайдено ключ від боса'}
                  </p>
                  <p className="font-mono text-[11px] text-[#edf8d9]">{localizeText(result.bossKeyDrop.bossNameI18n, activeLanguage)} x1</p>
                </div>
              </div>
            ) : null}

            {result.rewardClaimed ? (
              <div className="mt-2 flex items-center gap-2 rounded-[12px] border border-[#28ee90] bg-[#171107] px-2 py-2">
                <img src={result.rewardWeapon?.icon || treasure1} alt="Reward weapon" loading="lazy" decoding="async" className="h-[46px] w-[46px] shrink-0 object-contain" />
                <div>
                  <p className="font-mono text-[9px] uppercase text-[#ffd36d]">
                    {activeLanguage === 'en' ? 'Collection completed' : activeLanguage === 'ru' ? 'Коллекция собрана' : 'Колекцію зібрано'}
                  </p>
                  <p className="font-mono text-[11px] text-[#edf8d9]">+{result.rewardWeapon?.count || 1} {localizeText(result.rewardWeapon?.nameI18n || result.rewardWeapon?.name, activeLanguage) || (activeLanguage === 'en' ? 'Reward received' : activeLanguage === 'ru' ? 'Награда получена' : 'Нагороду отримано')}</p>
                </div>
              </div>
            ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {artifactFlight ? (
        <div
          key={artifactFlight.key}
          className="artifact-card-flight pointer-events-none fixed z-[230] h-12 w-12"
          style={{ left: artifactFlight.fromX - 24, top: artifactFlight.fromY - 24, '--artifact-flight-x': `${artifactFlight.deltaX}px`, '--artifact-flight-y': `${artifactFlight.deltaY}px` }}
          role="img"
          aria-label={artifactFlight.label}
        >
          <img src={artifactFlight.icon} alt="" className="h-full w-full object-contain drop-shadow-[0_0_10px_rgba(139,255,88,.9)]" />
          <style>{`@keyframes artifact-card-flight { 0% { opacity: 0; transform: translate(0,0) scale(.55) rotate(-12deg); } 18% { opacity: 1; transform: translate(0,0) scale(1.15) rotate(8deg); } 100% { opacity: 0; transform: translate(var(--artifact-flight-x),var(--artifact-flight-y)) scale(.48) rotate(0); } } .artifact-card-flight { animation: artifact-card-flight .78s cubic-bezier(.22,.68,.28,1) both; } @media (prefers-reduced-motion: reduce) { .artifact-card-flight { animation-duration: .01ms; } }`}</style>
        </div>
      ) : null}

      <div className="space-y-3">
        {selectedLocation.tasks.map((task, index) => (
          <TaskRow
            key={task.id}
            task={task}
            progress={getTaskLoopProgress(profile, task)}
            loopCount={getTaskLoopCount(profile, task)}
            onRun={() => runTask(task)}
            isRunning={runningId === task.id}
            canRun={availableEnergy >= task.energy && !runningId}
            accent={selectedLocation.accent}
            resultDropHint={
              activeLanguage === 'en'
                ? 'Artifact guaranteed per cycle. +5% chance per segment.'
                : activeLanguage === 'ru'
                  ? 'Артефакт гарантирован за цикл. +5% шанс за каждое деление.'
                  : 'Артефакт гарантовано за цикл. +5% шанс за кожну поділку.'
            }
            isLocked={task.id.endsWith('-final') && !finalTaskUnlocked}
            lockHint={t('tasks_panel.final_task_unlock_hint')}
            goLabel={goLabel}
            language={activeLanguage}
            tutorialTarget={undefined}
            tutorialGoIndex={index < 7 ? index : undefined}
            tutorialBlock={index < 7 ? index : undefined}
            tutorialSegmentIndex={index < 7 ? Math.min(getTaskLoopProgress(profile, task), task.target - 1) : undefined}
          />
        ))}
      </div>

      {artifactsOverviewOpen ? <ArtifactsOverview profile={profile} language={activeLanguage} counts={collectionCounts} rewardClaims={collectionRewardClaims} onClose={() => setArtifactsOverviewOpen(false)} onGo={(locationId) => { setSelectedLocationId(locationId); setArtifactsOverviewOpen(false); }} onClaim={claimCollectionReward} /> : null}

      {selectedLocation.collectionItems?.length ? (
        <div className="space-y-1" data-tutorial-target="quest-artifacts">
          <p className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8fa75f]">{t('tasks_panel.collection')}</p>
          <PanelFrame innerClassName="px-4 pb-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-mono text-[18px] font-bold text-[#edf8d9]">{t('tasks_panel.location_artifacts_title')}</h4>
            </div>
            <div className="rounded-full border border-[#28ee90] bg-[#10210b] px-2.5 py-1 font-mono text-[10px] text-[#8bff58]">
              <Sparkles className="mr-1 inline h-3 w-3" />
              {selectedLocation.collectionItems.filter((item) => (collectionCounts[item.id] || 0) > 0).length}/{selectedLocation.collectionItems.length}
            </div>
          </div>
          <p className="mt-3 font-mono text-[11px] leading-[1.45] text-[#b9caa8]">{t('tasks_panel.location_artifacts_hint')}</p>
          <div className="mt-4 p-1">
            <CollectionGrid
              items={selectedLocation.collectionItems}
              owned={ownedCollection}
              counts={collectionCounts}
              rewardUnlocked={collectionRewardUnlocked}
              rewardClaimsCount={collectionRewardClaimsCount}
              onClaimReward={() => setOpeningCollectionReward(selectedLocation)}
              language={activeLanguage}
              rewardIcon={treasure1}
            />
          </div>
          </PanelFrame>
        </div>
      ) : null}
      {openingCollectionReward ? <LootBoxModal
        boxType="standard_boss"
        lang={activeLanguage === 'uk' ? 'ua' : activeLanguage}
        onClose={() => setOpeningCollectionReward(null)}
        onOpenBox={() => getCollectionRewardDrops(openingCollectionReward)}
        onApplyDrops={async () => { await claimCollectionReward(openingCollectionReward); }}
      /> : null}
      </div>
    </div>
  );
}

function ArtifactsOverview({ profile, language, counts, rewardClaims, onClose, onGo, onClaim }) {
  const [openingLocation, setOpeningLocation] = useState(null);
  const completed = QUEST_LOCATIONS.filter((location) => location.collectionItems?.every((item) => (counts[item.id] || 0) >= 1)).length;
  const available = QUEST_LOCATIONS.filter((location) => location.collectionItems?.every((item) => (counts[item.id] || 0) >= 1)).length;
  return <>
  <GameWindow blurBackground className="bg-transparent p-3">
    <div className="mx-auto w-full max-w-[520px] pb-8 pt-2">
      <div className="mb-3 flex items-center justify-between border border-[#28ee90] bg-[#0d180d] p-3">
        <div><h2 className="font-mono text-[17px] font-black text-[#f4ffd9]">{language === 'ru' ? 'АРТЕФАКТЫ ПЛАНЕТ' : language === 'en' ? 'PLANET ARTIFACTS' : 'АРТЕФАКТИ ПЛАНЕТ'}</h2><p className="mt-1 font-mono text-[10px] font-bold text-[#8bff58]">{language === 'ru' ? `СОБРАНО НАБОРОВ: ${completed}/8 · ДОСТУПНО НАГРАД: ${available}` : language === 'en' ? `SETS COMPLETED: ${completed}/8 · REWARDS AVAILABLE: ${available}` : `ЗІБРАНО НАБОРІВ: ${completed}/8 · ДОСТУПНО НАГОРОД: ${available}`}</p></div>
        <button type="button" onClick={onClose} className="text-2xl text-[#d8ff5a]">×</button>
      </div>
      <div className="space-y-3">{QUEST_LOCATIONS.map((location) => {
        const complete = location.collectionItems?.every((item) => (counts[item.id] || 0) >= 1);
        const claimed = Number(rewardClaims[location.id] || 0);
        const unlocked = isQuestLocationUnlocked(profile, location.id);
        return <div key={location.id} className={`border bg-[#10170d] p-2 ${complete ? 'border-[#8bff58]' : 'border-[#405737]'}`}>
          <div className="relative h-16 overflow-hidden border border-[#355032] bg-[#182314]">{location.bannerImage ? <img src={location.bannerImage} alt="" className="h-full w-full object-cover opacity-60" /> : null}<p className="absolute inset-0 flex items-center px-3 font-mono text-[14px] font-black text-white drop-shadow-[0_2px_3px_#000]">{localizeText(location.nameI18n || location.name, language)}</p></div>
          <div className="mt-2 grid grid-cols-8 gap-1">{location.collectionItems.map((item) => { const count = counts[item.id] || 0; return <div key={item.id} className="relative aspect-square min-w-0 overflow-hidden rounded border border-[#385132] bg-[#0b100b] p-0.5"><img src={item.framedIcon || item.icon} alt="" className={`h-full w-full object-contain ${count ? '' : 'grayscale opacity-40'}`} /><span className="absolute bottom-0 right-0 rounded border border-[#9bb18a] bg-[#111811] px-0.5 font-mono text-[8px] font-black text-white">{count}</span></div>; })}<div className={`relative aspect-square min-w-0 overflow-hidden rounded border p-0.5 ${complete ? 'border-[#ffd84d] shadow-[0_0_10px_rgba(255,216,77,.65)]' : 'border-[#385132] opacity-60'}`}><img src={treasure1} alt="" className="h-full w-full object-contain" />{claimed ? <span className="absolute bottom-0 right-0 rounded border border-[#9bb18a] bg-[#111811] px-0.5 font-mono text-[8px] font-black text-white">{claimed}</span> : null}</div></div>
          <div className="mt-2 flex gap-2"><GameTextureButton type="button" disabled={!unlocked} onClick={() => onGo(location.id)} tone={unlocked ? 'green' : 'gray'} className="h-11 flex-1"><span className={`relative z-10 font-mono text-[10px] font-black uppercase ${unlocked ? 'text-[#172016]' : 'text-[#f4f7ed]'}`}>{language === 'en' ? 'GO' : 'ПЕРЕЙТИ'}</span></GameTextureButton><GameTextureButton type="button" disabled={!complete} onClick={() => setOpeningLocation(location)} tone={complete ? 'green' : 'gray'} className="h-11 flex-1"><span className={`relative z-10 font-mono text-[10px] font-black uppercase ${complete ? 'text-[#172016]' : 'text-[#f4f7ed]'}`}>{language === 'en' ? 'CLAIM' : language === 'ru' ? 'ПОЛУЧИТЬ' : 'ОТРИМАТИ'}</span></GameTextureButton></div>
        </div>;
      })}</div>
    </div>
  </GameWindow>
  {openingLocation ? <LootBoxModal
    boxType="collection"
    lang={language === 'uk' ? 'ua' : language}
    onClose={() => setOpeningLocation(null)}
    onOpenBox={() => getCollectionRewardDrops(openingLocation)}
    onApplyDrops={async () => { await onClaim(openingLocation); }}
  /> : null}
  </>;
}
