import { openLootReward } from '@/lib/lootOpening';
import pumpkinIcon from '@/assets/ui/halloween-pumpkin.webp';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import MarkerFrame from './MarkerFrame';
import chestScanner from '@/assets/boss-reward-backgrounds/chest-scanner.webp';
import lootVault from '@/assets/boss-reward-backgrounds/loot-vault.webp';
import grayBox from '@/assets/box/gray-box.png';
import greenBox from '@/assets/box/green-box.png';
import blueBox from '@/assets/box/blue-box.png';
import yellowBox from '@/assets/box/yellow-box.png';
import redBox from '@/assets/box/red-box.png';
import starterOfferBox from '@/assets/box/Starter Offer.png';
import firstBossOfferBox from '@/assets/box/First Boss Offer.png';
import weeklyOfferBox from '@/assets/box/Weekly Offer.png';
import bossDamagePackBox from '@/assets/box/Boss Damage Pack.png';
import progressPackBox from '@/assets/box/Progress Pack.png';
import poisonPackWeeklyBox from '@/assets/box/Poison Pack Weekly.png';
import dailyToxicPackBox from '@/assets/box/Daily Toxic Pack.png';
import bossKeyIcon from '@/assets/boss/boss-keys/key-1.png';
import smallPoisonIcon from '@/assets/skills/small-poison.png';
import mediumPoisonIcon from '@/assets/skills/medium-poison.png';
import largePoisonIcon from '@/assets/skills/large-poison.png';
import poisonCritGif from '@/assets/boss/poision.gif';
import bossFightBackground from '@/assets/boss/boss_1/boss1_bck/background.png';
import bossTwoFightBackground from '@/assets/boss/boss_1/boss1_bck/background_b2.png';
import underweightBackgroundReward from '@/assets/boss-ui/background-rewards/underweight-bg.png';
import mothBackgroundReward from '@/assets/boss-ui/background-rewards/moth-bg.png';
import shorkBackgroundReward from '@/assets/boss-ui/background-rewards/shork-bg.png';
import GameTextureButton from './GameTextureButton';
import { BOX_TYPES } from '@/lib/lootBoxes';
import { getEnergyRewardIcon, getResourceIcon } from '@/lib/resourceIcons';
import { DEFAULT_EQUIPMENT_ITEMS, EQUIPMENT_SLOTS, localizeEquipmentItemName } from '@/components/game/equipmentData';

const BOX_IMAGE_BY_TYPE = {
  standard_boss: grayBox,
  damage_box_1: grayBox,
  damage_box_2: greenBox,
  damage_box_3: blueBox,
  damage_box_4: yellowBox,
  damage_box_5: redBox,
  top_small: grayBox,
  top_bronze: greenBox,
  top_silver: blueBox,
  top_gold: yellowBox,
  boss_part: grayBox,
  activity: grayBox,
  boss_top100: grayBox,
  collection: greenBox,
  boss_top10: greenBox,
  resource: blueBox,
  boss_top1: yellowBox,
  weapon: redBox,
  boss_damage_pack: bossDamagePackBox,
  poison_pack: poisonPackWeeklyBox,
  weekly_progress_pack: progressPackBox,
  starter_offer: starterOfferBox,
  first_boss_offer: firstBossOfferBox,
  weekly_offer: weeklyOfferBox,
  daily_toxic_pack: dailyToxicPackBox,
};

const BOSS_BACKGROUND_REWARD_IMAGES = {
  heli: underweightBackgroundReward,
  tank: mothBackgroundReward,
  chinook: shorkBackgroundReward,
};

function getBoxImage(boxType) {
  return BOX_IMAGE_BY_TYPE[boxType] || grayBox;
}

function getEquipmentItemById(itemId) {
  if (!itemId) return null;
  return DEFAULT_EQUIPMENT_ITEMS.find((item) => item?.id === itemId) || null;
}

function isRenderableIcon(icon) {
  if (!icon || typeof icon !== 'string') return false;
  return icon.startsWith('/') || icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('blob:');
}

function getSlotFallbackIcon(item, itemId) {
  const slotFromId = String(itemId || '').split('_').pop();
  const slot = item?.slot || slotFromId || 'weapon';
  return EQUIPMENT_SLOTS.find((entry) => entry.id === slot)?.icon || EQUIPMENT_SLOTS[0]?.icon || null;
}

