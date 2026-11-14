import { warmFirstFrameImages } from '@/lib/sceneAssets';
import FirstFrameImage from './FirstFrameImage';
import tile1 from '@/assets/optimized/first-frame/T01.webp?inline';
import tile2 from '@/assets/optimized/first-frame/T02.webp?inline';
import tile3 from '@/assets/optimized/first-frame/T03.webp?inline';
import tile4 from '@/assets/optimized/first-frame/T04.webp?inline';
import tile5 from '@/assets/optimized/first-frame/T05.webp?inline';
import tile6 from '@/assets/optimized/first-frame/T06.webp?inline';
import tile7 from '@/assets/optimized/first-frame/T07.webp?inline';
import tile8 from '@/assets/optimized/first-frame/T08.webp?inline';
import tile9 from '@/assets/optimized/first-frame/T09.webp?inline';
import { ADVANCED_SECOND_SECTOR, ADVANCED_SECTOR_KEY } from '@/lib/advancedTalents';
import { ADVANCED_TALENTS, isAdvancedUnlocked, advancedEffectValue } from '@/lib/advancedTalents';
import { GAME_CONFIG } from '@/lib/gameConfig';
import { getResourceIcon } from '@/lib/resourceIcons';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Star, X } from 'lucide-react';
import GameTextureButton from './GameTextureButton';
import { TALENT_DEFS, getTalentUpgradeCost, getAvailableTalentPoints, getTalentLevel, getWeaponTalentStats, getTalentProgress, getTalentUnlockRequirements, getSpentTalentPoints, isTalentUnlocked } from '@/lib/talents';
import talentT01 from '@/assets/optimized/all/skills/talants/T01.webp';
import talentT02 from '@/assets/optimized/all/skills/talants/T02.webp';
import talentT03 from '@/assets/optimized/all/skills/talants/T03.webp';
import talentT04 from '@/assets/optimized/all/skills/talants/T04.webp';
import talentT05 from '@/assets/optimized/all/skills/talants/T05.webp';
import talentT06 from '@/assets/optimized/all/skills/talants/T06.webp';
import talentT07 from '@/assets/optimized/all/skills/talants/T07.webp';
import talentT08 from '@/assets/optimized/all/skills/talants/T08.webp';
import talentT09 from '@/assets/optimized/all/skills/talants/T09.webp';
import talentT10 from '@/assets/optimized/all/skills/talants/T10.webp';
import talentT11 from '@/assets/optimized/all/skills/talants/T11.webp';
import talentT12 from '@/assets/optimized/all/skills/talants/T12.webp';
import talentT13 from '@/assets/optimized/all/skills/talants/T13.webp';
import talentT14 from '@/assets/optimized/all/skills/talants/T14.webp';
import talentT15 from '@/assets/optimized/all/skills/talants/T15.webp';
import talentT16 from '@/assets/optimized/all/skills/talants/T16.webp';
import talentT17 from '@/assets/optimized/all/skills/talants/T17.webp';
import talentT18 from '@/assets/optimized/all/skills/talants/T18.webp';
import talentT19 from '@/assets/optimized/all/skills/talants/T19.webp';
import talentT20 from '@/assets/optimized/all/skills/talants/T20.webp';
import talentT21 from '@/assets/optimized/all/skills/talants/T21.webp';
import talentT22 from '@/assets/optimized/all/skills/talants/T22.webp';
import talentT23 from '@/assets/optimized/all/skills/talants/T23.webp';
import talentT24 from '@/assets/optimized/all/skills/talants/T24.webp';
import talentT25 from '@/assets/optimized/all/skills/talants/T25.webp';
import talentT26 from '@/assets/optimized/all/skills/talants/T26.webp';
import talentT27 from '@/assets/optimized/all/skills/talants/T27.webp';
import talentT28 from '@/assets/optimized/all/skills/talants/T28.webp';
import talentT29 from '@/assets/optimized/all/skills/talants/T29.webp';
import talentT30 from '@/assets/optimized/all/skills/talants/T30.webp';

