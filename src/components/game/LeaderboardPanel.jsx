import { warmFirstFrameImages } from '@/lib/sceneAssets';
import CombatLoader from './CombatLoader';
import { useQuery } from '@tanstack/react-query';
import { translateUiText } from '@/lib/uiTextTranslations';
import PlayerName from './PlayerName';
import { getClanJoinState } from '@/lib/clanJoinState';
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import MarkerFrame from '@/components/game/MarkerFrame';
import { getClan, joinClan, listClanMembers, listClans, listTopPlayers, getMyLeaderboardPosition } from '@/services/gameApi';
import heroIcon from '@/assets/optimized/nav-hero.webp';
import AvatarWithFrame from '@/components/game/AvatarWithFrame';
import friendsIcon from '@/assets/ui/friends.png';
import { DEFAULT_GUILD_LOGO, GUILD_LOGO_BY_ID } from '@/lib/clanLogos';
import GameTextureButton from './GameTextureButton';
const ClanBioView = lazy(() => import('./ClanPanel').then(module => ({ default: module.ClanBioView })));
import bronzeMedal from '@/assets/boss-ui/bronze-medal.png';
import silverMedal from '@/assets/boss-ui/silver-medal.png';
import goldMedal from '@/assets/boss-ui/gold-medal.png';
import { getResourceIcon } from '@/lib/resourceIcons';
import { getCARankProgress, getCARankIcon } from '@/lib/caRanks';
import { getTopRankTone, getTopRankToneByRank } from '@/components/game/topRankTheme';
import damageAchievement from '@/assets/clan-achievements/damage.webp';
import damageFlag from '@/assets/clan-achievements/damage-flag.webp';
import donationsAchievement from '@/assets/clan-achievements/donations.webp';
import donationsFlag from '@/assets/clan-achievements/donations-flag.webp';
import helperAchievement from '@/assets/clan-achievements/helper.webp';
import helperFlag from '@/assets/clan-achievements/helper-flag.webp';
import questsAchievement from '@/assets/clan-achievements/quests.webp';
import questsFlag from '@/assets/clan-achievements/quests-flag.webp';
import {
  LeaderboardPodium,
  LeaderboardRow,
  LeaderboardValuePill,
} from '@/components/game/LeaderboardShared';

const PODIUM_MEDALS = {
  1: goldMedal,
  2: silverMedal,
  3: bronzeMedal,
};

function formatNumber(value) {
  return new Intl.NumberFormat('uk-UA').format(Math.max(0, Math.round(value || 0)));
}

function getPower(player) {
  return Math.floor(
    player?.stat_strength ||
      player?.power ||
      player?.attack_power ||
      player?.clan_power ||
      (player?.total_boss_damage || 0) / 10 ||
      0,
  );
}

function getReferralCount(player) {
  const explicit =
    Number(
      player?.referralsCount ||
        player?.referral_count ||
        player?.referrals_count ||
        player?.referred_friends_count ||
        player?.referrals ||
        0,
    ) || 0;
  if (explicit > 0) return explicit;
  return Array.isArray(player?.referred_friends) ? player.referred_friends.length : 0;
}

function PositionDock({ children }) {
  return <div data-leaderboard-position="true" className="mt-2 flex shrink-0 flex-col justify-center border-t border-[#28ee90] bg-[#071007] pt-2">{children}</div>;
}

function Frame({ children, className = '' }) {
  return <div className={`h-full min-h-0 ${className}`}>{children}</div>;
}

function TabButton({ active, label, count, onClick }) {
  return (
    <GameTextureButton
      type="button"
      onClick={onClick}
      tone={active ? 'yellow' : 'gray'}
      className={`h-full min-w-0 font-mono text-[9px] font-black uppercase tracking-[0.08em] sm:text-[11px] sm:tracking-[0.12em] ${
        active ? 'text-[#2a240e]' : 'text-[#2a240e]'
      }`}
    >
      <span className="relative z-10 truncate px-1">{label}</span>
      <span className={`relative z-10 ml-1 hidden text-[8px] sm:inline sm:text-[9px] ${active ? 'text-[#4c420f]' : 'text-[#7f8792]'}`}>{count}</span>
    </GameTextureButton>
  );
}