function normalizeModalDrop(drop, lang = 'ua') {
  if (!drop) return drop;
  const maybeItemId = drop?.itemId || drop?.petId || drop?.equipmentItemId || drop?.item?.id || null;
  const catalogItem = getEquipmentItemById(maybeItemId);
  const isSpecialItem = ['equipment', 'boss_gear_piece', 'pet', 'boss_pet'].includes(drop?.type) || Boolean(catalogItem);
  if (!isSpecialItem) return drop;

  const item = catalogItem || drop?.item || null;
  if (!item && import.meta.env?.DEV) {
    console.warn('[LootBoxModal] Missing equipment config for reward', drop);
  }

  const rawIcon = item?.uiIcon || item?.icon || drop?.icon || null;
  const icon = isRenderableIcon(rawIcon) ? rawIcon : getSlotFallbackIcon(item, maybeItemId);
  const localizedName = item ? localizeEquipmentItemName(item, lang) : '';
  const prettifiedItemId = maybeItemId
    ? String(maybeItemId).replace(/[_-]+/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase())
    : '';
  const fallbackName = prettifiedItemId || (lang === 'ru' ? 'Награда' : lang === 'en' ? 'Reward' : 'Нагорода');

  return {
    ...drop,
    type: drop?.type === 'pet' || drop?.type === 'boss_pet' || item?.slot === 'pet' ? 'pet' : 'equipment',
    itemId: item?.id || maybeItemId || drop?.itemId || drop?.equipmentItemId || null,
    petId: drop?.petId || (item?.slot === 'pet' ? item?.id : null),
    item,
    icon,
    name: localizedName || drop?.item?.name || fallbackName,
    qty: 1,
  };
}

function getDropImage(drop) {
  if (drop?.type === 'pumpkin') return pumpkinIcon;
  if (drop?.type === 'equipment' || drop?.type === 'pet') {
    const equipmentIcon = drop?.icon || drop?.item?.uiIcon || drop?.item?.icon || null;
    if (isRenderableIcon(equipmentIcon)) return equipmentIcon;
    return getResourceIcon('equipment') || getResourceIcon('tentacles') || smallPoisonIcon;
  }
  if (isRenderableIcon(drop?.icon)) return drop.icon;
  if (drop.type === 'keycard') return bossKeyIcon;
  if (drop.type === 'background' || drop.type === 'boss_background') {
    return BOSS_BACKGROUND_REWARD_IMAGES[drop?.bossId]
      || (drop.backgroundId === 'boss-2-fight' ? bossTwoFightBackground : bossFightBackground);
  }
  if (drop.type === 'tentacles') return getResourceIcon('tentacles');
  if (drop.type === 'xp') return getResourceIcon('xp');
  if (drop.type === 'energy') return getEnergyRewardIcon(drop.qty);
  if (drop.type === 'poison') return smallPoisonIcon;
  if (drop.type === 'weapon') {
    if (drop.id === 'satchel' || drop.id === 'small-poison') return smallPoisonIcon;
    if (drop.id === 'f1' || drop.id === 'f4' || drop.id === 'medium-poison') return mediumPoisonIcon;
    if (drop.id === 'c4' || drop.id === 'large-poison') return largePoisonIcon;
    return smallPoisonIcon;
  }
  return getResourceIcon(drop.type) || getResourceIcon('tentacles') || smallPoisonIcon;
}

