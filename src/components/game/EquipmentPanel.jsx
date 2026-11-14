import EquipmentCatalogCard from './EquipmentCatalogCard';
import EquipmentSourceInfo from './EquipmentSourceInfo';
import RaidScarecrowPet from './RaidScarecrowPet';
import HereEarlyPet from './HereEarlyPet';
import NftPetClaimButton from './NftPetClaimButton';
import { translateUiText } from '@/lib/uiTextTranslations';
import { memo, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import LayeredHero from './LayeredHero';
import MarkerFrame from './MarkerFrame';
import {
  buildVisibleHeroSlots,
  calculateEquipmentEffects,
  CARDBOARD_SET_BONUS_NAME_I18N,
  CARDBOARD_SET_NAME_I18N,
  CARDBOARD_SURVIVOR_SET_ID,
  DEFAULT_EQUIPMENT_ITEMS,
  describeEquipmentBonuses,
  EQUIPMENT_SLOTS,
  findEquipmentItem,
  getEquipmentSourceLabel,
  getNoBonusLabel,
  localizeEquipmentItemName,
  normalizeEquippedLoadout,
  normalizeEquipmentInventory,
  NIGHT_DISINFECTOR_SET_ID,
  NIGHT_DISINFECTOR_SET_BONUS_NAME_I18N,
  NIGHT_DISINFECTOR_SET_NAME_I18N,
  NUVELOR_SET_ID,
  NEWBIE_PACK_II_SET_ID,
  NUVELOR_SET_BONUS_NAME_I18N,
  NUVELOR_SET_NAME_I18N,
  SET5_SET_ID,
  SET4_SET_ID,
  SET4_SET_NAME_I18N,
  SET4_SET_BONUS_NAME_I18N,
  SET5_SET_NAME_I18N,
  SET5_SET_BONUS_NAME_I18N,
} from './equipmentData';

function SlotButton({ slot, item, itemName, active, onClick, language }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[92px] w-[76px] flex-col items-center justify-start px-1 py-1 text-center transition ${
        active ? 'brightness-110' : ''
      }`}
    >
      <div className={`relative flex h-[66px] w-[66px] items-center justify-center border bg-[#081108] ${
        active ? 'border-[#28ee90] shadow-[0_0_10px_rgba(45,255,159,0.2)]' : 'border-[#28ee90]'
      }`}>
        {item ? (
          <img
            src={item.icon}
            alt={itemName}
            className={`h-[62px] w-[62px] object-contain ${active ? 'drop-shadow-[0_0_10px_rgba(185,243,106,0.22)]' : ''}`}
          />
        ) : (
          <span className={`font-mono text-lg font-black text-[#527143] ${active ? 'brightness-110' : ''}`}>{slot.id === 'pet' ? '×' : ''}</span>
        )}
      </div>
      <span className="mt-1 line-clamp-1 font-mono text-[9px] font-bold text-[#eff7da]">
        {item ? itemName : translateUiText(slot.label, language)}
      </span>
    </button>
  );
}

