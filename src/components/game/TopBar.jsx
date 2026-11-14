import { useTranslation } from 'react-i18next';
import { getUnreadMailCount } from '@/lib/mailNotifications';
import heroIcon from '@/assets/optimized/nav-hero.webp';
import PlayerName from './PlayerName';
import tentaclesIcon from '@/assets/optimized/cosmohand.webp';
import premiumIcon from '@/assets/optimized/paper.webp';
import strengthIcon from '@/assets/optimized/level.webp';
import { getXpForLevel } from '@/lib/gameConfig';
import { DEFAULT_GUILD_LOGO, GUILD_LOGOS } from '@/lib/clanLogos';
const getResourceIcon = (key) => {
  if (key === 'tentacles') return tentaclesIcon;
  if (key === 'premium') return premiumIcon;
  if (key === 'strength') return strengthIcon;
  if (key === 'mail') return premiumIcon;
  return tentaclesIcon;
};

function IconCrop({ src, alt = '', className = '', scaleClass = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-contain ${scaleClass}`}
      />
    </div>
  );
}

function SettingsChip({ onClick, t }) {
  return (
    <button data-tutorial-settings="true" type="button" onClick={onClick} className="flex h-[28px] w-[28px] shrink-0 items-center justify-center transition hover:brightness-110">
      <span className="sr-only">{t('topbar.settings')}</span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[22px] w-[22px] text-[#28ee90]"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M19.14 12.94a7.97 7.97 0 0 0 .04-.94c0-.32-.01-.63-.04-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.14 7.14 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.12.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.04.62-.04.94s.01.63.04.94L2.83 14.16a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.51.41 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49-.42l.36-2.54c.58-.22 1.12-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" />
      </svg>
    </button>
  );
}

function ShopChip({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 transition hover:brightness-110">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[34px] w-[34px] drop-shadow-[0_0_4px_rgba(40,238,144,0.45)] sm:h-[38px] sm:w-[38px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5 9h14l-1.2 8.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 9Z" stroke="#28ee90" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 9V7.5a3 3 0 0 1 6 0V9" stroke="#28ee90" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.2 12.2h7.6M7.7 15.2h8.6" stroke="#28ee90" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function MailChip({ onClick, t, unread = 0 }) {
  return (
    <button type="button" onClick={onClick} className="relative shrink-0 transition hover:brightness-110">
      <span className="sr-only">{t('topbar.mail')}</span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[34px] w-[34px] text-[#28ee90] drop-shadow-[0_0_4px_rgba(40,238,144,0.55)] sm:h-[38px] sm:w-[38px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="4" y="6.5" width="16" height="11" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.8 7.3L12 13L19.2 7.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#ffe4dc] bg-[#ef3d35] px-1 font-mono text-[9px] font-black leading-none text-white shadow-[0_0_6px_rgba(239,61,53,.8)]">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </button>
  );
}

function formatCompactResource(value, language = 'en') {
  const amount = Math.max(0, Number(value) || 0);
  if (amount < 1_000_000) return Math.floor(amount).toLocaleString(language === 'ru' ? 'ru-RU' : language === 'uk' || language === 'ua' ? 'uk-UA' : 'en-US');
  return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : language === 'uk' || language === 'ua' ? 'uk-UA' : 'en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

function ResourceBar({ icon, value, maxValue = null, textMode = 'integer', compact = false, iconScaleClass = 'scale-[1.12]', language = 'en' }) {
  const safeMax = Math.max(maxValue || 1, 1);
  const hasProgress = Boolean(maxValue);
  const progress = hasProgress ? Math.max(0, Math.min(100, (value / safeMax) * 100)) : 100;
  const label =
    textMode === 'fraction'
      ? `${Math.floor(value).toLocaleString()}/${Math.floor(safeMax).toLocaleString()}`
      : textMode === 'compact'
        ? formatCompactResource(value, language)
        : Math.floor(value).toLocaleString();

  return (
    <div
      className={`relative min-w-0 overflow-hidden border border-[#28ee90] bg-[linear-gradient(180deg,#070907_0%,#030403_100%)] shadow-[inset_0_1px_0_rgba(208,255,142,0.05),0_2px_8px_rgba(0,0,0,0.28)] transition ${
        compact ? 'h-[28px]' : 'h-[38px]'
      }`}
    >
      <div className="pointer-events-none absolute inset-[2px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(0,0,0,0.22)_100%)]" />

      {hasProgress ? (
        <div className={`pointer-events-none absolute bottom-[1px] right-[2px] overflow-hidden bg-[#07100b] ${compact ? 'left-[50px] top-[1px]' : 'left-[33px] top-[1px]'}`}>
          <div
            className="h-full bg-[linear-gradient(90deg,#557d1d_0%,#83b83d_52%,#b5dc59_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.23),inset_0_-1px_0_rgba(25,54,8,0.55)]"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center font-sans text-[clamp(7px,2vw,9px)] font-black leading-none text-[#fffde7] [text-shadow:0_2px_0_rgba(0,0,0,0.85)]">
            {label}
          </span>
        </div>
      ) : null}

      <IconCrop
        src={icon}
        alt=""
        className={`pointer-events-none absolute ${compact ? 'left-[8px] top-0 h-full w-[42px] p-1' : 'left-[3px] top-[4px] h-[30px] w-[30px]'}`}
        scaleClass={iconScaleClass}
      />

      {!hasProgress ? (
        <div className={`pointer-events-none absolute inset-y-0 flex items-center justify-center ${compact ? 'left-[50px] right-0' : 'left-[33px] right-[6px]'}`}>
          <span className={`w-full min-w-0 truncate text-center font-sans font-black leading-none text-[#fffde7] [text-shadow:0_2px_0_rgba(0,0,0,0.85)] ${compact ? 'text-[clamp(9px,2.7vw,12px)]' : 'text-[clamp(9px,2.5vw,12px)]'}`}>
            {label}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ProgressBar({ icon, iconAlt = '', leftValue = null, value, maxValue, fillColor, label, onClick = null, className = '', iconClassName = '', leftBadgeClassName = '', barClassName = '', labelClassName = '', leftLabelClassName = '' }) {
  const safeMax = Math.max(maxValue || 1, 1);
  const progress = Math.max(0, Math.min(100, (value / safeMax) * 100));
  const Wrapper = onClick ? 'button' : 'div';
  const showLeadingBadge = Boolean(icon || leftValue !== null);

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick || undefined}
      className={`grid w-full ${showLeadingBadge ? 'grid-cols-[44px_minmax(0,1fr)] gap-[5px]' : 'grid-cols-1'} items-center overflow-hidden transition hover:brightness-110 ${className}`}
    >
      {showLeadingBadge ? (
        <div className={`relative h-[16px] overflow-hidden border border-[#28ee90] bg-[linear-gradient(180deg,#172414_0%,#0d120b_100%)] ${leftBadgeClassName}`}>
          {icon ? (
            typeof icon === 'string' ? (
              <img src={icon} alt={iconAlt} aria-hidden={iconAlt ? 'false' : 'true'} className={`absolute inset-0 h-full w-full object-cover ${iconClassName}`} />
            ) : (
              <div className={`absolute inset-0 flex items-center justify-center ${iconClassName}`}>{icon}</div>
            )
          ) : null}
          {leftValue !== null ? (
            <span className={`absolute inset-0 flex items-center justify-center font-sans text-[10px] font-black leading-none text-[#fffde7] [text-shadow:0_1px_0_rgba(0,0,0,0.85)] ${leftLabelClassName}`}>
              {leftValue}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className={`relative h-[12px] min-w-0 overflow-hidden border border-[#1f3117] bg-[#091009] ${barClassName}`}>
        <div
          className="absolute inset-y-0 left-0 min-w-[6px] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%`, backgroundColor: fillColor }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_30%,rgba(0,0,0,0.12)_100%)]" />
        {label ? (
          <div className={`absolute inset-0 flex items-center justify-center ${labelClassName}`}>
            <span className="font-sans text-[10px] font-black leading-none text-[#fffde7] [text-shadow:0_1px_0_rgba(0,0,0,0.85)]">
              {label}
            </span>
          </div>
        ) : null}
      </div>
    </Wrapper>
  );
}

function EnergyGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[10px] w-[10px] drop-shadow-[0_0_4px_rgba(252,185,1,0.6)]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13.3 1.9 4.8 13.1h5.1L8.7 22l10.5-12h-5.3l-.6-8.1Z" fill="#FCB901" />
    </svg>
  );
}

function PowerChip({ value }) {
  return (
    <div className="relative h-[28px] min-w-[108px]">
      <div className="absolute inset-y-[4px] left-[20px] right-[6px] border border-[#28ee90] bg-[#10170d]" />
      <img src={getResourceIcon('strength')} alt="" aria-hidden="true" className="absolute left-0 top-[-4px] z-[2] h-[36px] w-[36px] object-contain" />
      <span className="absolute inset-y-[4px] left-[32px] right-[6px] z-[3] flex min-w-[50px] items-center justify-center px-2 font-sans text-[clamp(11px,3vw,13px)] font-black leading-none text-[#fff5ba] [text-shadow:0_2px_0_rgba(0,0,0,0.85)]">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function XpBar({ profile, onClick = null }) {
  const level = Math.max(1, Number(profile?.level || 1));
  const xp = Math.max(0, Number(profile?.xp || 0));
  const xpToNextLevel = Math.max(1, Number(profile?.xp_to_next_level || getXpForLevel(level) || 100));

  return (
    <ProgressBar
      onClick={onClick}
      value={xp}
      maxValue={xpToNextLevel}
      fillColor="#28EE90"
      leftValue={level}
      label={`${Math.floor((xp / xpToNextLevel) * 100)}%`}
      className="mt-[2px] gap-[4px]"
      leftBadgeClassName="h-[16px] border-[#28ee90] bg-[#10170d]"
      barClassName="h-[12px] border-[#28ee90]"
      labelClassName="pointer-events-none"
      leftLabelClassName="text-[#fffde7]"
    />
  );
}

export default function TopBar({ profile, resourceProfile = profile, onOpenShop, onOpenEnergyPurchase, onOpenSettings, onOpenProfile, onOpenMail, hideActions = false, showSettings = !hideActions, mode = 'full' }) {
  const { t, i18n } = useTranslation();
  if (!profile) return <div className="relative z-30 shrink-0" />;

  const playerName = profile.nickname || profile.username || 'Player';
  const clanName = String(profile.clan_name || '').trim();
  const clanLogo = clanName ? GUILD_LOGOS.find((logo) => logo.id === profile.clan_logo_id)?.src || DEFAULT_GUILD_LOGO : null;
  const powerValue = Math.floor(profile.stat_strength || profile.power || profile.attack_power || 0);
  const avatarSrc = profile.avatar || profile.photoUrl || profile.photo_url || profile.avatar_url || profile.profile_photo_url || profile.telegram_photo_url || heroIcon;
  const selectedBanner = null;
  const unreadMail = getUnreadMailCount(profile);

  return (
    <>
      <style>{'html[data-void-flush-scene="true"] .void-flush-profile-row, html[data-void-flush-scene="true"] .void-flush-profile-xp { display: none !important; }'}</style>
    <div
      className="relative z-30 shrink-0 overflow-hidden bg-[linear-gradient(180deg,#10170d_0%,#090d08_48%,#040604_100%)] px-1.5 pb-1 pt-1 shadow-[0_8px_14px_rgba(0,0,0,0.28)] sm:px-2 sm:pb-1.5 sm:pt-1.5"
    >
      <div className="mb-[3px] grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_34px] gap-[3px] overflow-hidden sm:mb-[4px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_38px] sm:gap-[4px]">
      <div className={`grid min-w-0 ${!hideActions && onOpenEnergyPurchase ? 'grid-cols-[minmax(0,1fr)_28px] gap-[3px]' : 'grid-cols-1'}`}>
        <ProgressBar
          value={Math.floor(resourceProfile.energy || 0)}
          maxValue={Math.max(resourceProfile.max_energy || 100, 1)}
          fillColor="#FCB901"
          label={`${Math.floor(resourceProfile.energy || 0)}/${Math.floor(Math.max(resourceProfile.max_energy || 100, 1))}`}
          iconAlt=""
          className="h-[28px] min-w-0"
          barClassName="h-[28px] rounded-[2px]"
          labelClassName="px-1"
        />
        {!hideActions && onOpenEnergyPurchase ? <button type="button" onClick={onOpenEnergyPurchase} aria-label={t('shop.buyEnergy')} title={t('shop.buyEnergy')} className="flex h-[28px] w-[28px] items-center justify-center rounded-[2px] border border-[#8b6600] bg-[#f7b900] font-sans text-[22px] font-black leading-none text-[#181106] shadow-[inset_0_1px_0_rgba(255,255,255,.45)]">+</button> : null}
      </div>
        <ResourceBar
          compact
          icon={getResourceIcon('tentacles')}
          value={resourceProfile.tentacles || 0}
          textMode="compact"
          language={profile.language || i18n.resolvedLanguage || i18n.language}
        />
        <ResourceBar
          compact
          icon={getResourceIcon('premium')}
          value={resourceProfile.premium || 0}
          textMode="integer"
        />
        {showSettings ? (
          <div className="relative z-10">
            <SettingsChip onClick={onOpenSettings} t={t} />
          </div>
        ) : (
          <div />
        )}
      </div>

      {mode === 'full' ? (
        <>
          <div className={`void-flush-profile-row relative grid min-w-0 items-center gap-[3px] overflow-hidden border border-[#28ee90] px-1 py-1 sm:gap-[6px] ${hideActions ? 'grid-cols-[44px_minmax(0,1fr)_minmax(84px,auto)] sm:grid-cols-[50px_minmax(0,1fr)_minmax(92px,auto)]' : 'grid-cols-[44px_minmax(0,1fr)_minmax(84px,auto)_34px_34px] sm:grid-cols-[50px_minmax(0,1fr)_minmax(92px,auto)_38px_38px]'}`}>
            {selectedBanner ? (
              <img
                src={selectedBanner}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-85"
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,7,0.82)_0%,rgba(7,10,7,0.58)_35%,rgba(7,10,7,0.48)_65%,rgba(7,10,7,0.82)_100%)]" />
            <button type="button" onClick={onOpenProfile} className="relative z-20 -my-1.5 -ml-1 shrink-0 transition hover:brightness-110">
              <img src={avatarSrc} alt="" className="h-[52px] w-[52px] rounded-[8px] object-cover sm:h-[58px] sm:w-[58px]" />
            </button>

            <div className="relative z-10 flex min-w-0 items-center gap-1.5 text-left">
              {clanLogo ? <img src={clanLogo} alt="" aria-hidden="true" className="h-[52px] w-[52px] shrink-0 object-contain sm:h-[58px] sm:w-[58px]" loading="lazy" decoding="async" /> : null}
              <div className="min-w-0">
                <PlayerName player={profile} name={playerName} className="truncate font-sans text-[clamp(13px,3.65vw,16px)] font-black leading-none text-[#fff7d5] [text-shadow:0_2px_0_rgba(0,0,0,0.9)]" />
                {clanName ? (
                  <p className="mt-[3px] truncate font-sans text-[clamp(8px,2.25vw,10px)] font-black leading-none text-[#b8df89] [text-shadow:0_1px_0_rgba(0,0,0,0.85)]">
                    {clanName}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="relative z-10">
              <PowerChip value={powerValue} />
            </div>
            {!hideActions ? (
              <div className="relative z-10">
                <ShopChip onClick={onOpenShop} />
              </div>
            ) : null}
            {!hideActions ? (
              <div className="relative z-10">
                <MailChip onClick={onOpenMail} t={t} unread={unreadMail} />
              </div>
            ) : null}
          </div>

          <div className="void-flush-profile-xp"><XpBar profile={profile} onClick={onOpenShop} /></div>
        </>
      ) : null}
    </div>
    </>
  );
}
