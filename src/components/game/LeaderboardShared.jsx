import { PROFILE_HEADER_THEMES } from '@/lib/profileHeaderThemes';
import { useLocalProfileHeaderSkin } from '@/lib/localProfileHeaderSkin';
import AvatarWithFrame from '@/components/game/AvatarWithFrame';
import './leaderboardBackground.css';
import PlayerName from '@/components/game/PlayerName';
import heroIcon from '@/assets/optimized/nav-hero.webp';
import goldMedal from '@/assets/boss-ui/gold-medal.png';
import silverMedal from '@/assets/boss-ui/silver-medal.png';
import bronzeMedal from '@/assets/boss-ui/bronze-medal.png';
import { getLeaderboardToneByRank } from '@/components/game/topRankTheme';
import podiumTop1 from '@/assets/leaderboard/podium-top1.webp';
import podiumTop2 from '@/assets/leaderboard/podium-top2.webp';
import podiumTop3 from '@/assets/leaderboard/podium-top3.webp';

const PODIUM_MEDALS = {
  1: goldMedal,
  2: silverMedal,
  3: bronzeMedal,
};

const PODIUM_BANNERS = { 1: podiumTop1, 2: podiumTop2, 3: podiumTop3 };

function formatValue(value) {
  return new Intl.NumberFormat('uk-UA').format(Math.max(0, Math.round(value || 0)));
}

