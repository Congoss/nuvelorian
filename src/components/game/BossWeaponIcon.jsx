import slapIcon from '@/assets/optimized/all/skills/slap.webp';
import forkStrikeIcon from '@/assets/optimized/all/skills/fork-strike.webp';
import smallPoisonIcon from '@/assets/optimized/all/skills/small-poison.webp';
import mediumPoisonIcon from '@/assets/optimized/all/skills/medium-poison.webp';
import largePoisonIcon from '@/assets/optimized/all/skills/large-poison.webp';
import advancedFistIcon from '@/assets/optimized/two-fingers-v6.webp';
import advancedKnuckleIcon from '@/assets/optimized/enema-v7.webp';
const WEAPON_ICON_MAP = {
  fist: slapIcon,
  knuckle: forkStrikeIcon,
  satchel: smallPoisonIcon,
  f4: mediumPoisonIcon,
  c4: largePoisonIcon,
};
export default function WeaponIcon({ weapon, cooldownLeft = 0, stock = null, muted = false, damageBoosted = false, damageHint, showDamage = true }) {
  const iconSrc = weapon.advancedAttack ? (weapon.id === 'fist' ? advancedFistIcon : advancedKnuckleIcon) : WEAPON_ICON_MAP[weapon.id] || weapon.icon;
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
    <div title={weapon.name} className="relative mx-auto aspect-square w-full max-w-[76px]">
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

      {showDamage && <div title={damageHint} className={`absolute bottom-0 left-0 z-[5] rounded-[7px] border px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none ${damageBoosted ? 'border-[#65ebca] bg-[#123e36] text-[#c5ffed] shadow-[0_0_7px_#2ce2b566]' : 'border-[rgba(140,177,56,0.75)] bg-[rgba(0,0,0,0.65)] text-[#efffd2] [text-shadow:0_0_4px_rgba(98,188,45,0.45)]'}`}>
        {weapon.damage}
      </div>}
    </div>
  );
}

