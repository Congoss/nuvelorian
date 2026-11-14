import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarkerFrame from '@/components/game/MarkerFrame';
import GameTextureButton from './GameTextureButton';
import leftArrow from '@/assets/ui/left-arrow.png';
import rightArrow from '@/assets/ui/right-arrow.png';
import { CAMP_BACKGROUNDS, getBossBackgroundDropDescription, getUnlockedCampBackgrounds } from './backgrounds';
import { GAME_CONFIG } from '@/lib/gameConfig';
import AnimatedCampBackground from './AnimatedCampBackground';

const BACKGROUNDS = Object.values(CAMP_BACKGROUNDS);

function Frame({ children, className = '' }) {
  return (
    <MarkerFrame className={className} innerClassName="relative z-10" variant="transparent">
      {children}
    </MarkerFrame>
  );
}

function GreenButton({ label, onClick, disabled = false }) {
  return (
    <GameTextureButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-11 px-5 ${disabled ? 'opacity-50 grayscale-[0.2]' : ''}`}
    >
      <span className="relative z-10 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-[#18210d]">{label}</span>
    </GameTextureButton>
  );
}

export default function BackgroundPanel({ profile, onUpdateProfile }) {
  const { t } = useTranslation();
  const unlockedBackgrounds = useMemo(() => getUnlockedCampBackgrounds(profile), [profile]);
  const selectedBackground = profile?.selected_camp_background || 'garage';
  const initialIndex = Math.max(
    0,
    BACKGROUNDS.findIndex((background) => background.id === selectedBackground)
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const activeBackground = BACKGROUNDS[activeIndex] || BACKGROUNDS[0];
  const isUnlocked = unlockedBackgrounds.includes(activeBackground.id);
  const isSelected = selectedBackground === activeBackground.id;
  const sourceBoss = GAME_CONFIG.BOSSES.find((boss) => boss.id === activeBackground.bossId);
  const sourceHint = sourceBoss
    ? getBossBackgroundDropDescription(sourceBoss, profile?.language, isUnlocked)
    : activeBackground.unlockLabel;

  const changeBackground = async () => {
    if (!isUnlocked) return;
    await onUpdateProfile({
      selected_camp_background: activeBackground.id,
      unlocked_backgrounds: unlockedBackgrounds,
    });
  };

  return (
    <div className="space-y-3 pb-2">
      <Frame className="px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#86a55f]">{t('background_panel.section')}</p>
            <h2 className="font-mono text-[20px] font-bold text-[#fff0db]">{t('background_panel.title')}</h2>
          </div>
          <div className="rounded-[16px] border border-[#28ee90] bg-[#111710] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#d8f67a]">
            {t('background_panel.boss_drops')}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[56px_1fr_56px] items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev - 1 + BACKGROUNDS.length) % BACKGROUNDS.length)}
            className="h-[56px] w-[56px] overflow-hidden rounded-[18px] hover:brightness-110"
          >
            <img src={leftArrow} alt={t('background_panel.previous')} className="h-full w-full object-contain" />
          </button>

          <div className="relative h-[360px] overflow-hidden bg-[#0f130f]">
            {activeBackground.animatedScene ? (
              <AnimatedCampBackground sceneId={activeBackground.animatedScene} />
            ) : (
              <img src={activeBackground.source} alt={activeBackground.name} className="h-full w-full object-cover" />
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev + 1) % BACKGROUNDS.length)}
            className="h-[56px] w-[56px] overflow-hidden rounded-[18px] hover:brightness-110"
          >
            <img src={rightArrow} alt={t('background_panel.next')} className="h-full w-full object-contain" />
          </button>
        </div>

        <div className="mt-3 border-t border-[rgba(150,214,82,0.18)] pt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[18px] font-bold text-[#fff0db]">{activeBackground.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8eac66]">{activeBackground.unlockLabel}</p>
              {sourceBoss ? <p className="mt-1 max-w-[245px] font-mono text-[10px] leading-relaxed text-[#d8f67a]">{sourceHint}</p> : null}
            </div>
            <div className={`rounded-[16px] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
              isUnlocked ? 'border-[#28ee90] bg-[#172114] text-[#d8f67a]' : 'border-[#28ee90] bg-[#1a100f] text-[#ffb7a8]'
            }`}>
              {isUnlocked ? t('background_panel.unlocked') : t('background_panel.locked')}
            </div>
          </div>

          <div className="mt-3">
            <GreenButton label={isSelected ? t('background_panel.selected') : t('background_panel.select')} onClick={changeBackground} disabled={!isUnlocked || isSelected} />
          </div>
        </div>
      </Frame>
    </div>
  );
}