export function LeaderboardRankBadge({ rank, className = '', compact = false }) {
  const tone = getLeaderboardToneByRank(rank);
  const sizeClass = compact ? 'h-7 w-7' : 'h-11 w-11';

  if (PODIUM_MEDALS[rank]) {
    return (
      <div className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-none bg-transparent ${className}`}>
        <img src={PODIUM_MEDALS[rank]} alt="" aria-hidden="true" className={`${sizeClass} object-contain`} />
      </div>
    );
  }

  return compact
    ? <span className={`flex w-8 shrink-0 items-center justify-center whitespace-nowrap font-mono text-[10px] font-black leading-none text-[#c8d6ba] ${className}`}>#{rank}</span>
    : <div className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-none border font-mono text-[12px] font-black ${tone.badgeClass} ${className}`}>{rank}</div>;
}

export function getLeaderboardRankIcon(rank) {
  return PODIUM_MEDALS[rank] || null;
}

function LeaderboardMedia({ mediaKind = 'avatar', mediaSrc = null, mediaFrameId = null, mediaText = '', alt = '', className = '', compact = false }) {
  if (mediaKind === 'logo') {
    return (
      mediaSrc ? <img src={mediaSrc} alt={alt} aria-hidden="true" className={`${compact ? 'h-9 w-9' : 'h-12 w-12'} shrink-0 object-contain ${className}`} /> : <div className={`flex ${compact ? 'h-9 w-9' : 'h-12 w-12'} shrink-0 items-center justify-center font-mono text-[12px] font-black text-[#dfff9c] ${className}`}>{mediaText}</div>
    );
  }

  if (mediaKind === 'tag') {
    return (
      <div className={`flex ${compact ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 items-center justify-center rounded-none border border-[#28ee90] bg-[radial-gradient(circle_at_35%_30%,#314a25_0%,#111710_74%)] font-mono text-[12px] font-black text-[#dfff9c] ${className}`}>
        {mediaText || '-'}
      </div>
    );
  }

  return (
    <AvatarWithFrame
      src={mediaSrc || heroIcon}
      alt={alt}
      frameId={mediaFrameId}
      showFrame={Boolean(mediaFrameId)}
      className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 ${className}`}
      roundedClassName="rounded-none"
      paddingClassName="p-[3px]"
    />
  );
}

export function LeaderboardBadgePill({ label, icon = null, tone = 'green', className = '' }) {
  const toneClass =
    tone === 'icon'
      ? 'border-transparent bg-transparent text-transparent shadow-none'
      : tone === 'gold'
        ? 'border-[#d8b74d] bg-[#201809] text-[#f4d46b]'
        : tone === 'blue'
          ? 'border-[#5cc5ff] bg-[#0f1820] text-[#a8ddff]'
          : 'border-[#28ee90] bg-[#0d160e] text-[#dfff9c]';

  return (
    <div className={`flex h-10 min-w-[44px] items-center justify-center gap-1 rounded-none border px-2 font-mono text-[10px] font-black uppercase tracking-[0.08em] ${tone === 'icon' ? 'border-transparent bg-transparent px-0' : toneClass} ${className}`}>
      {icon ? <img src={icon} alt="" aria-hidden="true" className={tone === 'icon' ? 'h-8 w-8 object-contain' : 'h-4 w-4 object-contain'} /> : null}
      {label ? <span>{label}</span> : null}
    </div>
  );
}

export function LeaderboardValuePill({ value, icon = null, className = '', compact = false, valueFormatter = formatValue }) {
  return (
    <div className={`relative flex shrink-0 items-center ${compact ? 'h-9 min-w-[88px]' : 'h-11 min-w-[108px]'} ${className}`}>
      <div className={`pointer-events-none absolute right-0 rounded-full bg-[radial-gradient(ellipse,rgba(5,10,8,0.86)_25%,rgba(5,10,8,0.55)_60%,transparent_80%)] ${compact ? 'inset-y-[4px]' : 'inset-y-[6px]'} ${icon ? (compact ? 'left-[12px]' : 'left-[16px]') : 'left-0'}`} />
      {icon ? <img src={icon} alt="" aria-hidden="true" className={`relative z-[2] shrink-0 object-contain ${compact ? 'h-9 w-9' : 'h-11 w-11'}`} /> : null}
      <span className={`relative z-[3] flex flex-1 items-center justify-center whitespace-nowrap px-2 font-mono font-black leading-none text-[#fff5ba] ${compact ? 'text-[11px]' : 'text-[12px]'}`}>{valueFormatter(value)}</span>
    </div>
  );
}

export function LeaderboardRow({
  previewHeaderSkin = false,
  rank,
  mediaKind = 'avatar',
  mediaSrc = null,
  mediaFrameId = null,
  mediaText = '',
  title,
  titlePlayer = null,
  clanHeaderTheme = null,
  subtitle = '',
  badges = [],
  rightNode = null,
  rightActions = null,
  rightNodeClassName = 'min-w-[108px]',
  showRankBadge = true,
  compactRank = false,
  selected = false,
  onClick = null,
  className = '',
  titleClassName = '',
  subtitleClassName = '',
}) {
  const headerSkin = useLocalProfileHeaderSkin(titlePlayer?.id);
  const equippedTheme = Object.hasOwn(PROFILE_HEADER_THEMES, titlePlayer?.profile_header_theme) ? titlePlayer.profile_header_theme : null;
  const previewTheme = import.meta.env.DEV && previewHeaderSkin ? (typeof previewHeaderSkin === 'string' ? previewHeaderSkin : 'heli') : null;
  const theme = clanHeaderTheme?.startsWith('friday13_guild_') ? clanHeaderTheme : previewTheme || (equippedTheme?.startsWith('friday13_guild_') ? null : equippedTheme);
  const hasHeaderSkin = Boolean(theme || headerSkin.hasEquipped);
  const headerBackground = theme ? <ProfileHeaderSkinPreview bossId={theme}/> : <ProfileHeaderSkin ownerId={titlePlayer?.id}/>;
  if (rightActions) return (
    <div data-ranking-row="true" className={`${hasHeaderSkin ? 'gold-ranking-row' : ''} relative isolate overflow-hidden [&>*:not([aria-hidden])]:relative [&>*:not([aria-hidden])]:z-10 flex w-full min-w-0 items-center gap-1 rounded-none border ${hasHeaderSkin ? 'border-transparent' : 'border-[#28ee90]'} px-2 py-1.5 ${selected ? 'bg-[#162811]' : 'bg-[#090d09]'} ${className}`}>
      {headerBackground}
      <button type="button" onClick={onClick || undefined} disabled={!onClick} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        {showRankBadge && <LeaderboardRankBadge rank={rank} compact={compactRank} />}
        <LeaderboardMedia mediaKind={mediaKind} mediaSrc={mediaSrc} mediaFrameId={mediaFrameId} mediaText={mediaText} compact={compactRank} />
        <span className="min-w-0 flex-1"><span className={`block truncate font-mono text-[13px] font-bold text-[#f4f1c8] ${titleClassName}`}><PlayerName player={titlePlayer} name={title || '-'} className="inherit" /></span><span className={`mt-0.5 block truncate font-mono text-[8px] uppercase tracking-[0.1em] text-[#86a563] ${subtitleClassName}`}>{subtitle || '-'}</span></span>
      </button>
      <div className="flex shrink-0 items-center gap-1">{rightActions}{rightNode}</div>
    </div>
  );
  if (onClick) {
    return (
      <button
        type="button"
        data-ranking-row="true"
        onClick={onClick}
      className={`${hasHeaderSkin ? 'gold-ranking-row' : ''} relative isolate overflow-hidden [&>*:not([aria-hidden])]:relative [&>*:not([aria-hidden])]:z-10 flex w-full min-w-0 items-center ${compactRank ? 'gap-2 px-2 py-1.5' : 'gap-3 px-3 py-2.5'} rounded-none border ${hasHeaderSkin ? 'border-transparent' : 'border-[#28ee90]'} text-left transition ${
          selected ? 'bg-[#162811]' : 'bg-[#090d09] hover:bg-[#101710]'
        } ${className}`}
      >
        {headerBackground}
        {showRankBadge ? <LeaderboardRankBadge rank={rank} compact={compactRank} /> : null}
        <LeaderboardMedia mediaKind={mediaKind} mediaSrc={mediaSrc} mediaFrameId={mediaFrameId} mediaText={mediaText} compact={compactRank} />
        <div className="min-w-0 flex-1">
          <p data-keepcase="true" className={`truncate font-mono ${compactRank ? 'text-[13px]' : 'text-[14px]'} font-bold text-[#f4f1c8] ${titleClassName}`}>
            <PlayerName player={titlePlayer} name={title || '-'} className="inherit" />
          </p>
          <p className={`mt-0.5 truncate font-mono ${compactRank ? 'text-[8px] tracking-[0.1em]' : 'text-[9px] tracking-[0.16em]'} uppercase text-[#86a563] ${subtitleClassName}`}>
            {subtitle || '-'}
          </p>
        </div>
        {badges.length ? (
          <div className="flex shrink-0 items-center gap-2">
            {badges.map((badge, index) => (
              <LeaderboardBadgePill key={`${badge.label || 'badge'}-${index}`} label={badge.label} icon={badge.icon} tone={badge.tone} />
            ))}
          </div>
        ) : null}
        {rightNode ? <div className={`relative shrink-0 ${rightNodeClassName}`}>{rightNode}</div> : null}
      </button>
    );
  }

  return (
    <div
      data-ranking-row="true"
      className={`${hasHeaderSkin ? 'gold-ranking-row' : ''} relative isolate overflow-hidden [&>*:not([aria-hidden])]:relative [&>*:not([aria-hidden])]:z-10 flex w-full min-w-0 items-center ${compactRank ? 'gap-2 px-2 py-1.5' : 'gap-3 px-3 py-2.5'} rounded-none border ${hasHeaderSkin ? 'border-transparent' : 'border-[#28ee90]'} text-left transition ${
        selected ? 'bg-[#162811]' : 'bg-[#090d09] hover:bg-[#101710]'
      } ${className}`}
    >
      {headerBackground}
      {showRankBadge ? <LeaderboardRankBadge rank={rank} compact={compactRank} /> : null}
      <LeaderboardMedia mediaKind={mediaKind} mediaSrc={mediaSrc} mediaFrameId={mediaFrameId} mediaText={mediaText} compact={compactRank} />
      <div className="min-w-0 flex-1">
        <p data-keepcase="true" className={`truncate font-mono ${compactRank ? 'text-[13px]' : 'text-[14px]'} font-bold text-[#f4f1c8] ${titleClassName}`}>
          <PlayerName player={titlePlayer} name={title || '-'} className="inherit" />
        </p>
        <p className={`mt-0.5 truncate font-mono ${compactRank ? 'text-[8px] tracking-[0.1em]' : 'text-[9px] tracking-[0.16em]'} uppercase text-[#86a563] ${subtitleClassName}`}>
          {subtitle || '-'}
        </p>
      </div>
      {badges.length ? (
        <div className="flex shrink-0 items-center gap-2">
          {badges.map((badge, index) => (
            <LeaderboardBadgePill key={`${badge.label || 'badge'}-${index}`} label={badge.label} icon={badge.icon} tone={badge.tone} />
          ))}
        </div>
      ) : null}
        {rightNode ? <div className={`relative shrink-0 ${rightNodeClassName}`}>{rightNode}</div> : null}
    </div>
  );
}

function LeaderboardPodiumCard({ rank, row, value, valueIcon = null, compact = false, onOpenPlayerProfile = null, valueFormatter }) {
  const mediaKind = row?.mediaKind || 'avatar';
  const isFirst = rank === 1;
  const onClick = row?.onClick || (row?.titlePlayer?.id ? () => onOpenPlayerProfile?.(row.titlePlayer) : null);
  return (
    <button type="button" onClick={onClick || undefined} disabled={!onClick} className={`flex min-w-0 flex-1 flex-col items-center ${isFirst ? 'pb-0' : 'pb-1'} ${onClick ? 'cursor-pointer transition hover:brightness-125 active:scale-[.98]' : 'cursor-default'}`}>
      <div className={`relative w-full aspect-[613/756] ${compact ? 'max-w-[96px] sm:max-w-[112px]' : 'max-w-[132px] sm:max-w-[156px]'} ${isFirst ? 'scale-[1.06]' : ''}`}>
        <img src={PODIUM_BANNERS[rank]} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" />
        <div className="absolute inset-x-[12%] top-[14%] z-[3] flex items-center justify-center gap-1 text-[#fff9d8] [text-shadow:0_2px_0_rgba(0,0,0,0.9)]">
          {valueIcon ? <img src={valueIcon} alt="" aria-hidden="true" className="h-5 w-5 object-contain sm:h-6 sm:w-6" /> : null}
          <span className="font-mono text-[11px] font-black leading-none sm:text-[12px]">{valueFormatter(value)}</span>
        </div>
        <div className="absolute inset-x-0 top-[24%] flex justify-center">
          <LeaderboardMedia
            mediaKind={mediaKind}
            mediaSrc={row?.mediaSrc}
            mediaFrameId={row?.mediaFrameId}
            mediaText={row?.mediaText || ''}
            className={compact ? (isFirst ? '!h-10 !w-10 sm:!h-12 sm:!w-12' : '!h-9 !w-9 sm:!h-11 sm:!w-11') : (isFirst ? 'h-[54px] w-[54px] sm:h-[64px] sm:w-[64px]' : 'h-[48px] w-[48px] sm:h-[58px] sm:w-[58px]')}
            alt={row?.title || ''}
          />
        </div>
        <div className="absolute inset-x-[12%] top-[60%] flex flex-col items-center text-center text-[#fff9d8] [text-shadow:0_2px_0_rgba(0,0,0,0.9)]">
          <p className="w-full truncate font-mono text-[9px] font-black uppercase sm:text-[11px]"><PlayerName player={row?.titlePlayer} name={row?.title || '-'} /></p>
          <p className="mt-0.5 w-full truncate font-mono text-[7px] uppercase tracking-[0.04em] text-[#f1ffd3] sm:text-[8px]">{row?.subtitle || '-'}</p>
        </div>
      </div>
    </button>
  );
}

export function LeaderboardPodium({ rows = [], getRowLabel = (rank) => `Top ${rank}`, getRowValue = (row) => row?.value || 0, getRowValueIcon = (row) => row?.valueIcon || null, compact = false, onOpenPlayerProfile = null, valueFormatter = formatValue }) {
  const top = rows.slice(0, 3);
  const podiumRows = [
    { rank: 2, row: top[1] },
    { rank: 1, row: top[0] },
    { rank: 3, row: top[2] },
  ].filter((entry) => Boolean(entry.row));
  return (
    <div className={`mb-3 flex items-end gap-1 px-1 py-1 sm:gap-2 ${podiumRows.length === 1 ? 'justify-center' : 'justify-between'}`}>
      {podiumRows.map(({ rank, row }) => (
        <LeaderboardPodiumCard
          key={rank}
          compact={compact}
          rank={rank}
          row={row}
          label={getRowLabel(rank, row)}
          value={getRowValue(row)}
          valueFormatter={valueFormatter}
          valueIcon={getRowValueIcon(row)}
          onOpenPlayerProfile={onOpenPlayerProfile}
        />
      ))}
    </div>
  );
}
import ProfileHeaderSkin from './ProfileHeaderSkin';
import ProfileHeaderSkinPreview from './ProfileHeaderSkinPreview';