function localizeDropName(drop, lang = 'ua') {
  if (drop?.type === 'enhancement_gum') {
    const names = {ua:{normal:'Звичайна жувачка',improved:'Покращена жувачка',premium:'Гарантована жувачка'},ru:{normal:'Обычная жвачка',improved:'Улучшенная жвачка',premium:'Гарантированная жвачка'},en:{normal:'Ordinary gum',improved:'Improved gum',premium:'Guaranteed gum'}};
    return (names[lang] || names.ua)[drop.gum || drop.id] || 'Gum';
  }
  const t = {
    ua: { pumpkin: 'Гарбуз', tentacles: 'tentacles', xp: 'EXP', strength: 'CA', energy: 'Енергія', premium: 'T-Pape', stars: 'T-Pape', crystal: 'T-Pape', crystals: 'T-Pape', spin: 'Спін', poison: 'Яд', keycard: 'Ключ боса', equipment: 'Екіпіровка', boss_pet: 'Пет боса', boss_gear_piece: 'Шмотка боса', boss_background: 'Сцена бою з босом', background: 'Сцена бою з босом', collection_item: 'Колекційний предмет', satchel: 'Малий яд', f1: 'Середній яд', f4: 'Середній яд', c4: 'Фляга з отрутою' },
    en: { pumpkin: 'Pumpkin', tentacles: 'tentacles', xp: 'EXP', strength: 'CA', energy: 'Energy', premium: 'T-Pape', stars: 'T-Pape', crystal: 'T-Pape', crystals: 'T-Pape', spin: 'Spin', poison: 'Poison', keycard: 'Boss Key', equipment: 'Equipment', boss_pet: 'Boss Pet', boss_gear_piece: 'Boss Gear Piece', boss_background: 'Boss Fight Scene', background: 'Boss Fight Scene', collection_item: 'Collection Item', satchel: 'Small Poison', f1: 'Medium Poison', f4: 'Medium Poison', c4: 'Poison flask' },
    ru: { pumpkin: 'Тыква', tentacles: 'tentacles', xp: 'EXP', strength: 'CA', energy: 'Энергия', premium: 'T-Pape', stars: 'T-Pape', crystal: 'T-Pape', crystals: 'T-Pape', spin: 'Спин', poison: 'Яд', keycard: 'Ключ босса', equipment: 'Экипировка', boss_pet: 'Пет босса', boss_gear_piece: 'Шмотка босса', boss_background: 'Сцена боя с боссом', background: 'Сцена боя с боссом', collection_item: 'Коллекционный предмет', satchel: 'Малый яд', f1: 'Средний яд', f4: 'Средний яд', c4: 'Фляга с ядом' },
  }[lang] || {
    pumpkin: 'Гарбуз', tentacles: 'tentacles', xp: 'EXP', strength: 'CA', energy: 'Енергія', premium: 'T-Pape', stars: 'T-Pape', crystal: 'T-Pape', crystals: 'T-Pape', spin: 'Спін', poison: 'Яд', keycard: 'Ключ боса', equipment: 'Екіпіровка', boss_pet: 'Пет боса', boss_gear_piece: 'Шмотка боса', boss_background: 'Сцена бою з босом', background: 'Сцена бою з босом', collection_item: 'Колекційний предмет', satchel: 'Малий яд', f1: 'Середній яд', f4: 'Середній яд', c4: 'Фляга з отрутою',
  };
  const isBrokenText = (value) => typeof value === 'string' && /[РЃЄІЇҐёЁ]/.test(value);
  const keyCandidates = [
    String(drop?.type || '').toLowerCase(),
    String(drop?.id || '').toLowerCase(),
    String(drop?.resourceType || '').toLowerCase(),
    String(drop?.rewardType || '').toLowerCase(),
    String(drop?.currency || '').toLowerCase(),
  ].filter(Boolean);
  const mappedKey = keyCandidates.find((key) => t[key]);

  if (drop?.type === 'weapon' && t[drop?.id]) return t[drop.id];
  if (['equipment', 'boss_gear_piece', 'boss_pet', 'collection_item'].includes(drop?.type) && drop?.name) return drop.name;
  if (mappedKey) return t[mappedKey];
  if (isBrokenText(drop?.name)) return lang === 'ru' ? 'Награда' : lang === 'en' ? 'Reward' : 'Нагорода';
  return drop?.name || 'Drop';
}

function ActionButton({ label, tone = 'green', onClick, disabled = false, className = '', textClassName = '' }) {
  return (
    <GameTextureButton
      type="button"
      disabled={disabled}
      onClick={onClick}
      tone={tone}
      className={`${disabled ? 'opacity-55 grayscale-[0.1]' : ''} ${className}`}
    >
      <span className={`relative z-[1] font-sans text-[13px] font-black uppercase tracking-[0.08em] ${textClassName}`}>
        {label}
      </span>
    </GameTextureButton>
  );
}