function ReferralChip({ count }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <img src={friendsIcon} alt="" aria-hidden="true" className="h-11 w-11 shrink-0 object-contain sm:h-[56px] sm:w-[56px]" />
      <div className="flex min-w-[68px] items-center justify-end rounded-none border border-[#28ee90] bg-[#0e150c] px-1.5 py-1 sm:min-w-[92px] sm:px-2">
        <span className="font-mono text-[11px] font-black leading-none text-[#fff5ba] sm:text-[13px]">{formatNumber(count)}</span>
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const topTone = getTopRankToneByRank(rank);

  if (PODIUM_MEDALS[rank]) {
    return (
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-none ${topTone.badgeClass.replace('border-[#28ee90] ', '')}`}>
        <img src={PODIUM_MEDALS[rank]} alt="" aria-hidden="true" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
      </div>
    );
  }

  return (
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-none border font-mono text-[10px] font-black ${topTone.badgeClass}`}>
        {rank}
      </div>
    );
}


function PlayerRankCA({ rank, ca, rankIcon, onShow, onHide }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onMouseEnter={() => onShow?.()}
      onMouseLeave={() => onHide?.()}
      onTouchStart={(event) => {
        event.stopPropagation();
        onShow?.();
      }}
      onTouchEnd={(event) => {
        event.stopPropagation();
        onHide?.();
      }}
      onTouchCancel={(event) => {
        event.stopPropagation();
        onHide?.();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onShow?.();
        }
        if (event.key === 'Escape') onHide?.();
      }}
        className="relative ml-auto flex shrink-0 items-center gap-1"
      >
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9">
        {rankIcon ? (
          <img src={rankIcon} alt="" aria-hidden="true" className="h-full w-full object-contain" />
        ) : (
          <RankBadge rank={rank} />
        )}
      </div>
      <LeaderboardValuePill value={ca} icon={getResourceIcon('strength')} className="w-28" compact />
    </div>
  );
}
function EmptyRows({ label }) {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center px-4 text-center">
      <p className="font-mono text-[11px] leading-relaxed text-[#9bb576]">{label}</p>
    </div>
  );
}