function EquipmentPanel({ profile, onClose, onUpdateProfile, onRefreshProfile }) {
  const lang = ['uk', 'ua', 'ru', 'en'].includes(profile?.language) ? profile.language : 'en';
  const equipmentInventory = useMemo(() => {
    const owned = normalizeEquipmentInventory(profile);
    const merged = new Map(DEFAULT_EQUIPMENT_ITEMS.map((item) => [item.id, item]));
    owned.forEach((item) => {
      const catalogItem = merged.get(item.id);
      if (catalogItem) {
        merged.set(item.id, {
          ...catalogItem,
          ...item,
          icon: catalogItem.icon || item.icon,
          names: catalogItem.names || item.names || null,
          setId: catalogItem.setId || item.setId || null,
          setNameI18n: catalogItem.setNameI18n || item.setNameI18n || null,
          setBonusNameI18n: catalogItem.setBonusNameI18n || item.setBonusNameI18n || null,
          sourceType: catalogItem.sourceType || item.sourceType || null,
          dropSource: catalogItem.dropSource ?? item.dropSource ?? null,
          dropBossId: catalogItem.dropBossId ?? item.dropBossId ?? null,
          purchasable: Boolean(catalogItem.purchasable),
          bossDrop: Boolean(catalogItem.bossDrop),
          bonuses: Array.isArray(catalogItem.bonuses) ? catalogItem.bonuses : [],
          layerSrc: item.layerSrc || catalogItem.layerSrc || null,
          renderArt: item.renderArt || catalogItem.renderArt || null,
          locked: false,
        });
        return;
      }
      merged.set(item.id, { ...item, locked: false });
    });
    return Array.from(merged.values());
  }, [profile]);

  const equippedItems = useMemo(() => normalizeEquippedLoadout(profile), [profile]);
  const visibleHeroSlots = useMemo(() => buildVisibleHeroSlots(equippedItems), [equippedItems]);
  const equipmentEffects = useMemo(() => calculateEquipmentEffects(profile, equipmentInventory), [profile, equipmentInventory]);
  const [selectedSlot, setSelectedSlot] = useState('weapon');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const itemsForSlot = useMemo(() => {
    const dedup = new Map();
    equipmentInventory
      .filter((item) => item.slot === selectedSlot)
      .forEach((item) => {
        if (!item?.id) return;
        const normalizedName = String(localizeEquipmentItemName(item, 'en') || item?.name || '').toLowerCase();
        const isLegacyCardboard =
          !item?.setId &&
          item?.slot !== 'pet' &&
          (
            String(item.id || '').toLowerCase().includes('card') ||
            normalizedName.includes('card')
          );
        const key = item?.setId
          ? `${item.setId}:${item.slot}`
          : isLegacyCardboard
            ? `cardboard_survivor:${item.slot}`
            : item.id;
        if (!dedup.has(key)) {
          dedup.set(key, item);
          return;
        }
        const existing = dedup.get(key);
        const existingOwned = !existing?.locked;
        const nextOwned = !item?.locked;
        if (nextOwned && !existingOwned) {
          dedup.set(key, item);
          return;
        }
        const existingBonusCount = Array.isArray(existing?.bonuses) ? existing.bonuses.length : 0;
        const nextBonusCount = Array.isArray(item?.bonuses) ? item.bonuses.length : 0;
        if (nextBonusCount > existingBonusCount) dedup.set(key, item);
      });
    return Array.from(dedup.values());
  }, [equipmentInventory, selectedSlot]);
  const itemMap = useMemo(() => new Map(equipmentInventory.map((item) => [item.id, item])), [equipmentInventory]);
  const equippedPet = findEquipmentItem(equippedItems.pet, equipmentInventory);
  const selectedItem = findEquipmentItem(selectedItemId || equippedItems[selectedSlot] || itemsForSlot[0]?.id || null, equipmentInventory);
  const selectedItemName = localizeEquipmentItemName(selectedItem, lang);
  const selectedBonusLines = describeEquipmentBonuses(selectedItem, lang);

  const equippedLayerMap = useMemo(() => {
    const map = {};
    map.equippedWeaponId = equippedItems.weapon || null;
    map.equippedHandsId = equippedItems.hands || null;
    map.equippedWeaponId = equippedItems.weapon || null;
    ['weapon', 'head', 'hands', 'armor', 'legs', 'boots', 'accessory', 'animation'].forEach((slot) => {
      const item = itemMap.get(equippedItems[slot]);
      if (item?.layerSrc) map[slot] = item.layerSrc;
    });
    map.nightDisinfector = {
      weapon: itemMap.get(equippedItems.weapon)?.setId === NIGHT_DISINFECTOR_SET_ID,
      hands: itemMap.get(equippedItems.hands)?.setId === NIGHT_DISINFECTOR_SET_ID,
      armor: itemMap.get(equippedItems.armor)?.setId === NIGHT_DISINFECTOR_SET_ID,
      legs: itemMap.get(equippedItems.legs)?.setId === NIGHT_DISINFECTOR_SET_ID,
      boots: itemMap.get(equippedItems.boots)?.setId === NIGHT_DISINFECTOR_SET_ID,
      head: itemMap.get(equippedItems.head)?.setId === NIGHT_DISINFECTOR_SET_ID,
    };
    map.nuvelor = {
      weapon: itemMap.get(equippedItems.weapon)?.setId === NUVELOR_SET_ID,
      hands: itemMap.get(equippedItems.hands)?.setId === NUVELOR_SET_ID,
      armor: itemMap.get(equippedItems.armor)?.setId === NUVELOR_SET_ID,
      legs: itemMap.get(equippedItems.legs)?.setId === NUVELOR_SET_ID,
      boots: itemMap.get(equippedItems.boots)?.setId === NUVELOR_SET_ID,
      head: itemMap.get(equippedItems.head)?.setId === NUVELOR_SET_ID,
    };
    map.set5 = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, itemMap.get(equippedItems[slot])?.setId === SET5_SET_ID]));
    map.set4 = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, itemMap.get(equippedItems[slot])?.setId === SET4_SET_ID]));
    map.bpEpicPet = equippedItems.pet === 'bp_epic_pet';
    map.bpEpicAura = equippedItems.animation === 'bp_epic_animation';
    map.bpLegendaryAura = equippedItems.animation === 'bp_legendary_animation';
    map.bpEpic = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, itemMap.get(equippedItems[slot])?.setId === 'bp_epic']));
    map.newbiePackII = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, itemMap.get(equippedItems[slot])?.setId === NEWBIE_PACK_II_SET_ID]));
    return map;
  }, [itemMap, equippedItems]);

  const activeSetId = selectedItem?.setId || null;
  const setPieces = Number(equipmentEffects.setCounts[activeSetId] || 0);
  const setBonuses = equipmentEffects.setBonusesBySet?.[activeSetId] || [];
  const setNameI18n = activeSetId === CARDBOARD_SURVIVOR_SET_ID ? CARDBOARD_SET_NAME_I18N : activeSetId === NIGHT_DISINFECTOR_SET_ID ? NIGHT_DISINFECTOR_SET_NAME_I18N : activeSetId === NUVELOR_SET_ID ? NUVELOR_SET_NAME_I18N : activeSetId === SET5_SET_ID ? SET5_SET_NAME_I18N : activeSetId === SET4_SET_ID ? SET4_SET_NAME_I18N : selectedItem?.setNameI18n || null;
  const setBonusNameI18n = activeSetId === CARDBOARD_SURVIVOR_SET_ID ? CARDBOARD_SET_BONUS_NAME_I18N : activeSetId === NIGHT_DISINFECTOR_SET_ID ? NIGHT_DISINFECTOR_SET_BONUS_NAME_I18N : activeSetId === NUVELOR_SET_ID ? NUVELOR_SET_BONUS_NAME_I18N : activeSetId === SET5_SET_ID ? SET5_SET_BONUS_NAME_I18N : activeSetId === SET4_SET_ID ? SET4_SET_BONUS_NAME_I18N : null;

  const handleEquip = async (item) => {
    setSelectedItemId(item.id);
    if (item.locked) {
      if (['boss', 'battle_pass'].includes(item?.sourceType)) return;
      const price = Number(item?.price?.amount || item?.buyPrice || 0);
      if (price <= 0 || (profile?.tentacles || 0) < price) return;
      const inventory = Array.isArray(profile?.inventory_items) ? [...profile.inventory_items] : [];
      const alreadyOwned = inventory.some((entry) => entry?.id === item.id && entry?.type === 'equipment');
      if (alreadyOwned) return;
      const payload = {
        id: item.id,
        type: 'equipment',
        slot: item.slot,
        name: localizeEquipmentItemName(item, 'ua'),
        names: item.names,
        icon: item.icon,
        layerSrc: item.layerSrc || null,
        attack: item.attack || 0,
        hp: item.hp || 0,
        rarity: item.rarity || 'common',
        price: item.price || { currency: 'tentacles', amount: price },
        sourceType: item.sourceType || 'shop',
        dropSource: item.dropSource || null,
        dropBossId: item.dropBossId || null,
        purchasable: Boolean(item.purchasable),
        bossDrop: Boolean(item.bossDrop),
        setId: item.setId || null,
        setNameI18n: item.setNameI18n || null,
        setBonusNameI18n: item.setBonusNameI18n || null,
        bonuses: Array.isArray(item.bonuses) ? item.bonuses : [],
      };
      await onUpdateProfile?.({
        tentacles: Math.max(0, (profile?.tentacles || 0) - price),
        inventory_items: [...inventory, payload],
      });
      return;
    }

    const nextEquipped = {
      ...(profile?.equipped_items || {}),
      [selectedSlot]: equippedItems[selectedSlot] === item.id ? null : item.id,
    };
    await onUpdateProfile?.({ equipped_items: nextEquipped });
  };

  const handleSlotToggle = async (slotId) => {
    const isActive = selectedSlot === slotId;
    setSelectedSlot(slotId);
    const slotItems = equipmentInventory.filter((item) => item.slot === slotId);
    setSelectedItemId(equippedItems[slotId] || slotItems[0]?.id || null);

    if (!isActive || !equippedItems[slotId]) return;

    const nextEquipped = {
      ...(profile?.equipped_items || {}),
      [slotId]: null,
    };
    await onUpdateProfile?.({ equipped_items: nextEquipped });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-3 pb-3 pt-1">
      <div className="relative flex items-start justify-center pb-2">
        <div className="flex h-10 w-[52%] items-center justify-center border border-[#28ee90] bg-[#0b160b] font-mono text-[12px] font-black uppercase tracking-[0.16em] text-[#d8ffe2]">
          Equipment
        </div>

        <button type="button" onClick={onClose} className="absolute right-1 top-0 w-[46px] transition hover:scale-[1.03] active:scale-[0.98]">
          <X aria-label="Close equipment" className="h-8 w-8 text-[#c6ff61]" />
        </button>
      </div>

      <MarkerFrame className="px-2 py-4" innerClassName="grid grid-cols-[76px_1fr_76px] items-center gap-1.5" variant="transparent">
        <div className="flex flex-col gap-3">
          {EQUIPMENT_SLOTS.filter((slot) => ['accessory', 'weapon', 'hands', 'pet'].includes(slot.id)).map((slot) => {
            const equippedItem = itemMap.get(equippedItems[slot.id]) || null;
            return (
              <SlotButton
                key={slot.id}
                slot={slot}
                item={equippedItem}
                itemName={localizeEquipmentItemName(equippedItem, lang)}
                language={lang}
                active={selectedSlot === slot.id}
                onClick={() => handleSlotToggle(slot.id)}
              />
            );
          })}
        </div>

        <div className="flex flex-col items-center">
          <div className="relative flex h-[clamp(320px,58dvh,462px)] w-full items-end justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_8%,rgba(183,255,92,0.14)_0%,rgba(0,0,0,0)_44%),linear-gradient(180deg,rgba(24,33,17,0.9)_0%,rgba(11,14,9,0.96)_100%)]">
            <div className="absolute bottom-3 h-[62px] w-[78%] rounded-full bg-[radial-gradient(circle,rgba(186,244,111,0.24)_0%,rgba(108,167,43,0.12)_42%,transparent_74%)] blur-[6px]" />
            {equippedPet?.id === 'hereearlypet' ? <HereEarlyPet className="absolute bottom-0 left-1/2 z-[4] h-[158%] w-auto max-w-none -translate-x-1/2 origin-bottom scale-[1.08] translate-y-[8%] aspect-[500/896]" /> : equippedPet?.id === 'raidboss2_pet' ? <RaidScarecrowPet className="absolute bottom-0 left-1/2 z-[4] h-[158%] w-auto max-w-none -translate-x-1/2 origin-bottom scale-[1.08] translate-y-[8%] aspect-[500/896]" /> : equippedPet?.id === 'pet-cthulhu' ? <NewbieSoulPet fullCanvas className="absolute bottom-0 left-1/2 z-[1] h-[158%] w-auto max-w-none -translate-x-1/2 origin-bottom scale-[1.08] translate-y-[8%]" label={equippedPet.name} /> : equippedPet?.renderArt ? (
              <img src={equippedPet.renderArt} alt={equippedPet.name} className="absolute bottom-[5%] left-[7%] z-[2] h-[44%] w-auto object-contain drop-shadow-[0_18px_26px_rgba(0,0,0,0.34)]" />
            ) : null}
            <div className="relative flex h-full w-full items-end justify-center">
              <LayeredHero className="relative z-[2] h-[158%] w-auto max-w-none origin-bottom scale-[1.08] translate-y-[8%]" visibleSlots={visibleHeroSlots} layerOverrides={equippedLayerMap} />
            </div>
          </div>

          <div className="mt-3 h-[12px] w-full bg-[#0c100a]" />
        </div>

        <div className="flex flex-col gap-3">
          {EQUIPMENT_SLOTS.filter((slot) => ['animation', 'head', 'armor', 'legs', 'boots'].includes(slot.id)).map((slot) => {
            const equippedItem = itemMap.get(equippedItems[slot.id]) || null;
            return (
              <SlotButton
                key={slot.id}
                slot={slot}
                item={equippedItem}
                itemName={localizeEquipmentItemName(equippedItem, lang)}
                language={lang}
                active={selectedSlot === slot.id}
                onClick={() => handleSlotToggle(slot.id)}
              />
            );
          })}
        </div>
      </MarkerFrame>

      <MarkerFrame className="mt-3 min-h-0 flex-1" innerClassName="flex h-full min-h-0 flex-col px-4 py-4" variant="transparent">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[12px] font-black uppercase tracking-[0.14em] text-[#d8ffe2]">
            {translateUiText(EQUIPMENT_SLOTS.find((slot) => slot.id === selectedSlot)?.label || 'Equipment', lang)}
          </p>
          <p className="font-mono text-[10px] text-[#91aa76]">Owned: {itemsForSlot.filter((item) => !item.locked).length}</p>
        </div>

        <div className="mb-3 rounded-[12px] border border-[#28ee90] bg-[#0f150d] px-3 py-2">
          <div className="flex items-center gap-2">
            {selectedItem ? <img src={selectedItem.icon} alt="" className="h-12 w-12 shrink-0 object-contain" /> : null}
            <div className="min-w-0">
              <p className="truncate font-mono text-[12px] font-black uppercase text-[#f0ffe2]">{selectedItemName || 'Select item'}</p>
              {selectedItem ? <p className="mt-0.5 font-mono text-[9px] font-black uppercase text-[#8bff58]">{equippedItems[selectedSlot] === selectedItem.id ? (lang === 'ru' ? 'Надето' : lang === 'en' ? 'Equipped' : 'Надіто') : getEquipmentSourceLabel(selectedItem, lang)}</p> : null}
            </div>
          </div>
          <p className="mt-1 font-mono text-[9px] text-[#9dff43]">{selectedItem ? getEquipmentSourceLabel(selectedItem, lang) : ''}</p>
          <div className="mt-1 space-y-0.5">
            {(selectedBonusLines.length ? selectedBonusLines : [getNoBonusLabel(lang)]).map((bonus) => <p key={bonus} className="font-mono text-[9px] font-bold text-[#d8f67a]">✦ {bonus}</p>)}
          </div>
          {setNameI18n && setBonusNameI18n ? (
            <>
              <p className="mt-1 font-mono text-[9px] text-[#d8f67a]">
                {(setNameI18n[lang] || setNameI18n.ua)} • {(setBonusNameI18n[lang] || setBonusNameI18n.ua)}
              </p>
              <p className="mt-1 font-mono text-[8px] text-[#8ca273]">{setPieces}/6</p>
              {setBonuses.map((bonus) => (
                <p key={bonus.pieces} className="font-mono text-[8px] text-[#8ca273]">{bonus.active ? '✅' : '◻'} {bonus.pieces}/6 {lang === 'en' ? bonus.text : lang === 'ru' ? bonus.text.replace('Finger damage', 'Урон пальца').replace('Pencil damage', 'Урон карандаша').replace('Boss damage', 'Урон по боссам') : bonus.text.replace('Finger damage', 'Шкода пальця').replace('Pencil damage', 'Шкода олівця').replace('Boss damage', 'Шкода босам')}</p>
              ))}
            </>
          ) : null}
          <p className="mt-1 font-mono text-[8px] text-[#8ca273]">
            {selectedItem ? getEquipmentSourceLabel(selectedItem, lang) : ''}
          </p>
          {selectedItem ? <EquipmentSourceInfo item={selectedItem} language={lang} /> : null}
          {selectedItem?.locked && selectedItem.sourceType === 'holder' ? <NftPetClaimButton key={selectedItem.id} item={selectedItem} language={lang} onClaimed={onRefreshProfile} /> : null}
          {selectedItem ? <GameTextureButton type="button" tone="green" disabled={selectedItem.locked} onClick={() => handleEquip(selectedItem)} className="mt-2 h-10 w-full"><span className="relative z-10 font-mono text-[11px] font-black uppercase text-[#15220b]">{equippedItems[selectedSlot] === selectedItem.id ? (lang === 'ru' ? 'СНЯТЬ' : lang === 'en' ? 'REMOVE' : 'ЗНЯТИ') : (lang === 'ru' ? 'НАДЕТЬ' : lang === 'en' ? 'EQUIP' : 'НАДІТИ')}</span></GameTextureButton> : null}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto pb-1">
          {itemsForSlot.length > 0 ? (
            itemsForSlot.map((item) => (
              <EquipmentCatalogCard
                key={item.id}
                item={item}
                itemName={localizeEquipmentItemName(item, lang)}
                selected={(selectedItem?.id || null) === item.id}
                equipped={equippedItems[selectedSlot] === item.id}
                locked={Boolean(item.locked)}
                language={lang}
                onClick={() => setSelectedItemId(item.id)}
              />
            ))
          ) : (
            <div className="flex h-full min-w-full items-center justify-center border border-dashed border-[#28ee90] text-center">
              <p className="px-4 font-mono text-[11px] text-[#91aa76]">No items for this slot.</p>
            </div>
          )}
        </div>
      </MarkerFrame>
      {detailsOpen && selectedItem ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 backdrop-blur-[2px]">
          <div className="w-full max-w-[520px] rounded-t-[24px] border-t-2 border-[#28ee90] bg-[#0b1210] p-4 shadow-[0_-8px_24px_rgba(0,0,0,.55)]">
          <div className="mx-auto mb-3 h-1 w-14 rounded-full bg-[#27342d]" />
          <div className="mb-3 flex items-start justify-between">
            <h2 className="font-sans text-[20px] font-black uppercase text-[#f0ffe2]">{translateUiText(EQUIPMENT_SLOTS.find((slot) => slot.id === selectedSlot)?.label || 'Equipment', lang)}</h2>
            <button type="button" onClick={() => setDetailsOpen(false)} className="text-3xl leading-none text-[#28ee90]">×</button>
          </div>
          <div className="flex gap-3">
            <div className="flex h-[144px] w-[136px] shrink-0 items-center justify-center rounded-[12px] border border-[#28ee90] bg-[#081108]"><img src={selectedItem.icon} alt="" className="h-full w-full object-contain p-2" /></div>
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-[19px] font-black uppercase leading-tight text-[#f0ffe2]">{selectedItemName}</h3>
              <p className="mt-1 font-mono text-[11px] font-black uppercase text-[#8bff58]">{selectedItem.rarity || 'COMMON'}</p>
              <p className="mt-2 font-mono text-[9px] font-bold text-[#8bff58]">{getEquipmentSourceLabel(selectedItem, lang)}</p>
              <div className="mt-2 space-y-1">{(selectedBonusLines.length ? selectedBonusLines : [getNoBonusLabel(lang)]).map((bonus) => <p key={bonus} className="rounded-[8px] border border-[#263731] px-2 py-2 font-mono text-[10px] text-[#d8f5e4]">✦ {bonus}</p>)}</div>
            </div>
          </div>
          <EquipmentSourceInfo item={selectedItem} language={lang} />
          <GameTextureButton type="button" tone="green" disabled={selectedItem.locked} onClick={async () => { await handleEquip(selectedItem); setDetailsOpen(false); }} className="mt-4 h-[52px] w-full"><span className="relative z-10 font-sans text-[16px] font-black uppercase text-[#102015]">{equippedItems[selectedSlot] === selectedItem.id ? (lang === 'ru' ? 'СНЯТЬ' : lang === 'en' ? 'REMOVE' : 'ЗНЯТИ') : (lang === 'ru' ? 'НАДЕТЬ' : lang === 'en' ? 'EQUIP' : 'НАДІТИ')}</span></GameTextureButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default memo(EquipmentPanel);