function DropTile({ drop, delay, lang }) {
  const normalizedDrop = normalizeModalDrop(drop, lang);
  const showAmount = !['equipment', 'pet'].includes(normalizedDrop?.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 20 }}
      className="flex min-h-[clamp(108px,29vw,124px)] w-[clamp(72px,22vw,84px)] shrink-0 flex-col items-center gap-1 rounded-[10px] px-1 py-1.5"
    >
      <div className="flex h-[clamp(52px,16vw,64px)] w-[clamp(52px,16vw,64px)] items-center justify-center">
        {normalizedDrop.type === 'enhancement_gum' ? <span role="img" aria-label={localizeDropName(normalizedDrop, lang)} className="h-[clamp(48px,15vw,60px)] w-[clamp(48px,15vw,60px)]" style={{backgroundImage:"url('/local-enhancement/gums.webp')",backgroundSize:'300% 100%',backgroundRepeat:'no-repeat',backgroundPosition:({normal:'0%',improved:'50%',premium:'100%'})[normalizedDrop.gum || normalizedDrop.id] + ' center'}}/> : <img src={getDropImage(normalizedDrop)} alt={localizeDropName(normalizedDrop, lang)} className="h-[clamp(48px,15vw,60px)] w-[clamp(48px,15vw,60px)] object-contain" />}
      </div>
      <p className="w-full whitespace-normal break-words text-center font-mono text-[9px] leading-[11px] uppercase tracking-[0.04em] text-[#eef7d9]">
        {localizeDropName(normalizedDrop, lang)}
      </p>
      {showAmount ? <p className="font-mono text-[15px] font-black leading-none text-[#dfff82]">x{normalizedDrop.qty || 1}</p> : null}
    </motion.div>
  );
}