import talentT31 from '@/assets/skills/talants/generated/T31.webp';
import talentT32 from '@/assets/skills/talants/generated/T32.webp';
import talentT33 from '@/assets/skills/talants/generated/T33.webp';
import talentT34 from '@/assets/skills/talants/generated/T34.webp';
import talentT35 from '@/assets/skills/talants/generated/T35.webp';
import talentT36 from '@/assets/skills/talants/generated/T36.webp';
import talentT37 from '@/assets/skills/talants/generated/T37.webp';
import talentT38 from '@/assets/skills/talants/generated/T38.webp';
import talentT39 from '@/assets/skills/talants/generated/T39.webp';
import talentT40 from '@/assets/skills/talants/generated/T40.webp';
import talentT41 from '@/assets/skills/talants/generated/T41.webp';
import talentT42 from '@/assets/skills/talants/generated/T42.webp';
import talentT43 from '@/assets/skills/talants/generated/T43.webp';
import talentT44 from '@/assets/skills/talants/generated/T44.webp';
import talentT45 from '@/assets/skills/talants/generated/T45.webp';
import talentT46 from '@/assets/skills/talants/generated/T46.webp';
import talentT47 from '@/assets/skills/talants/generated/T47.webp';
import talentT48 from '@/assets/skills/talants/generated/T48.webp';
import talentT49 from '@/assets/skills/talants/generated/T49.webp';
import talentT50 from '@/assets/skills/talants/generated/T50.webp';
import talentT51 from '@/assets/skills/talants/generated/T51.webp';
import talentT52 from '@/assets/skills/talants/generated/T52.webp';
import talentT53 from '@/assets/skills/talants/generated/T53.webp';
import talentT54 from '@/assets/skills/talants/generated/T54.webp';
import talentT55 from '@/assets/skills/talants/generated/T55.webp';
import talentT56 from '@/assets/skills/talants/generated/T56.webp';
import talentT57 from '@/assets/skills/talants/generated/T57.webp';
import talentT58 from '@/assets/skills/talants/generated/T58.webp';
import talentT59 from '@/assets/skills/talants/generated/T59.webp';
import talentT60 from '@/assets/skills/talants/generated/T60.webp';

const SECTOR_REQUIREMENTS = [0, 15, 50, 100, 160, 240];
const FIRST_SECTOR_TILES = { t01: tile1, t02: tile2, t03: tile3, t04: tile4, t05: tile5, t06: tile6, t07: tile7, t08: tile8, t09: tile9 };

const TALENT_ICONS = { t01: talentT01, t02: talentT02, t03: talentT03, t04: talentT04, t05: talentT05, t06: talentT06, t07: talentT07, t08: talentT08, t09: talentT09, t10: talentT10, t11: talentT11, t12: talentT12, t13: talentT13, t14: talentT14, t15: talentT15, t16: talentT16, t17: talentT17, t18: talentT18, t19: talentT19, t20: talentT20, t21: talentT21, t22: talentT22, t23: talentT23, t24: talentT24, t25: talentT25, t26: talentT26, t27: talentT27, t28: talentT28, t29: talentT29, t30: talentT30, t31: talentT31, t32: talentT32, t33: talentT33, t34: talentT34, t35: talentT35, t36: talentT36, t37: talentT37, t38: talentT38, t39: talentT39, t40: talentT40, t41: talentT41, t42: talentT42, t43: talentT43, t44: talentT44, t45: talentT45, t46: talentT46, t47: talentT47, t48: talentT48, t49: talentT49, t50: talentT50, t51: talentT51, t52: talentT52, t53: talentT53, t54: talentT54, t55: talentT55, t56: talentT56, t57: talentT57, t58: talentT58, t59: talentT59, t60: talentT60 };