function PlayerRow({ player, rank, isMe, onOpenPlayerProfile, t, lang }) {
  const power = getPower(player);
  const canOpen = !isMe && player?.id;
  const [showRankPopup, setShowRankPopup] = useState(false);
  const rankInfo = getCARankProgress(power);
  const rankIcon = getCARankIcon(rankInfo.current);
  const rankName = rankInfo.current?.names?.[lang] || rankInfo.current?.names?.ua || rankInfo.current?.id;
  const nextName = rankInfo.next ? (rankInfo.next.names?.[lang] || rankInfo.next.names?.ua || rankInfo.next.id) : null;

  return (
    <div className={`relative ${showRankPopup ? 'z-30' : 'z-10'}`}>
      <LeaderboardRow
        rank={rank}
        selected={isMe}
        onClick={() => canOpen && onOpenPlayerProfile?.(player)}
        mediaSrc={getAvatarUrl(player) || heroIcon}
        mediaFrameId={getEquippedOwnedFrameId(player)}
        title={player.nickname || player.username || `Player ${rank}`}
        titlePlayer={player}
      compactRank
        subtitle={player.clan_name || t('leaderboard_panel.no_clan')}
        rightNode={
          <PlayerRankCA
            rank={rank}
            ca={power}
            rankIcon={rankIcon}
            onShow={() => setShowRankPopup(true)}
            onHide={() => setShowRankPopup(false)}
          />
        }
        titleClassName={isMe ? 'text-[#d8f67a]' : ''}
      />
      {showRankPopup ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[80] w-[180px] rounded-none border border-[#28ee90] bg-[#0d160d] p-2 text-left shadow-[0_10px_18px_rgba(0,0,0,0.45)] sm:w-[220px]">
          <div className="flex items-center gap-2">
            {rankIcon ? <img src={rankIcon} alt="" aria-hidden="true" className="h-8 w-8 object-contain" /> : null}
            <div className="min-w-0">
              <p className="truncate font-mono text-[11px] font-black text-[#f7ffdc]">{rankName}</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#9ed87a]">{rankInfo.current?.rarity}</p>
            </div>
          </div>
          <p className="mt-2 font-mono text-[9px] text-[#b7d89d]">CA: <span className="text-[#fff5ba]">{formatNumber(power)}</span></p>
          <p className="font-mono text-[9px] text-[#b7d89d]">
            {nextName ? `Next: ${nextName}` : 'Max rank reached'}
          </p>
          <p className="font-mono text-[9px] text-[#b7d89d]">
            {nextName ? `Need: ${formatNumber(rankInfo.needed)} CA` : 'Need: 0 CA'}
          </p>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-none border border-[#28ee90] bg-[#0a100a]">
            <div className="h-full rounded-none" style={{ width: `${Math.round(rankInfo.progress * 100)}%`, background: rankInfo.current?.color || '#8A8F8D', boxShadow: `0 0 10px ${rankInfo.current?.glow || '#7FE7D7'}` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReferralRow({ player, rank, isMe, onOpenPlayerProfile, t }) {
  const referralCount = getReferralCount(player);
  const canOpen = !isMe && player?.id;
  const avatarFrameId = getEquippedOwnedFrameId(player);

  return (
    <LeaderboardRow
      rank={rank}
      selected={isMe}
      onClick={() => canOpen && onOpenPlayerProfile?.(player)}
      mediaSrc={getAvatarUrl(player) || heroIcon}
      mediaFrameId={avatarFrameId}
        title={player.nickname || player.username || `Player ${rank}`}
      titlePlayer={player}
      subtitle={player.clan_name || t('leaderboard_panel.no_clan')}
      compactRank
      rightNode={<LeaderboardValuePill value={referralCount} icon={friendsIcon} compact />}
    />
  );
}

function getAvatarUrl(player) {
  return (
    player?.avatar ||
    player?.photoUrl ||
    player?.avatar_url ||
    player?.photo_url ||
    player?.profile_photo_url ||
    null
  );
}

function getOwnedFrameIds(player) {
  return Array.isArray(player?.unlocked_avatar_frames) ? player.unlocked_avatar_frames : [];
}

function getEquippedOwnedFrameId(player) {
  const equipped = player?.avatar_frame_id || player?.selected_avatar_frame || null;
  if (!equipped) return null;
  const owned = getOwnedFrameIds(player);
  return owned.includes(equipped) ? equipped : null;
}

function ClanRow({ clan, rank, t, onOpen }) {
  return (
    <LeaderboardRow
      clanHeaderTheme={clan.raidHeaderTheme}
      rank={rank}
      mediaKind={clan.logoId ? "logo" : "tag"}
      mediaSrc={clan.logoId ? GUILD_LOGO_BY_ID[clan.logoId] || DEFAULT_GUILD_LOGO : null}
      mediaText={clan.logoId ? "" : clan.tag}
      title={clan.name}
      subtitle={`LVL ${clan.clanLevel || 0}`}
      rightNode={<LeaderboardValuePill value={clan.power} icon={getResourceIcon('strength')} />}
      onClick={() => onOpen?.(clan)}
    />
  );
}

function ClanAchievementBadge({ icon, flag, level, label, progress, nextThreshold }) {
  const pct = Math.min(100, Math.round(Number(progress || 0) / Math.max(1, Number(nextThreshold || 1)) * 100));
  return <div className="flex min-w-0 flex-col items-center"><div className="relative h-[68px] w-[52px] sm:h-[78px] sm:w-[60px]"><img src={icon} alt="" aria-hidden="true" className="h-full w-full object-contain" /><div className="absolute bottom-0 left-1/2 w-[31%] -translate-x-1/2"><img src={flag} alt="" aria-hidden="true" className="w-full object-contain" /><span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-black text-[#fff5c9] [text-shadow:-1px_-1px_0_#211208,1px_-1px_0_#211208,-1px_1px_0_#211208,1px_1px_0_#211208]">{level}</span></div></div><p className="-mt-1 truncate text-center font-mono text-[7px] font-black uppercase text-[#d9e8be]">{label}</p><div className="mt-1 h-1 w-full bg-[#202a1d]"><span className="block h-full bg-[#9bdb38]" style={{ width: `${pct}%` }} /></div></div>;
}

export function ClanPreviewModal({ clan, profile, onClose, onOpenPlayerProfile }) {
  const [record, setRecord] = useState(null);
  const [members, setMembers] = useState([]);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  useEffect(() => { let live = true; Promise.all([getClan(clan.name), listClanMembers(clan.name)]).then(([nextClan, nextMembers]) => { if (live) { setRecord(nextClan); setMembers(Array.isArray(nextMembers) ? nextMembers : []); } }).catch(() => { if (live) setRecord({}); }); return () => { live = false; }; }, [clan.name]);
  const logo = GUILD_LOGO_BY_ID[record?.logo_id || clan.logoId] || DEFAULT_GUILD_LOGO;
  const achievements = record?.achievements || {};
  const clanLevel = Math.min(...['damage', 'donations', 'helper', 'quests'].map((id) => Math.min(10, Number(achievements[id]?.level || 0))));
  const joinType = String(record?.join_type || 'open');
  const joinState = getClanJoinState(profile, { id: record?.id || clan.id, name: record?.name || clan.name, join_type: joinType }, profile?.language);
  const actionLabel = joinState.label;
  const submitJoin = async () => {
    if (joinState.disabled) return;
    setJoining(true); setJoinError('');
    try { const result = await joinClan(record?.id || clan.id || clan.name); if (result?.requested) setJoinError(translateUiText('Заявку подано')); else window.location.reload(); } catch (error) { setJoinError(translateUiText(error?.message || 'Не вдалося вступити')); } finally { setJoining(false); }
  };
  if (record) {
    const previewClan = {
      id: record.id || clan.id || clan.name,
      name: record.name || clan.name,
      logoId: record.logo_id || clan.logoId,
      sign: { badge: 'C' },
      description: record.description || translateUiText('Клановий профіль'),
      achievements,
      members: members.map((member) => ({ ...member, id: member.id, name: member.nickname || member.username || 'player', battle_pass_view: member.battle_pass_view, battle_pass_tier: member.battle_pass_tier, role: member.clan_role || 'member', clanLabel: member.clan_role || 'member', power: getPower(member), avatar: getAvatarUrl(member), avatar_frame_id: getEquippedOwnedFrameId(member), unlocked_avatar_frames: getOwnedFrameIds(member) })),
      activeMemberCount: members.length,
      memberLimit: record.max_members || 25,
      clanPower: clan.power || 0,
      lastRaidDamage: 0,
      hasClan: false,
      viewerRole: '',
      totalBossKills: 0,
      milestones: {},
    };
    return <div className="absolute inset-0 z-[120] flex min-h-0 flex-col overflow-hidden bg-black/90 p-3">
      <div className="mx-auto flex w-full max-w-[520px] shrink-0 justify-end border-b border-[#28ee90]/40 bg-[#091008]">
        <button type="button" onClick={onClose} aria-label={profile?.language === 'ru' ? 'Закрыть клан' : profile?.language === 'en' ? 'Close clan' : 'Закрити клан'} className="flex h-11 w-11 items-center justify-center text-2xl text-[#dfff9c]">×</button>
      </div>
      <div className="mx-auto min-h-0 w-full max-w-[520px] flex-1 overflow-y-auto overscroll-contain"><Suspense fallback={<div className="p-4 text-center">…</div>}><ClanBioView onOpenPlayerProfile={onOpenPlayerProfile} language={profile?.language} clan={previewClan} onClose={null} onOpenChat={() => {}} onLeaveClan={() => {}} onRefreshClan={() => {}} externalAction={{ label: joining ? '...' : actionLabel, tone: joinState.disabled ? 'gray' : 'yellow', disabled: joining || joinState.disabled, onClick: submitJoin }} /></Suspense>{joinError ? <p className="mt-2 text-center font-mono text-[9px] font-black text-[#ffb2a5]">{joinError}</p> : null}</div>
    </div>;
  }
  const achievementArt = { damage: [damageAchievement, damageFlag], quests: [questsAchievement, questsFlag], helper: [helperAchievement, helperFlag], donations: [donationsAchievement, donationsFlag] };
  return <div onClick={event=>{if(event.target===event.currentTarget)onClose();}} className="fixed inset-0 z-[120] overflow-y-auto bg-black/90 p-3"><div className="mx-auto w-full max-w-[520px] border border-[#28ee90] bg-[#091008] p-3"><div className="flex gap-3"><div className="flex h-[96px] w-[96px] shrink-0 items-center justify-center"><img src={logo} alt="" className="h-[92px] w-[92px] object-contain" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-mono text-[18px] font-black text-[#fff0db]">{record?.name || clan.name}</p><p className="mt-0.5 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#d1ba5c]">CLAN LEVEL {clanLevel}</p></div><button type="button" onClick={onClose} className="text-xl text-[#dfff9c]">×</button></div><p className="mt-2 font-mono text-[10px] leading-relaxed text-[#d5c5aa]">{record?.description || 'Клановий профіль'}</p></div></div><div className="mt-3 grid grid-cols-3 gap-2">{[{ label: 'CLAN POWER', value: formatNumber(clan.power || 0), icon: getResourceIcon('strength') }, { label: 'ACTIVE PLAYERS', value: `${members.length}/${record?.max_members || 25}`, icon: heroIcon }, { label: 'LAST RAID DAMAGE', value: '0', icon: getResourceIcon('energy') }].map((item) => <div key={item.label} className="flex min-h-[56px] min-w-0 items-center gap-2 border border-[#28ee90] bg-[#0e150d] px-2 py-2"><img src={item.icon} alt="" className="h-6 w-6 shrink-0 object-contain" /><div className="min-w-0"><p className="truncate font-mono text-[8px] uppercase text-[#93b765]">{item.label}</p><p className="truncate font-mono text-[12px] font-black text-[#fff0db]">{item.value}</p></div></div>)}</div><GameTextureButton type="button" tone={joinState.disabled ? 'gray' : 'yellow'} disabled={joining || joinState.disabled} onClick={submitJoin} className="mt-3 h-10 w-full"><span className="relative z-10 font-mono text-[11px] font-black uppercase text-[#17220e]">{joining ? '...' : actionLabel}</span></GameTextureButton>{joinError ? <p className="mt-2 text-center font-mono text-[9px] font-black text-[#ffb2a5]">{joinError}</p> : null}<div className="mt-3 grid grid-cols-4 gap-2">{['damage', 'quests', 'helper', 'donations'].map((id) => { const state = achievements[id] || {}; const [icon, flag] = achievementArt[id]; return <ClanAchievementBadge key={id} icon={icon} flag={flag} level={state.level || 0} label={id} progress={state.progress} nextThreshold={state.maxed ? state.progress : state.nextThreshold} />; })}</div><p className="mt-4 font-mono text-[10px] font-black uppercase text-[#a9cd74]">{"" + translateUiText("УЧАСНИКИ") + " "}{members.length}/{record?.max_members || 25}</p><div className="mt-2 space-y-1.5">{members.map((member) => <button type="button" key={member.id} onClick={() => member.id && onOpenPlayerProfile?.(member)} className="flex w-full items-center gap-2 border border-[#345333] bg-[#0c130b] p-2 text-left transition hover:bg-[#142414]"><AvatarWithFrame profile={member} size="sm" /><div className="min-w-0 flex-1"><p className="truncate font-mono text-[11px] font-black text-[#fff0db]"><PlayerName player={member} name={member.nickname || member.username || 'player'} /></p><p className="font-mono text-[8px] uppercase text-[#8eb26c]">LVL {member.level || 1} · {formatNumber(getPower(member))} CA</p></div></button>)}</div></div></div>;
}

function PodiumCard({ place, title, subtitle, subtitleIcon = null, tone = 'gold', t, clanLogoId = null, clanTag = null, showFallbackAvatar = true, avatarSrc = heroIcon, avatarFrameId = null }) {
  const heightClass = place === 1 ? 'h-[98px] sm:h-[108px]' : place === 2 ? 'h-[86px] sm:h-[94px]' : 'h-[84px] sm:h-[90px]';
  const toneStyle = getTopRankTone(tone);
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center pt-2 sm:pt-4">
      <div className="relative z-[2] mb-0">
        {clanLogoId ? (
          <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-none border border-[#28ee90] bg-[radial-gradient(circle_at_35%_30%,#314a25_0%,#111710_74%)] sm:h-[88px] sm:w-[88px]">
            <img src={GUILD_LOGO_BY_ID[clanLogoId] || DEFAULT_GUILD_LOGO} alt="" aria-hidden="true" className="h-[62px] w-[62px] object-contain sm:h-[74px] sm:w-[74px]" />
          </div>
        ) : clanTag ? (
          <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-none border border-[#28ee90] bg-[radial-gradient(circle_at_35%_30%,#314a25_0%,#111710_74%)] font-mono text-[20px] font-black text-[#dfff9c] sm:h-[88px] sm:w-[88px] sm:text-[24px]">
            {clanTag}
          </div>
        ) : showFallbackAvatar ? (
          <AvatarWithFrame
            src={avatarSrc || heroIcon}
            alt=""
            frameId={avatarFrameId}
            showFrame={Boolean(avatarFrameId)}
            className="h-[74px] w-[74px] shrink-0 sm:h-[88px] sm:w-[88px]"
            roundedClassName="rounded-none"
            paddingClassName="p-[2px]"
          />
        ) : null
        }
      </div>
      <MarkerFrame variant="transparent" showBorder={false} className={`relative w-full max-w-[96px] overflow-hidden sm:max-w-[118px] ${toneStyle.cardClass}`} innerClassName={`relative flex flex-col items-center justify-center px-1.5 sm:px-2 ${heightClass}`}>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            animate={{ x: ['-120%', '120%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            style={{
              background: toneStyle.shine,
            }}
          />
          <div className="flex items-center justify-center">
            <p className="font-mono text-[9px] font-black sm:text-[10px]">{t(`leaderboard_panel.top_${place}`)}</p>
          </div>
          <p data-keepcase="true" className="mt-2 w-full truncate px-1 text-center font-mono text-[9px] font-black sm:mt-3 sm:text-[11px]">{title || '-'}</p>
          <p className="mt-1 flex items-center justify-center gap-1 font-mono text-[8px] sm:text-[9px]">
            {subtitleIcon ? <img src={subtitleIcon} alt="" aria-hidden="true" className="h-3.5 w-3.5 object-contain" /> : null}
            <span>{subtitle || '-'}</span>
          </p>
      </MarkerFrame>
    </div>
  );
}

function buildPlayerRows(profile, fetchedPlayers) {
  const realPlayers = (fetchedPlayers || []).map((player, index) => ({
    ...player,
    id: player.id || player.created_by || `real-${index}`,
    username: player.username || player.nickname || `Player ${index + 1}`,
    avatar: getAvatarUrl(player),
    avatar_frame_id: getEquippedOwnedFrameId(player),
    unlocked_avatar_frames: getOwnedFrameIds(player),
    power: getPower(player),
  }));

  const byId = new Map(realPlayers.map((player) => [player.id, player]));
  if (profile?.id) {
    const selfRow = {
      ...profile,
      id: profile.id,
      username: profile.nickname || profile.username || 'local_tester',
      avatar: getAvatarUrl(profile),
      avatar_frame_id: getEquippedOwnedFrameId(profile),
      unlocked_avatar_frames: getOwnedFrameIds(profile),
      clan_name: profile.clan_name || '',
      power: getPower(profile),
    };
    if (byId.has(profile.id)) {
      const index = realPlayers.findIndex((player) => player.id === profile.id);
      realPlayers[index] = { ...realPlayers[index], ...selfRow };
    }
  }


  return realPlayers
    .sort((a, b) => {
      const diff = getPower(b) - getPower(a);
      if (diff !== 0) return diff;
      return String(a.id || '').localeCompare(String(b.id || ''));
    })
    .slice(0, 100);
}

function buildClanRows(profile, players, clanRecords = []) {
  const recordsByKey = new Map((clanRecords || []).flatMap((record) => [[String(record.id || '').toLowerCase(), record], [String(record.name || '').toLowerCase(), record]]));
  const clans = new Map();

  for (const record of clanRecords || []) {
    if (!record?.name) continue;
    clans.set(record.name, {
      name: record.name,
      power: Number(record.power || 0),
      members: Number(record.members || 0),
      logoId: record.logo_id || null,
    });
  }

  // Older API responses may not include clan aggregates; use the player list as fallback.
  if (!clans.size) {
    for (const player of players) {
      const name = player.clan_name;
      if (!name) continue;
      const current = clans.get(name) || { name, power: 0, members: 0, logoId: player?.clan_logo_id || null };
      current.power += getPower(player);
      current.members += 1;
      if (!current.logoId && player?.clan_logo_id) current.logoId = player.clan_logo_id;
      clans.set(name, current);
    }
  }

  if (profile?.clan_name && !clans.has(profile.clan_name)) {
    clans.set(profile.clan_name, { name: profile.clan_name, power: getPower(profile), members: 1, logoId: profile?.clan_logo_id || null });
  }

  return [...clans.values()]
    .map((clan) => ({
      ...clan,
      clanLevel: Math.min(...['damage', 'donations', 'helper', 'quests'].map((id) => Number(recordsByKey.get(String(clan.name || '').toLowerCase())?.achievements?.[id]?.level || 0))),
      raidHeaderTheme: recordsByKey.get(String(clan.name || '').toLowerCase())?.raid_header_theme || null,
      tag: clan.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      logoId: recordsByKey.get(String(clan.name || '').toLowerCase())?.logo_id || clan.logoId || null,
    }))
    .sort((a, b) => b.power - a.power)
    .slice(0, 100);
}

function buildReferralRows(profile, players) {
  const rows = [...players]
    .map((player, index) => ({
      ...player,
      id: player.id || `ref-${index}`,
      username: player.username || player.nickname || `Player ${index + 1}`,
      avatar: getAvatarUrl(player),
      avatar_frame_id: getEquippedOwnedFrameId(player),
      clan_name: player.clan_name || '',
      referralsCount: getReferralCount(player),
    }))
    .sort((a, b) => {
      const diff = getReferralCount(b) - getReferralCount(a);
      if (diff !== 0) return diff;
      return getPower(b) - getPower(a);
    });

  if (profile?.id) {
    const selfRow = {
      ...profile,
      id: profile.id,
      username: profile.nickname || profile.username || 'local_tester',
      avatar: getAvatarUrl(profile),
      avatar_frame_id: getEquippedOwnedFrameId(profile),
      clan_name: profile.clan_name || '',
      referralsCount: getReferralCount(profile),
    };
    const index = rows.findIndex((player) => player.id === profile.id);
    if (index >= 0) {
      rows[index] = { ...rows[index], ...selfRow };
    }
  }

  return rows.filter(player => getReferralCount(player) > 0).sort((a, b) => {
    const diff = getReferralCount(b) - getReferralCount(a);
    if (diff !== 0) return diff;
    return getPower(b) - getPower(a);
  }).slice(0, 100);
}

export default function LeaderboardPanel({ profile, viewStateRef, onOpenPlayerProfile, onClose }) {
  const { t, i18n } = useTranslation();
  const fallbackViewState = useRef({ activeTab: 'players', scroll: {} });
  const savedView = viewStateRef || fallbackViewState;
  const listRef = useRef(null);
  const [activeTab, setActiveTab] = useState(() => savedView.current.activeTab || 'players');
  const selectTab = (tab) => {
    savedView.current.activeTab = tab;
    setActiveTab(tab);
  };
  const [openedClan, setOpenedClan] = useState(null);
  const sort = activeTab === 'referrals' ? '-referrals' : '-stat_strength';
  const rowsQuery = useQuery({
    queryKey: ['leaderboard-rows', profile?.id, activeTab, profile?.clan_id, profile?.clan_name],
    queryFn: () => activeTab === 'clans' ? listClans() : listTopPlayers(sort, 100),
    staleTime: 30000,
    retry: 1,
  });
  const positionQuery = useQuery({
    queryKey: ['leaderboard-position', profile?.id, sort],
    queryFn: () => getMyLeaderboardPosition(sort),
    enabled: activeTab !== 'clans',
    staleTime: 30000,
    retry: 1,
  });
  const players = activeTab === 'clans' ? [] : rowsQuery.data || [];
  const clanRecords = activeTab === 'clans' ? rowsQuery.data || [] : [];
  const ownPosition = positionQuery.data || null;
  const loading = rowsQuery.isPending;
  const positionLoading = activeTab !== 'clans' && positionQuery.isPending;

  const playerRows = useMemo(() => buildPlayerRows(profile, players), [profile, players]);
  const clanRows = useMemo(() => buildClanRows(profile, playerRows, clanRecords), [profile, playerRows, clanRecords]);
  const referralRows = useMemo(() => buildReferralRows(profile, playerRows), [profile, playerRows]);
  const lang = (i18n?.language || 'en').startsWith('ru') ? 'ru' : (i18n?.language || 'en').startsWith('en') ? 'en' : 'en';
  const myId = profile?.id;
  const myEmail = profile?.created_by;
  const activeRows = activeTab === 'players' ? playerRows : activeTab === 'clans' ? clanRows : referralRows;
  const hasPodium = activeRows.length >= 1;
  const podiumOffset = 0;
  const rows = activeRows;

  // The panel unmounts while visiting a player; restore after cached/fetched rows render.
  useLayoutEffect(() => {
    if (!loading && listRef.current) {
      listRef.current.scrollTop = savedView.current.scroll[activeTab] || 0;
    }
  }, [activeTab, loading, savedView]);

  return (
    <div className="leaderboard-page trophy-ranking-background flex h-full min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden bg-cover bg-center bg-no-repeat">
      <Frame className="leaderboard-panel flex h-full min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden p-2 sm:p-3">
        <div className="leaderboard-tabs mb-2 grid h-10 w-full min-w-0 shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px] gap-1 sm:h-12">
          <TabButton active={activeTab === 'players'} label={t('leaderboard_panel.tab_players')} onClick={() => selectTab('players')} />
          <TabButton active={activeTab === 'clans'} label={t('leaderboard_panel.tab_clans')} onClick={() => selectTab('clans')} />
          <TabButton active={activeTab === 'referrals'} label={t('leaderboard_panel.tab_referrals')} onClick={() => selectTab('referrals')} />
          <button
            type="button"
            onClick={onClose}
            className="flex h-full w-10 shrink-0 items-center justify-center rounded-none bg-transparent text-[#c7d5be] transition hover:bg-white/[0.04] hover:text-[#eaffcf] sm:w-12"
            aria-label={translateUiText("Закрити топ")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center py-4">
              <CombatLoader/>
            </div>
          ) : (
            <>
              {hasPodium ? (
                <div className="leaderboard-top mb-2 shrink-0 overflow-hidden rounded-none bg-[#0b100a]/70 px-1 py-2 sm:px-2">
                  <LeaderboardPodium
                    onOpenPlayerProfile={onOpenPlayerProfile}
                    rows={
                      activeTab === 'players'
                        ? playerRows.map((player) => ({
                            title: player.username || player.nickname,
                            titlePlayer: player,
                            subtitle: player.clan_name || t('leaderboard_panel.no_clan'),
                            mediaKind: 'avatar',
                            mediaSrc: getAvatarUrl(player) || heroIcon,
                            mediaFrameId: getEquippedOwnedFrameId(player),
                            onClick: () => onOpenPlayerProfile?.(player),
                            value: getPower(player),
                            valueIcon: getResourceIcon('strength'),
                          }))
                        : activeTab === 'clans'
                          ? clanRows.map((clan) => ({
                              title: clan.name,
                              subtitle: `LVL ${clan.clanLevel || 0}`,
                              mediaKind: clan.logoId ? 'logo' : 'tag',
                              mediaSrc: clan.logoId ? GUILD_LOGO_BY_ID[clan.logoId] || DEFAULT_GUILD_LOGO : null,
                              mediaText: clan.tag,
                              onClick: () => setOpenedClan(clan),
                              value: clan.power,
                              valueIcon: getResourceIcon('strength'),
                            }))
                          : referralRows.map((player) => ({
                              title: player.username || player.nickname,
                              subtitle: player.clan_name || t('leaderboard_panel.no_clan'),
                              mediaKind: 'avatar',
                              mediaSrc: getAvatarUrl(player) || heroIcon,
                              mediaFrameId: getEquippedOwnedFrameId(player),
                              onClick: () => onOpenPlayerProfile?.(player),
                              value: getReferralCount(player),
                              valueIcon: friendsIcon,
                            }))
                    }
                    getRowLabel={(place) => t(`leaderboard_panel.top_${place}`)}
                    getRowValue={(row) => row?.value}
                    getRowValueIcon={(row) => row?.valueIcon}
                  />
                </div>
              ) : null}
              <div ref={listRef} onScroll={(event) => { savedView.current.scroll[activeTab] = event.currentTarget.scrollTop; }} className="leaderboard-list-wrap players-scroll h-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y pb-4">
                <div className="space-y-1.5">
                    {activeTab === 'players' && rows.length
                      ? rows.map((player, index) => (
                          <PlayerRow
                            key={`${player.id}-${index}`}
                            player={player}
                            rank={index + 1 + podiumOffset}
                            isMe={Boolean((myId && player.id === myId) || (myEmail && player.created_by === myEmail))}
                            onOpenPlayerProfile={onOpenPlayerProfile}
                            t={t}
                            lang={lang}
                          />
                        ))
                      : null}
                    {activeTab === 'clans' && rows.length
                      ? rows.map((clan, index) => <ClanRow key={`${clan.name}-${index}`} clan={clan} rank={index + 1 + podiumOffset} t={t} onOpen={setOpenedClan} />)
                      : null}
                    {activeTab === 'referrals' && rows.length
                      ? rows.map((player, index) => (
                          <ReferralRow
                            key={`${player.id}-${index}`}
                            player={player}
                            rank={index + 1 + podiumOffset}
                            isMe={Boolean((myId && player.id === myId) || (myEmail && player.created_by === myEmail))}
                            onOpenPlayerProfile={onOpenPlayerProfile}
                            t={t}
                          />
                        ))
                      : null}
                  {activeTab === 'players' && !playerRows.length ? <EmptyRows label={t('leaderboard_panel.empty_players')} /> : null}
                  {activeTab === 'clans' && !clanRows.length ? <EmptyRows label={t('leaderboard_panel.empty_clans')} /> : null}
                    {activeTab === 'referrals' && !referralRows.length ? <EmptyRows label={t('leaderboard_panel.empty_referrals')} /> : null}
                </div>
              </div>
            </>
          )}
        </div>
        {activeTab !== 'clans' ? <PositionDock>
          {positionLoading ? <div className="flex h-16 items-center justify-center"><CombatLoader compact/></div> : ownPosition?.rank ? activeTab === 'referrals'
            ? <ReferralRow player={{...ownPosition.player, username:ownPosition.player.nickname || ownPosition.player.username}} rank={ownPosition.rank} isMe onOpenPlayerProfile={onOpenPlayerProfile} t={t} />
            : <PlayerRow player={{...ownPosition.player, username:ownPosition.player.nickname || ownPosition.player.username}} rank={ownPosition.rank} isMe onOpenPlayerProfile={onOpenPlayerProfile} t={t} lang={lang} />
            : <p className="py-3 font-mono text-xs text-[#a6b29a]">{profile?.language === 'ru' ? 'Позиция недоступна' : profile?.language === 'en' ? 'Position unavailable' : 'Позиція недоступна'}</p>}
        </PositionDock> : null}
      </Frame>
      {openedClan ? <ClanPreviewModal clan={openedClan} profile={profile} onClose={() => setOpenedClan(null)} onOpenPlayerProfile={onOpenPlayerProfile} /> : null}
    </div>
  );
}

export function warmFirstFrame() {
  return warmFirstFrameImages([heroIcon, bronzeMedal, silverMedal, goldMedal]);
}