export default function LootBoxModal({ boxType, boxName = '', bossId, fightId, instanceId = null, portalRoot = null, onClose, onOpenBox, onApplyDrops, lang = 'ua', initialDrops = null }) {
  const gameWindowRoot = portalRoot || (typeof document !== 'undefined'
    ? document.getElementById('game-window-root')
    : null);
  const openingRef = useRef(false);
  const [phase, setPhase] = useState(initialDrops ? 'result' : 'preview');
  const [drops, setDrops] = useState(initialDrops || []);
  const [errorMessage, setErrorMessage] = useState('');
  const box = { ...(BOX_TYPES[boxType] || BOX_TYPES.activity), ...(boxName ? { name: boxName } : {}) };
  const boxImage = useMemo(() => getBoxImage(boxType), [boxType]);
  const { t } = useTranslation();

  const handleOpen = async () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setErrorMessage('');
    setPhase('opening');
    try {
      const nextDrops = await openLootReward({
        open: onOpenBox, apply: onApplyDrops,
        context: { boxType, bossId, fightId, instanceId },
      });
      setDrops(nextDrops);
      setPhase('result');
    } catch (error) {
      const alreadyClaimed = error?.code === 'LOOT_ALREADY_CLAIMED' || error?.status === 409 || error?.status === 404;
      if (alreadyClaimed) {
        setErrorMessage('Reward was already saved. Check your inventory.');
        setPhase('preview');
        return;
      }
      const language = lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : 'ua';
      const messages = { ua: 'Сервер не відповів. Перевір пошту та інвентар і спробуй ще раз.', ru: 'Сервер не ответил. Проверь почту и инвентарь и попробуй ещё раз.', en: 'Server did not respond. Check your mail and inventory, then try again.' };
      setErrorMessage(error?.code === 'CHEST_TIMEOUT' ? messages[language] : `${t('mail_panel.open_error')} (${error?.code || 'UNKNOWN_ERROR'})`);
      setPhase('preview');
    } finally {
      openingRef.current = false;
    }
  };

  return createPortal(
    <div data-tutorial-loot-box="true" onClick={event => { if (event.target === event.currentTarget && !openingRef.current) onClose?.(); }} className={`${gameWindowRoot ? 'absolute' : 'fixed'} inset-0 z-[99999] pointer-events-auto flex min-h-0 items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-2 py-2 sm:px-4 sm:py-6 touch-pan-y`}>
      <div className="my-auto max-h-full w-full max-w-[min(390px,calc(100vw-16px))] overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
        <MarkerFrame className="w-full bg-[rgba(6,9,6,0.96)]" innerClassName="relative px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3" variant="transparent" backgroundImage={fightId && !initialDrops ? (phase === 'result' ? lootVault : chestScanner) : undefined}>
          {
            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-[10px] bg-transparent text-[#d8ff84] transition hover:text-[#f1ffc9]"
              aria-label="Close"
            >
              <X className="h-5 w-5 stroke-[2.6]" />
            </button>
          }

          <div className="text-center">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#d7ff91]">{box.name}</p>
            <p className="mt-1 font-mono text-[10px] text-[#8fa66f]">
              {initialDrops ? (lang === 'en' ? 'PROMO REWARDS' : lang === 'ru' ? 'НАГРАДЫ ПРОМО' : 'НАГОРОДИ ПРОМО') : phase === 'preview' ? t('loot_modal.tap_to_open') : phase === 'opening' ? t('loot_modal.opening') : t('loot_modal.loot_in_chest')}
            </p>
            {errorMessage ? <p className="mt-1 font-mono text-[10px] text-[#ff8978]">{errorMessage}</p> : null}
          </div>

          <AnimatePresence mode="wait">
            {phase === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-1 flex-col items-center justify-center pt-2">
                <motion.div
                  className="clan-emblem-wrapper has-rarity"
                  style={{
                    width: 'clamp(128px,30vw,166px)',
                    height: 'clamp(128px,30vw,166px)',
                    '--clan-rarity-color': '#ffd347',
                    '--clan-rarity-secondary': 'transparent',
                    '--clan-emblem-mask': `url("${boxImage}")`,
                  }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span aria-hidden="true" className="emblem-rarity-outline" />
                  <span aria-hidden="true" className="emblem-rarity-glow" />
                  <span aria-hidden="true" className="emblem-rarity-pulsar" />
                  <img src={boxImage} alt={box.name} className="emblem-image h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.28)]" />
                </motion.div>

                <div className="mt-3 flex w-full justify-center">
                  <ActionButton
                    label={t('loot_modal.open_button')}
                    onClick={handleOpen}
                    className="h-[50px] min-w-[220px] w-fit px-5"
                    textClassName="text-[14px] text-[#173207]"
                  />
                </div>
              </motion.div>
            )}

            {phase === 'opening' && (
              <motion.div key="opening" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-1 flex-col items-center justify-center pt-2">
                <motion.div
                  className="relative h-[clamp(148px,42vw,176px)] w-[clamp(148px,42vw,176px)]"
                  animate={{ rotate: [0, -8, 9, -6, 6, 0], scale: [1, 1.08, 0.95, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <img
                    src={boxImage}
                    alt={box.name}
                    className="relative z-[1] h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.28)]"
                  />
                  <img
                    src={poisonCritGif}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-[2] h-full w-full scale-[1.12] object-contain mix-blend-screen opacity-95"
                  />
                </motion.div>

                <div className="mt-3 flex w-full justify-center">
                  <ActionButton
                    label={t('loot_modal.opening')}
                    disabled
                    className="h-[50px] min-w-[260px] w-fit px-6"
                    textClassName="text-[13px] tracking-[0.04em] text-[#173207]"
                  />
                </div>
              </motion.div>
            )}

            {phase === 'result' && (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-1 flex-col items-center pt-1">
                {!initialDrops && <motion.img
                  src={boxImage}
                  alt={box.name}
                  className="h-[clamp(92px,25svh,132px)] w-[clamp(92px,25svh,132px)] object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.28)]"
                  initial={{ scale: 0.86 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 17 }}
                />}

                <div className="mt-1 flex w-full flex-wrap justify-center gap-1">
                    {drops.map((drop, index) => (
                      <DropTile key={`${drop.id || drop.name}-${index}`} drop={drop} delay={index * 0.08} lang={lang} />
                    ))}
                </div>

                <div className="flex w-full justify-center pt-1 sm:pt-3">
                  <ActionButton
                    label={t('loot_modal.claim_button')}
                    tone="yellow"
                    onClick={onClose}
                    className="h-[56px] w-[220px]"
                    textClassName="text-[13px] tracking-[0.12em] text-[#1c210c]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </MarkerFrame>
      </div>
    </div>,
    gameWindowRoot || document.body,
  );
}