function TalentNode({ talent, profile, onUpgrade, onShow, onHide, t, tutorialTarget = undefined }) {
  const level = getTalentLevel(profile, talent.id);
  const unlocked = isTalentUnlocked(profile, talent.id);
  const canBuy = unlocked && level < talent.maxLevel && getAvailableTalentPoints(profile) > 0;
  const icon = talent.icon || TALENT_ICONS[talent.id];
  return <div className={`relative aspect-[5/3] w-full overflow-hidden border p-1 shadow-[inset_0_0_0_1px_rgba(193,232,93,.12)] ${level >= talent.maxLevel ? 'talent-maxed' : ''} ${unlocked ? 'border-[#527b33] bg-[#122113]' : 'border-[#313a30] bg-[#101310] opacity-65 grayscale'}`}>
    {icon ? <FirstFrameImage preview={FIRST_SECTOR_TILES[talent.id]} src={icon} alt="" aria-hidden="true" loading={talent.sectorId === 1 ? 'eager' : 'lazy'} fetchPriority={talent.sectorId === 1 ? 'auto' : 'low'} decoding="async" className="pointer-events-none absolute inset-0 h-full w-full object-cover" /> : null}
    {icon ? <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#071006]/15 via-[#071006]/10 to-[#071006]/95" /> : null}
    <button type="button" data-tutorial-target={tutorialTarget} onClick={() => onShow(talent)} className="relative z-10 flex h-full w-full flex-col items-center justify-end px-1 pb-1 text-center">
      {talent.isKeyTalent ? <Star className="mb-1 h-4 w-4 text-[#d8f875] drop-shadow-[0_1px_2px_#000]" /> : null}
      {!unlocked ? <Lock className="mb-1 h-3.5 w-3.5 text-[#76816e]" /> : null}
      <span className="font-mono text-[10px] font-black uppercase leading-tight text-[#f4ffe8] drop-shadow-[0_1px_2px_#000]">{talent.advanced ? talent.nameI18n[profile?.language] || talent.name : t(`talentTree.talents.${talent.id}.name`)}</span>
      <span className="absolute right-1 top-1 rounded-sm bg-[#071006]/80 px-1 font-mono text-[10px] font-black text-[#b7ef62] drop-shadow-[0_1px_2px_#000]">{level}/{talent.maxLevel}</span>
    </button>
  </div>;
}

export default function SkillsPanel({ profile, onUpdateProfile, onGoQuests, onOpenShop }) {
  const { i18n } = useTranslation();
  const t = i18n.getFixedT(profile?.language || i18n.resolvedLanguage || i18n.language || 'en');
  const [tooltip, setTooltip] = useState(null);
  const [treeTab,setTreeTab]=useState('base');
  const advancedUnlocked=isAdvancedUnlocked(profile);
  const label=(node)=>node?.advanced ? node.nameI18n[profile?.language]||node.name : t(`talentTree.talents.${node?.id}.name`);
  const upgradeBusy = useRef(false);
  const [upgrading, setUpgrading] = useState(false);
  const lang = profile?.language === 'ru' ? 'ru' : profile?.language === 'en' ? 'en' : 'ua';
  const copy = lang === 'ru' ? { upgrade: 'Прокачать · 1 ★', quests: 'Квесты', shop: 'Донат', close: 'Назад', noPoints: 'Нет очков таланта' } : lang === 'en' ? { upgrade: 'Upgrade · 1 ★', quests: 'Quests', shop: 'Shop', close: 'Back', noPoints: 'No talent points' } : { upgrade: 'Прокачати · 1 ★', quests: 'Квести', shop: 'Донат', close: 'Назад', noPoints: 'Немає очок таланту' };
  const [upgradeError, setUpgradeError] = useState('');
  const points = getAvailableTalentPoints(profile);
  const progress = getTalentProgress(profile);
  const spent = getSpentTalentPoints(profile);
  const sectors = Array.from({ length: 6 }, (_, index) => ({ id: index + 1, name: t(`talentTree.sectors.${index}`), nodes: TALENT_DEFS.filter((talent) => talent.sectorId === index + 1) }));
  const attackNames = lang === 'ru' ? ['Палец', 'Карандаш', 'Малый яд', 'Средний яд', 'Фляга'] : lang === 'en' ? ['Finger', 'Pencil', 'Small poison', 'Medium poison', 'Flask'] : ['Палець', 'Олівець', 'Мала отрута', 'Середня отрута', 'Фляга'];
  const talentNumber = Number(tooltip?.talent.id.slice(1) || 0);
  const attackIndex = talentNumber === 1 || talentNumber === 6 || (talentNumber >= 11 && talentNumber <= 20) ? 0 : talentNumber === 2 || talentNumber === 7 || (talentNumber >= 21 && talentNumber <= 30) ? 1 : talentNumber === 3 || talentNumber === 31 || talentNumber === 35 ? 2 : talentNumber === 8 || talentNumber === 32 || talentNumber === 37 ? 3 : [33, 38, 39, 40, 53].includes(talentNumber) ? 4 : null;
  const attackPreview = GAME_CONFIG.WEAPONS.map((weapon, index) => ({ weapon, index })).filter(({ index }) => attackIndex === null || index === attackIndex);
  const upgrade = async (id) => {
    if (upgradeBusy.current) return;
    upgradeBusy.current = true;
    setUpgrading(true);
    setUpgradeError('');
    try { await onUpdateProfile({ talentUpgrade: { id } }); }
    catch (error) { setUpgradeError(error?.message || 'Talent upgrade failed'); }
    finally { upgradeBusy.current = false; setUpgrading(false); }
  };
  const resetCost = Number(profile?.talent_reset_count || 0) > 0 ? 50 : 0;
  const resetLabel = lang === 'ru' ? 'Сбросить' : lang === 'en' ? 'Reset' : 'Скинути';
  const resetPrice = resetCost ? `${resetCost} T-Pape` : lang === 'ru' ? 'Бесплатно' : lang === 'en' ? 'Free' : 'Безкоштовно';
  const resetTalents = async () => {
    if (upgradeBusy.current || !spent) return;
    const message = lang === 'ru' ? 'Сбросить таланты и вернуть очки?' : lang === 'en' ? 'Reset talents and refund points?' : 'Скинути таланти й повернути очки?';
    const priceMessage = resetCost
      ? lang === 'ru' ? `Будет списано ${resetPrice}.` : lang === 'en' ? `${resetPrice} will be deducted.` : `Буде списано ${resetPrice}.`
      : lang === 'ru' ? 'Первый сброс бесплатный.' : lang === 'en' ? 'Your first reset is free.' : 'Перше скидання безкоштовне.';
    if (!window.confirm(`${message}\n\n${priceMessage}`)) return;
    upgradeBusy.current=true; setUpgrading(true); setUpgradeError('');
    try { await onUpdateProfile({playerAction:{type:'reset-talents'}}); setTooltip(null); }
    catch(error) { setUpgradeError(error?.message || 'Talent reset failed'); }
    finally { upgradeBusy.current=false; setUpgrading(false); }
  };
  const showTooltip = (talent) => { setUpgradeError(''); setTooltip({ talent }); };
  return <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#070c08] text-[#efffe3]">
    <header className="shrink-0 border-b border-[#28ee90] bg-[#0d1710] px-3 py-2.5">
      <div className="flex items-end justify-between gap-2"><div><p className="font-mono text-[10px] font-black tracking-[.18em] text-[#92d84f]">{t('talentTree.title')}</p><h1 className="font-sans text-[21px] font-black">{t('talentTree.tree')}</h1></div><strong className="font-mono text-[14px] text-[#d8ff86]">{points} ★</strong></div>
      <div className="mt-2 h-2 overflow-hidden border border-[#52654b] bg-[#050805]"><div className="h-full bg-[#8fcb3d]" style={{ width: `${Math.min(100, progress.current / Math.max(1, progress.goal) * 100)}%` }} /></div><p className="mt-1 font-mono text-[12px] text-[#b4c5aa]">{t('talentTree.progress', { current: progress.current, goal: progress.goal, spent })}</p><button type="button" onClick={resetTalents} disabled={upgrading || !spent || Number(profile?.premium || 0) < resetCost} className="mt-1 float-right border border-[#8fcb3d] px-2 py-1 font-mono text-[10px] text-[#d8ff86] disabled:opacity-40">{resetLabel} · {resetCost > 0 && <img src={getResourceIcon('premium')} alt="" aria-hidden="true" className="mx-1 inline-block h-4 w-4 object-contain" />}{resetPrice}</button>
      <nav className="mt-3 flex clear-both gap-2" aria-label="Talent trees">
        <button type="button" onClick={()=>{setTreeTab('base');setTooltip(null);}} aria-pressed={treeTab==='base'} className={`flex-1 border p-2 text-xs font-bold ${treeTab==='base'?'border-lime-400 bg-lime-900/50':'border-[#31542d]'}`}>{lang==='en'?'Talents':lang==='ru'?'Таланты':'Таланти'} · 600 ★</button>
        <button type="button" disabled={!advancedUnlocked} onClick={()=>{setTreeTab('advanced');setTooltip(null);}} aria-pressed={treeTab==='advanced'} className={`flex-1 border p-2 text-xs font-bold disabled:opacity-50 ${treeTab==='advanced'?'border-lime-400 bg-lime-900/50':'border-[#31542d]'}`}>{!advancedUnlocked?'🔒 ':''}{lang==='en'?'Mayhem':lang==='ru'?'Беспредел':'Беззаконня'} · 2235 ★</button>
      </nav>
      {!advancedUnlocked&&<p className="mt-1 text-[11px] text-[#b4c5aa]">{lang==='en'?'Unlock: all 60 talents at level 10.':lang==='ru'?'Открытие: все 60 талантов на 10 уровне.':'Відкриття: усі 60 талантів на 10 рівні.'}</p>}
    </header>
    {upgradeError && <p role="alert" className="px-3 py-2 text-xs text-[#ffaaa0]">{upgradeError}</p>}
    <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">
      {treeTab==='advanced'&&advancedUnlocked ? <>
        <p className="mb-3 text-xs text-[#b4c5aa]">{lang==='en'?'20 talents · 10 levels · levels cost 2, 4…20 ★ · Open Wound: 10…19 ★':lang==='ru'?'20 талантов · 10 уровней · цена уровней 2, 4…20 ★ · «В открытую рану»: 10…19 ★':'20 талантів · 10 рівнів · ціна рівнів 2, 4…20 ★ · «У відкриту рану»: 10…19 ★'}</p>
        {[
          { title: lang==='en'?'Attacks and armor breach':lang==='ru'?'Удары и пробой брони':'Удари й пробій броні', ids: ['a01','a02','a03','a04','a05','a06','a07','a09','a10','a18'] },
          { title: lang==='en'?'Poison, marks and bleeding':lang==='ru'?'Яды, метки и кровотечение':'Отрути, мітки й кровотеча', ids: ADVANCED_SECOND_SECTOR },
        ].map(({title,ids}) => {
          const nodes = ADVANCED_TALENTS.filter(node => ids.includes(node.id));
          const locked = ids === ADVANCED_SECOND_SECTOR && !isTalentUnlocked(profile, nodes[0].id);
          return <div key={ids[0]} className="relative mb-5">
          <section className="relative border border-[#31542d] bg-[#0b120c] p-2">
          <h2 className="mb-2 border-b border-[#2b492b] pb-1 font-mono text-[13px] font-black text-[#d8ff86]">{title}</h2>
          {locked && <p className="mb-2 text-xs text-[#b4c5aa]">{label(ADVANCED_TALENTS.find(node => node.id === ADVANCED_SECTOR_KEY))} · {getTalentLevel(profile, ADVANCED_SECTOR_KEY)}/10</p>}
          <div className="grid grid-cols-3 gap-1.5">
            {nodes.slice(0, -1).map(node => <TalentNode key={node.id} t={t} talent={node} profile={profile} onShow={showTooltip}/>)}
          </div>
          </section>
          <div className="relative z-20 flex flex-col items-center">
            <div className="h-4 border-l border-dashed border-[#78a44c]" />
            <div style={{ width: 'calc((100% - 12px) / 3)' }}>
              <TalentNode t={t} talent={nodes.at(-1)} profile={profile} onShow={showTooltip}/>
            </div>
          </div>
          </div>;
        })}
      </> : sectors.map((sector, index) => {
        const key = sector.nodes.find((node) => node.isKeyTalent);
        const previousKeyLevel = index === 0 ? 10 : getTalentLevel(profile, `t${String(index * 10).padStart(2, '0')}`);
        const requiredPoints = SECTOR_REQUIREMENTS[index];
        const keyRequirementMet = previousKeyLevel >= 10;
        const pointsRequirementMet = spent >= requiredPoints;
        const unlocked = index === 0 || (keyRequirementMet && pointsRequirementMet);
        return <div key={sector.id} className="relative mb-5">
          <section className={`relative border border-[#31542d] bg-[#0b120c] p-2 ${unlocked ? '' : 'opacity-60 grayscale'}`}>
          <div className="mb-2 flex items-center justify-between border-b border-[#2b492b] pb-1"><h2 className="font-mono text-[13px] font-black text-[#d8ff86]">{t('talentTree.sector', { id: sector.id, name: sector.name })}</h2>{!unlocked ? <span className="flex items-center gap-1 font-mono text-[8px] text-[#adb5a5]"><Lock className="h-3 w-3" /> {t('talentTree.locked')}</span> : null}</div>
          <div className="relative grid grid-cols-3 gap-1.5 before:pointer-events-none before:absolute before:left-[16%] before:right-[16%] before:top-[38px] before:border-t before:border-dashed before:border-[#45633d]">{sector.nodes.filter((node) => !node.isKeyTalent).map((node) => <TalentNode t={t} key={node.id} talent={node} profile={profile} onUpgrade={upgrade} onShow={showTooltip} onHide={() => setTooltip(null)} tutorialTarget={node.id === TALENT_DEFS[0]?.id ? 'tutorial-first-talent' : undefined} />)}</div>
          {index > 0 ? <div className={`mt-2 flex flex-col items-center font-mono text-[8px] ${unlocked ? 'text-[#9ce86a]' : 'text-[#c4cbbd]'}`}>
            <span>{keyRequirementMet ? '✓' : '○'} {t('talentTree.unlockKeyProgress', { level: previousKeyLevel })}</span>
            <span>{pointsRequirementMet ? '✓' : '○'} {t('talentTree.unlockPointsProgress', { spent, points: requiredPoints })}</span>
          </div> : null}
          </section>
          {key ? <div className={`relative z-20 flex flex-col items-center ${index < sectors.length - 1 ? 'pb-1' : 'pt-3'}`}>
            <div className="h-4 border-l border-dashed border-[#78a44c]" />
            <div style={{ width: 'calc((100% - 12px) / 3)' }}><TalentNode t={t} talent={key} profile={profile} onUpgrade={upgrade} onShow={showTooltip} onHide={() => setTooltip(null)} /></div>
            {index < sectors.length - 1 ? <div className="h-4 border-l border-dashed border-[#78a44c]" /> : null}
          </div> : null}
        </div>;
      })}
    </main>
    {tooltip ? <div className="absolute inset-0 z-30 flex items-end bg-black/45" onClick={() => setTooltip(null)}>
      <section role="dialog" aria-modal="true" aria-label={label(tooltip.talent)} onClick={event => event.stopPropagation()} className="relative max-h-[80%] w-full overflow-y-auto overscroll-contain border border-[#b4e65e] bg-[#101a0e] p-3 shadow-xl">
        <button type="button" aria-label={copy.close} onClick={() => setTooltip(null)} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center text-[#d8ff86]"><X className="h-5 w-5" /></button>
        <h2 className="pr-10 font-sans text-[16px] font-black text-[#ecffd4]">{label(tooltip.talent)}</h2>
        <div className="mt-3 flex items-start gap-3">
          <div className="w-[32%] shrink-0">
            {(tooltip.talent.icon || TALENT_ICONS[tooltip.talent.id]) ? <img src={(tooltip.talent.icon || TALENT_ICONS[tooltip.talent.id])} alt="" className="w-full border border-[#b4e65e] object-contain" /> : null}
            <p className="mt-2 text-[12px] font-black text-[#d8ff86]">{lang === 'ru' ? 'Базовый урон' : lang === 'en' ? 'Base damage' : 'Базова шкода'}</p>
            {attackPreview.map(({ weapon, index }) => <p key={weapon.id} className="mt-1 text-[12px] leading-snug text-[#efffe3]">{attackNames[index]}: <strong>{Math.round(getWeaponTalentStats(weapon, profile).damage)}</strong></p>)}
          </div>
          <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-[#c3d8b0]">
            <p>{tooltip.talent.advanced ? tooltip.talent.descriptionI18n?.[profile?.language] || tooltip.talent.description : t(`talentTree.talents.${tooltip.talent.id}.description`)}</p>
            {tooltip.talent.advanced&&<p className="mt-2 font-bold text-[#d8ff86]">{lang==='en'?'Now':lang==='ru'?'Сейчас':'Зараз'}: {advancedEffectValue(tooltip.talent.id,getTalentLevel(profile,tooltip.talent.id))} → {lang==='en'?'Next':lang==='ru'?'Далее':'Далі'}: {advancedEffectValue(tooltip.talent.id,Math.min(10,getTalentLevel(profile,tooltip.talent.id)+1))}</p>}
            <p className="mt-2">{t('talentTree.level', { level: getTalentLevel(profile, tooltip.talent.id), max: tooltip.talent.maxLevel })}</p>
            <p className="text-[#d8ff86]">{getTalentLevel(profile, tooltip.talent.id) >= tooltip.talent.maxLevel ? t('talentTree.maxLevel') : t('talentTree.nextLevel', { level: getTalentLevel(profile, tooltip.talent.id) + 1, max: tooltip.talent.maxLevel, cost: getTalentUpgradeCost(profile, tooltip.talent.id) })}</p>
            <div className="mt-2 space-y-1 text-[12px]" aria-label={lang === 'ru' ? 'Требования' : lang === 'en' ? 'Requirements' : 'Вимоги'}>
              {getTalentUnlockRequirements(profile, tooltip.talent.id).length ? getTalentUnlockRequirements(profile, tooltip.talent.id).map((requirement, index) => (
                <p key={index} className={requirement.met ? 'text-[#9ce86a]' : 'text-[#ffd08a]'}>
                  {requirement.met ? '✓' : '○'} {requirement.type === 'talent'
                    ? label(TALENT_DEFS.find(node => node.id === requirement.id)) + ' · ' + requirement.current + '/' + requirement.required
                    : (lang === 'ru' ? 'Потрачено очков: ' : lang === 'en' ? 'Points spent: ' : 'Витрачено очок: ') + requirement.current + '/' + requirement.required}
                </p>
              )) : <p className="text-[#aebca6]">{t('talentTree.requirements', {requirements:t('talentTree.none')})}</p>}
            </div>
          </div>
        </div>
        {['a01','a02'].includes(tooltip.talent.id)&&getTalentLevel(profile,tooltip.talent.id)>0&&<div className="mt-3 border border-[#527b33] p-2 text-xs"><p>{lang==='en'?'Same cooldown and equipment bonuses. Switching does not reset recovery.':lang==='ru'?'Общее восстановление и бонусы вещей. Переключение не сбрасывает таймер.':'Спільне відновлення й бонуси речей. Перемикання не скидає таймер.'}</p><button type="button" disabled={upgrading} className="mt-2 border border-lime-400 p-2" onClick={async()=>{const id=tooltip.talent.id==='a01'?'fist':'knuckle';setUpgrading(true);try{await onUpdateProfile({advancedAttack:{id,enabled:profile?.advanced_attacks?.[id]===false}});}catch(e){setUpgradeError(e.message);}finally{setUpgrading(false);}}}>{profile?.advanced_attacks?.[tooltip.talent.id==='a01'?'fist':'knuckle']===false?(lang==='en'?'Equip new attack':lang==='ru'?'Выбрать новый удар':'Обрати новий удар'):(lang==='en'?'Use original attack':lang==='ru'?'Вернуть обычный удар':'Повернути звичайний удар')}</button></div>}
        {upgradeError ? <p role="alert" className="mt-2 text-sm text-[#ffaaa0]">{upgradeError}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
        <GameTextureButton type="button" tone="green" disabled={upgrading || !isTalentUnlocked(profile, tooltip.talent.id) || getTalentLevel(profile, tooltip.talent.id) >= tooltip.talent.maxLevel || points < getTalentUpgradeCost(profile,tooltip.talent.id)} onClick={() => upgrade(tooltip.talent.id)} className="order-2 h-11 w-full text-sm font-black">
          <span className="relative z-10 text-[#13200e]">{upgrading ? '...' : getTalentLevel(profile, tooltip.talent.id) >= tooltip.talent.maxLevel ? t('talentTree.maxLevel') : !isTalentUnlocked(profile, tooltip.talent.id) ? t('talentTree.locked') : points < getTalentUpgradeCost(profile,tooltip.talent.id) ? copy.noPoints : `${lang==='en'?'Upgrade':lang==='ru'?'Прокачать':'Прокачати'} · ${getTalentUpgradeCost(profile,tooltip.talent.id)} ★`}</span>
        </GameTextureButton>
          <GameTextureButton type="button" tone="yellow" onClick={() => setTooltip(null)} className="order-1 h-11 text-sm font-black"><span className="relative z-10 text-[#13200e]">{copy.close}</span></GameTextureButton>
        </div>
      </section>
    </div> : null}
  </div>;
}

export function warmFirstFrame() {
  return warmFirstFrameImages([talentT01, talentT02, talentT03, talentT04, talentT05, talentT06, talentT07, talentT08, talentT09]);
}
