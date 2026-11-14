import { GAME_CONFIG } from '@/lib/gameConfig';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Star, X } from 'lucide-react';
import GameTextureButton from './GameTextureButton';
import { TALENT_DEFS, getAvailableTalentPoints, getTalentLevel, getWeaponTalentStats, getTalentProgress, getTalentPrerequisite, getSpentTalentPoints, isTalentUnlocked } from '@/lib/talents';
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

const SECTOR_REQUIREMENTS = [0, 15, 50, 100, 160, 240];
const TALENT_ICONS = { t01: talentT01, t02: talentT02, t03: talentT03, t04: talentT04, t05: talentT05, t06: talentT06, t07: talentT07, t08: talentT08, t09: talentT09, t10: talentT10, t11: talentT11, t12: talentT12, t13: talentT13, t14: talentT14, t15: talentT15, t16: talentT16, t17: talentT17, t18: talentT18, t19: talentT19, t20: talentT20, t21: talentT21, t22: talentT22, t23: talentT23, t24: talentT24, t25: talentT25, t26: talentT26, t27: talentT27, t28: talentT28, t29: talentT29, t30: talentT30 };

function TalentNode({ talent, profile, onUpgrade, onShow, onHide, t, tutorialTarget = undefined }) {
  const level = getTalentLevel(profile, talent.id);
  const unlocked = isTalentUnlocked(profile, talent.id);
  const canBuy = unlocked && level < talent.maxLevel && getAvailableTalentPoints(profile) > 0;
  const icon = TALENT_ICONS[talent.id];
  return <div style={icon ? { backgroundImage: `url(${icon})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined} className={`relative aspect-[5/3] w-full overflow-hidden border p-1 shadow-[inset_0_0_0_1px_rgba(193,232,93,.12)] ${level >= talent.maxLevel ? 'talent-maxed' : ''} ${unlocked ? 'border-[#527b33] bg-[#122113]' : 'border-[#313a30] bg-[#101310] opacity-65 grayscale'}`}>
    {icon ? <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#071006]/15 via-[#071006]/10 to-[#071006]/95" /> : null}
    <button type="button" data-tutorial-target={tutorialTarget} onClick={() => onShow(talent)} className="relative z-10 flex h-full w-full flex-col items-center justify-end px-1 pb-1 text-center">
      {talent.isKeyTalent ? <Star className="mb-1 h-4 w-4 text-[#d8f875] drop-shadow-[0_1px_2px_#000]" /> : null}
      {!unlocked ? <Lock className="mb-1 h-3.5 w-3.5 text-[#76816e]" /> : null}
      <span className="font-mono text-[10px] font-black uppercase leading-tight text-[#f4ffe8] drop-shadow-[0_1px_2px_#000]">{t(`talentTree.talents.${talent.id}.name`)}</span>
      <span className="absolute right-1 top-1 rounded-sm bg-[#071006]/80 px-1 font-mono text-[10px] font-black text-[#b7ef62] drop-shadow-[0_1px_2px_#000]">{level}/{talent.maxLevel}</span>
    </button>
  </div>;
}

export default function SkillsPanel({ profile, onUpdateProfile, onGoQuests, onOpenShop }) {
  const { i18n } = useTranslation();
  const t = i18n.getFixedT(profile?.language || i18n.resolvedLanguage || i18n.language || 'en');
  const [tooltip, setTooltip] = useState(null);
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
  const resetTalents = async () => {
    if (upgradeBusy.current || !spent) return;
    const message = lang === 'ru' ? 'Сбросить таланты и вернуть очки?' : lang === 'en' ? 'Reset talents and refund points?' : 'Скинути таланти й повернути очки?';
    if (!window.confirm(message + (resetCost ? ' · 50' : ' · 0'))) return;
    upgradeBusy.current=true; setUpgrading(true); setUpgradeError('');
    try { await onUpdateProfile({playerAction:{type:'reset-talents'}}); setTooltip(null); }
    catch(error) { setUpgradeError(error?.message || 'Talent reset failed'); }
    finally { upgradeBusy.current=false; setUpgrading(false); }
  };
  const showTooltip = (talent) => { setUpgradeError(''); setTooltip({ talent }); };
  return <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#070c08] text-[#efffe3]">
    <header className="shrink-0 border-b border-[#28ee90] bg-[#0d1710] px-3 py-2.5">
      <div className="flex items-end justify-between gap-2"><div><p className="font-mono text-[10px] font-black tracking-[.18em] text-[#92d84f]">{t('talentTree.title')}</p><h1 className="font-sans text-[21px] font-black">{t('talentTree.tree')}</h1></div><strong className="font-mono text-[14px] text-[#d8ff86]">{points} ★</strong></div>
      <div className="mt-2 h-2 overflow-hidden border border-[#52654b] bg-[#050805]"><div className="h-full bg-[#8fcb3d]" style={{ width: `${Math.min(100, progress.current / Math.max(1, progress.goal) * 100)}%` }} /></div><p className="mt-1 font-mono text-[12px] text-[#b4c5aa]">{t('talentTree.progress', { current: progress.current, goal: progress.goal, spent })}</p><button type="button" onClick={resetTalents} disabled={upgrading || !spent || Number(profile?.premium || 0) < resetCost} className="mt-1 float-right border border-[#8fcb3d] px-2 py-1 font-mono text-[10px] text-[#d8ff86] disabled:opacity-40">{resetLabel} · {resetCost ? '50' : lang === 'ru' ? 'Бесплатно' : lang === 'en' ? 'Free' : 'Безкоштовно'}</button>
    </header>
    {upgradeError && <p role="alert" className="px-3 py-2 text-xs text-[#ffaaa0]">{upgradeError}</p>}
    <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">
      {sectors.map((sector, index) => {
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
      <section role="dialog" aria-modal="true" aria-label={t(`talentTree.talents.${tooltip.talent.id}.name`)} onClick={event => event.stopPropagation()} className="relative max-h-[80%] w-full overflow-y-auto overscroll-contain border border-[#b4e65e] bg-[#101a0e] p-3 shadow-xl">
        <button type="button" aria-label={copy.close} onClick={() => setTooltip(null)} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center text-[#d8ff86]"><X className="h-5 w-5" /></button>
        <h2 className="pr-10 font-sans text-[16px] font-black text-[#ecffd4]">{t(`talentTree.talents.${tooltip.talent.id}.name`)}</h2>
        <div className="mt-3 flex items-start gap-3">
          <div className="w-[32%] shrink-0">
            {TALENT_ICONS[tooltip.talent.id] ? <img src={TALENT_ICONS[tooltip.talent.id]} alt="" className="w-full border border-[#b4e65e] object-contain" /> : null}
            <p className="mt-2 text-[12px] font-black text-[#d8ff86]">{lang === 'ru' ? 'Базовый урон' : lang === 'en' ? 'Base damage' : 'Базова шкода'}</p>
            {attackPreview.map(({ weapon, index }) => <p key={weapon.id} className="mt-1 text-[12px] leading-snug text-[#efffe3]">{attackNames[index]}: <strong>{Math.round(getWeaponTalentStats(weapon, profile).damage)}</strong></p>)}
          </div>
          <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-[#c3d8b0]">
            <p>{t(`talentTree.talents.${tooltip.talent.id}.description`)}</p>
            <p className="mt-2">{t('talentTree.level', { level: getTalentLevel(profile, tooltip.talent.id), max: tooltip.talent.maxLevel })}</p>
            <p className="text-[#d8ff86]">{getTalentLevel(profile, tooltip.talent.id) >= tooltip.talent.maxLevel ? t('talentTree.maxLevel') : t('talentTree.nextLevel', { level: getTalentLevel(profile, tooltip.talent.id) + 1, max: tooltip.talent.maxLevel })}</p>
            <p className="mt-2 text-[12px] text-[#aebca6]">{t('talentTree.requirements', { requirements: getTalentPrerequisite(tooltip.talent.id).map(([id, level]) => t(`talentTree.talents.${id}.name`) + ' ' + level + '/10').join(', ') || t('talentTree.none') })}</p>
          </div>
        </div>
        {upgradeError ? <p role="alert" className="mt-2 text-sm text-[#ffaaa0]">{upgradeError}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
        <GameTextureButton type="button" tone="green" disabled={upgrading || !isTalentUnlocked(profile, tooltip.talent.id) || getTalentLevel(profile, tooltip.talent.id) >= tooltip.talent.maxLevel || points <= 0} onClick={() => upgrade(tooltip.talent.id)} className="order-2 h-11 w-full text-sm font-black">
          <span className="relative z-10 text-[#13200e]">{upgrading ? '...' : getTalentLevel(profile, tooltip.talent.id) >= tooltip.talent.maxLevel ? t('talentTree.maxLevel') : !isTalentUnlocked(profile, tooltip.talent.id) ? t('talentTree.locked') : points <= 0 ? copy.noPoints : copy.upgrade}</span>
        </GameTextureButton>
          <GameTextureButton type="button" tone="yellow" onClick={() => setTooltip(null)} className="order-1 h-11 text-sm font-black"><span className="relative z-10 text-[#13200e]">{copy.close}</span></GameTextureButton>
        </div>
      </section>
    </div> : null}
  </div>;
}
