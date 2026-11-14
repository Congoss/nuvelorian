import { translateUiText } from '@/lib/uiTextTranslations';
import GameWindow from './GameWindow';
import { getClanJoinState } from '@/lib/clanJoinState';
import { getClanDonationState } from '@/lib/clanDonationState';
import { localizeClanActivityText } from '@/lib/clanActivityText';
import { localizeClanDescription } from '@/lib/clanDescription';
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  LogOut,
  MessageCircle,
  Megaphone,
  Settings,
  Swords,
  Users,
  X,
} from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import MarkerFrame from "@/components/game/MarkerFrame";
import {
  sendChatMessage,
  createClan as createClanRequest,
  createClanEnergyRequest,
  donateToClan,
  getClan,
  getClanManagement,
  helpClanEnergyRequest,
  helpClanQuest,
  joinClan as joinClanRequest,
  leaveClan as leaveClanRequest,
  listClanEnergyRequests,
  listClanMembers,
  listClanQuests,
  listClans,
  listRaidBossLeaderboard,
  manageClan,
  startClanQuest,
} from "@/services/gameApi";
import GameTextureButton from "./GameTextureButton";
import dmgBossIcon from "@/assets/ui/dmg-boss.png";
import heroIcon from "@/assets/optimized/nav-hero.webp";
import AvatarWithFrame from "@/components/game/AvatarWithFrame";
import {
  LeaderboardRow,
  LeaderboardPodium,
  LeaderboardValuePill,
} from "@/components/game/LeaderboardShared";
import { getCARankProgress, getCARankIcon } from "@/lib/caRanks";
import { getResourceIcon } from "@/lib/resourceIcons";
import { DEFAULT_GUILD_LOGO, GUILD_LOGOS } from "@/lib/clanLogos";
import { CLAN_ACHIEVEMENT_CONFIG, CLAN_QUEST_DEFINITIONS } from "@/lib/clanAchievements";
import damageAchievement from "@/assets/clan-achievements/damage.webp";
import damageFlag from "@/assets/clan-achievements/damage-flag.webp";
import donationsAchievement from "@/assets/clan-achievements/donations.webp";
import donationsFlag from "@/assets/clan-achievements/donations-flag.webp";
import helperAchievement from "@/assets/clan-achievements/helper.webp";
import helperFlag from "@/assets/clan-achievements/helper-flag.webp";
import questsAchievement from "@/assets/clan-achievements/quests.webp";
import questsFlag from "@/assets/clan-achievements/quests-flag.webp";
import clanAchiv1 from "@/assets/clan-achievements/unlockable/clan-achiv1.png";
import clanAchiv2 from "@/assets/clan-achievements/unlockable/clan-achiv2.png";
import clanAchiv5 from "@/assets/clan-achievements/unlockable/clan-achiv5.png";
import clanAchiv6 from "@/assets/clan-achievements/unlockable/clan-achiv6.png";
import clanAchiv7 from "@/assets/clan-achievements/unlockable/clan-achiv7.png";
import clanAchiv9 from "@/assets/clan-achievements/unlockable/clan-achiv9.png";

const CLAN_SIGNS = [
  { id: "cn", label: "CN", badge: "C" },
  { id: "skull", label: "Skull", badge: "S" },
  { id: "atom", label: "Atom", badge: "A" },
  { id: "gear", label: "Gear", badge: "G" },
  { id: "hazard", label: "Hazard", badge: "H" },
];

function formatNumber(value) {
  return new Intl.NumberFormat("uk-UA").format(
    Math.max(0, Math.round(value || 0)),
  );
}

function getClanRoleKey(role) {
  const value = String(role || "").toLowerCase();
  if (
    value.includes("leader") ||
    value.includes("космобат") ||
    value.includes("глава")
  )
    return "leader";
  if (value.includes("deputy") || value.includes("супут")) return "deputy";
  if (value.includes("elder") || value.includes("космод")) return "elder";
  return "member";
}

function getClanRoleLabel(role, t) {
  return t(`clan_panel.role_${getClanRoleKey(role)}`);
}

const CLAN_RARITY_COLORS = {
  1: "#8D969D",
  2: "#4BA8C8",
  3: "#3478D4",
  4: "#416DFF",
  5: "#8B4DD1",
  6: "#B94CDD",
  7: "#E9449B",
  8: "#E13B45",
  9: "#F6A52A",
  10: "#FFD347",
};

function ClanEmblem({ src, alt, level }) {
  const previousLevel = useRef(level);
  const [burst, setBurst] = useState(false);
  const color = CLAN_RARITY_COLORS[Math.max(1, Math.min(10, Number(level) || 1))];
  useEffect(() => {
    if (level > previousLevel.current) {
      setBurst(true);
      const timeout = setTimeout(() => setBurst(false), 1100);
      previousLevel.current = level;
      return () => clearTimeout(timeout);
    }
    previousLevel.current = level;
    return undefined;
  }, [level]);
  return (
    <div
      className={`clan-emblem-wrapper ${color ? "has-rarity" : ""} ${burst ? "clan-level-up-burst" : ""}`}
      style={{
        "--clan-rarity-color": color,
        "--clan-rarity-secondary": level === 10 ? "#F0445E" : "transparent",
        "--clan-emblem-mask": `url(\"${src}\")`,
      }}
    >
      <span aria-hidden="true" className="emblem-rarity-outline" />
      <span aria-hidden="true" className="emblem-rarity-glow" />
      <span aria-hidden="true" className="emblem-rarity-pulsar" />
      <img
        src={src}
        alt={alt}
        className="emblem-image h-[106px] w-[106px] object-contain sm:h-[118px] sm:w-[118px]"
      />
    </div>
  );
}

function getLeaderboardAvatarUrl(member) {
  return (
    member?.avatar ||
    member?.photoUrl ||
    member?.avatar_url ||
    member?.photo_url ||
    member?.profile_photo_url ||
    ""
  );
}

function getLeaderboardFrameId(member) {
  const frameId =
    member?.avatar_frame_id || member?.selected_avatar_frame || null;
  const ownedFrames = Array.isArray(member?.unlocked_avatar_frames)
    ? member.unlocked_avatar_frames
    : [];
  return frameId && ownedFrames.includes(frameId) ? frameId : null;
}

function Frame({ children, className = "" }) {
  return (
    <MarkerFrame
      className={className}
      innerClassName="relative z-10"
      variant="transparent"
    >
      {children}
    </MarkerFrame>
  );
}

function GreenButton({ label, small = false, onClick, disabled = false }) {
  return (
    <GameTextureButton
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${small ? "h-10 px-4" : "h-11 px-5"} ${
        disabled ? "opacity-55 grayscale" : ""
      }`}
    >
      <span className="relative z-10 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-[#18220d]">
        {label}
      </span>
    </GameTextureButton>
  );
}

function ClaimChip({ label, value, icon, textClassName = "text-[#161f0d]" }) {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[10px_8px_11px_7px] border border-[#6b5818] bg-[linear-gradient(180deg,#efc848_0%,#c79729_56%,#835f14_100%)] shadow-[inset_0_1px_rgba(255,247,170,0.38),inset_0_-2px_rgba(70,43,5,0.28)]">
      <div className="relative z-10 flex items-center gap-2 px-3 py-2">
        {icon ? (
          <img
            src={icon}
            alt=""
            aria-hidden="true"
            className="h-5 w-5 object-contain"
          />
        ) : null}
        <div className="min-w-0">
          <p
            className={`font-mono text-[8px] uppercase tracking-[0.16em] ${textClassName}`}
          >
            {label}
          </p>
          <p
            className={`truncate font-mono text-[12px] font-bold ${textClassName}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ClaimButton({
  label,
  tone = "yellow",
  onClick,
  disabled = false,
  className = "",
  textClassName = "text-[#161f0d]",
}) {
  return (
    <GameTextureButton
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      tone={tone}
      className={`${disabled ? "opacity-60 grayscale" : ""} ${className}`}
    >
      <span
        className={`relative z-10 flex h-full w-full items-center justify-center whitespace-nowrap px-3 text-center font-mono text-[11px] font-bold uppercase tracking-[0.08em] ${textClassName}`}
      >
        {label}
      </span>
    </GameTextureButton>
  );
}

function TopTabButton({ active, label, onClick }) {
  return (
    <GameTextureButton
      type="button"
      onClick={onClick}
      tone={active ? "yellow" : "gray"}
      className={`h-12 flex-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] ${
        active ? "text-[#2a240e]" : "text-[#131810]"
      }`}
    >
      <span className="relative z-10">{label}</span>
    </GameTextureButton>
  );
}

function ClanRewardAchievements({ clan }) {
  const achievements = [
    {
      id: "boss100",
      icon: clanAchiv2,
      label: "100 bosses",
      unlocked: clan.totalBossKills >= 100,
    },
    {
      id: "members25",
      icon: clanAchiv7,
      label: "25 players",
      unlocked: clan.members.length >= 25,
    },
    {
      id: "topWeek",
      icon: clanAchiv1,
      label: "Top 1 · week",
      unlocked: Boolean(clan.milestones?.topWeek),
    },
    {
      id: "raidTop",
      icon: clanAchiv6,
      label: "Raid top 1",
      unlocked: Boolean(clan.milestones?.raidTop),
    },
    {
      id: "topFive",
      icon: clanAchiv9,
      label: "5 in top 10",
      unlocked: Boolean(clan.milestones?.topFive),
    },
    {
      id: "members50",
      icon: clanAchiv5,
      label: "50 players",
      unlocked: Boolean(clan.milestones?.members50),
    },
  ];
  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked,
  );

  if (!unlockedAchievements.length) return null;

  return (
    <div className="mt-3 grid grid-cols-6 gap-1.5">
      {unlockedAchievements.map(({ id, icon, label }) => (
        <div
          key={id}
          title={label}
          className="flex min-w-0 flex-col items-center justify-center px-1 py-2"
        >
          <img
            src={icon}
            alt=""
            aria-hidden="true"
            className="h-9 w-9 object-contain"
          />
          <span className="mt-1 w-full truncate text-center font-mono text-[7px] font-black uppercase tracking-tight">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function AchievementBadge({ icon, flag, level, label }) {
  return (
    <div
      className="achievement-badge relative h-[82px] w-[62px] shrink-0 overflow-visible sm:h-[92px] sm:w-[70px]"
      aria-label={`${label}: ${level}`}
    >
      <img
        className="achievement-icon relative z-[2] block h-auto w-full"
        src={icon}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div className="achievement-flag absolute left-1/2 top-[62%] z-[3] w-[31%] -translate-x-1/2 overflow-hidden">
        <img
          className="achievement-flag-image relative z-[1] block h-auto w-full object-contain"
          src={flag}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className="achievement-level pointer-events-none absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-mono text-[9px] font-black leading-none text-[#fff5c9] [text-shadow:-1px_-1px_0_#211208,1px_-1px_0_#211208,-1px_1px_0_#211208,1px_1px_0_#211208] sm:text-[10px]">
          {level}
        </span>
      </div>
    </div>
  );
}

function ClanProgressAchievements({ clan, onSelect }) {
  const { t } = useTranslation();
  const achievements = [
    {
      id: "damage",
      icon: damageAchievement,
      flag: damageFlag,
      label: t("clan_panel.achievement_damage"),
      state: clan.achievements.damage,
      benefit: `+${clan.achievements.damage.benefit.poisonPct}% Poison`,
    },
    {
      id: "quests",
      icon: questsAchievement,
      flag: questsFlag,
      label: t("clan_panel.achievement_quests"),
      state: clan.achievements.quests,
      benefit: `Tier 1–${clan.achievements.quests.benefit.maxTier}`,
    },
    {
      id: "helper",
      icon: helperAchievement,
      flag: helperFlag,
      label: t("clan_panel.achievement_helper"),
      state: clan.achievements.helper,
      benefit: `${clan.achievements.helper.benefit.maxEnergyRequest} Energy`,
    },
    {
      id: "donations",
      icon: donationsAchievement,
      flag: donationsFlag,
      label: t("clan_panel.achievement_donations"),
      state: clan.achievements.donations,
      benefit: `${clan.achievements.donations.benefit.maxMembers} ${t("clan_panel.players")}`,
    },
  ];

  return (
    <div className="mt-2 grid grid-cols-4 gap-2">
      {achievements.map(({ id, icon, flag, label, state, benefit }) => {
        const value = Number(state.progress || 0);
        const goal = Number(state.nextThreshold || value || 1);
        const progress = state.maxed
          ? 100
          : Math.min(100, Math.round((value / goal) * 100));
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect?.(id)}
            title={`${label}: Lv.${state.level}. ${benefit}. ${value}/${goal}`}
            className="flex min-w-0 flex-col items-center bg-[#0b100a] px-1 py-1.5 text-center text-[#bdcf9e]"
          >
            <AchievementBadge
              icon={icon}
              flag={flag}
              level={state.level}
              label={label}
            />
            <span className="-mt-1 truncate font-mono text-[7px] font-black uppercase text-[#d9e8be]">
              {label}
            </span>
            <div className="mt-1 h-1 w-full overflow-hidden bg-[#202a1d]">
              <span
                className="block h-full bg-[#9bdb38]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ClanAchievementDetail({ clan, type, onClose }) {
  const { t } = useTranslation();
  const windowRoot = typeof document !== "undefined"
    ? document.getElementById("game-window-root")
    : null;
  const achievementConfig = CLAN_ACHIEVEMENT_CONFIG[type];
  const state = clan.achievements[type];
  const labels = {
    damage: t("clan_panel.achievement_damage"),
    quests: t("clan_panel.achievement_quests"),
    helper: t("clan_panel.achievement_helper"),
    donations: t("clan_panel.achievement_donations"),
  };
  const formatBenefit = (level) => {
    const benefit = CLAN_ACHIEVEMENT_CONFIG[type].benefit(level);
    if (type === "damage") return t("clan_panel.achievement_bonus_damage", { value: benefit.poisonPct });
    if (type === "quests") return t("clan_panel.achievement_bonus_quests", { value: benefit.maxTier });
    if (type === "helper") return t("clan_panel.achievement_bonus_helper", { value: benefit.maxEnergyRequest });
    return t("clan_panel.achievement_bonus_donations", { value: benefit.maxMembers });
  };
  const descriptions = {
    damage: t("clan_panel.achievement_how_damage"),
    quests: t("clan_panel.achievement_how_quests"),
    helper: t("clan_panel.achievement_how_helper"),
    donations: t("clan_panel.achievement_how_donations"),
  };
  const requirementLabels = {
    damage: t("clan_panel.achievement_requirement_damage"),
    quests: t("clan_panel.achievement_requirement_quests"),
    helper: t("clan_panel.achievement_requirement_helper"),
    donations: t("clan_panel.achievement_requirement_donations"),
  };
  const levelRows = achievementConfig.thresholds.map((threshold, index) => {
    const level = index + 1;
    const isReached = Number(state.progress || 0) >= threshold;
    return { level, threshold, isReached, bonus: formatBenefit(level) };
  });
  return createPortal(
    <div className={`${windowRoot ? "absolute" : "fixed"} inset-0 z-[99999] pointer-events-auto flex min-h-0 items-center justify-center overflow-hidden overscroll-contain bg-black/80 p-2`} onClick={onClose} style={{ touchAction: "none" }}>
      <section role="dialog" aria-modal="true" aria-label={labels[type]} onClick={(event) => event.stopPropagation()} className="flex h-full max-h-[760px] min-h-0 w-full max-w-[440px] flex-col overflow-hidden border-2 border-[#28ee90] bg-[#091008] p-3 shadow-[0_0_28px_rgba(40,238,144,0.18)]">
        <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 bg-[#091008]">
          <div className="flex min-w-0 items-center gap-2">
            <img src={{ damage: damageAchievement, quests: questsAchievement, helper: helperAchievement, donations: donationsAchievement }[type]} alt="" className="h-12 w-12 shrink-0 object-contain" />
            <div className="min-w-0">
              <h3 className="font-mono text-[14px] font-black uppercase text-[#f2ffd9]">{labels[type]}</h3>
              <p className="font-mono text-[10px] font-bold text-[#a9e968]">{t("clan_panel.achievement_current_level", { level: state.level })} · {formatBenefit(state.level)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t("clan_panel.close")} className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center text-3xl leading-none text-[#dfff9c]">×</button>
        </header>
        <div className="mt-2 min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-scroll overscroll-y-contain [scrollbar-width:thin]" style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain" }}>
        <div className="border border-[#45643d] bg-[#0d170d] p-2">
          <p className="font-mono text-[9px] font-black uppercase text-[#dfff9c]">{t("clan_panel.achievement_how_title")}</p>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-[#c8d8b5]">{descriptions[type]}</p>
          <p className="mt-1 font-mono text-[9px] font-bold leading-relaxed text-[#a9e968]">{t("clan_panel.achievement_clan_level_rule")}</p>
          <div className="mt-2 h-1.5 bg-[#202a1d]"><span className="block h-full bg-[#9bdb38]" style={{ width: `${state.maxed ? 100 : Math.min(100, Math.round((Number(state.progress || 0) / Math.max(1, Number(state.nextThreshold || 1))) * 100))}%` }} /></div>
          <p className="mt-1 font-mono text-[9px] text-[#bdcf9e]">{Number(state.progress || 0).toLocaleString()} / {Number(state.nextThreshold || 0).toLocaleString()} {requirementLabels[type]}</p>
        </div>
        <div className="mt-3">
          <div className="grid grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 border-b border-[#45643d] px-1 pb-1 font-mono text-[10px] font-black uppercase text-[#a9e968]">
            <span>{t("clan_panel.achievement_level_header")}</span><span>{t("clan_panel.achievement_requirement_header")}</span><span>{t("clan_panel.achievement_bonus_header")}</span>
          </div>
          {levelRows.map(({ level, threshold, isReached, bonus }) => (
            <div key={level} className={`grid grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 border-b border-[#283725] px-1 py-2 font-mono text-[11px] leading-snug ${level === state.level ? "bg-[#182616]" : ""}`}>
              <span className={isReached ? "font-black text-[#dfff9c]" : "text-[#84917d]"}>{level === state.level ? "▶ " : ""}{level}</span>
              <span className={isReached ? "text-[#e1ead4]" : "text-[#8d9785]"}>{Number(threshold).toLocaleString()}</span>
              <span className={isReached ? "text-[#cfff72]" : "text-[#8d9785]"}>{bonus}</span>
            </div>
          ))}
        </div>
        </div>
        <button type="button" onClick={onClose} className="mt-2 h-10 shrink-0 border border-[#759941] bg-[#172216] font-mono text-[10px] font-black uppercase text-[#e6ffd2]">{t("clan_panel.close")}</button>
      </section>
    </div>,
    windowRoot || document.body
  );
}

function formatCountdown(expiresAt, now = Date.now()) {
  const remaining = Math.max(0, Date.parse(expiresAt || "") - now);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatQuestRewards(reward = {}, t) {
  const poisons = [
    ["small", "S"],
    ["medium", "M"],
    ["large", "L"],
  ]
    .filter(([type]) => Number(reward.poisons?.[type] || 0) > 0)
    .map(([type, label]) => `${reward.poisons[type]}×${label}`);
  return [
    t("clan_panel.quest_reward", { tentacles: reward.tentacles || 0, xp: reward.xp || 0 }),
    ...poisons,
  ].join(" · ");
}

function formatQuestCondition(quest, t) {
  const target = Number(quest?.target || 0).toLocaleString();
  return t(`clan_panel.quest_condition.${quest?.type || "missions"}`, { target });
}

function ClanFeaturePanel({ clan, mode, onClose, onChanged }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [questOffers, setQuestOffers] = useState([]);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const loadInFlight = useRef(false);
  const clanId = clan.id || clan.name;
  const load = useCallback(async () => {
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    try {
      setError("");
      if (mode === "quests") {
        const result = await listClanQuests(clanId);
        setItems(Array.isArray(result) ? result : result?.quests || []);
        setQuestOffers(Array.isArray(result) ? [] : result?.offers || []);
      }
      if (mode === "helper") setItems(await listClanEnergyRequests(clanId));
    } catch (caught) {
      setError(translateUiText(caught?.message || "Помилка"));
    } finally {
      loadInFlight.current = false;
    }
  }, [clanId, mode]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (mode !== "quests") return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 5000);
    return () => clearInterval(timer);
  }, [load, mode]);
  useEffect(() => {
    if (mode !== "quests") return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [mode]);
  const act = async (action) => {
    try {
      setError("");
      await action();
      await load();
      await onChanged?.();
    } catch (caught) {
      setError(translateUiText(caught?.message || "Помилка"));
    }
  };
  if (mode === "donations")
    return (
      <div className="mt-2 border border-[#779b42] bg-[#0b100a] p-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] font-black uppercase text-[#fff0db]">
            {t("clan_panel.achievement_donations")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[#dfff9c]"
          >
            ×
          </button>
        </div>
        <p className="mt-1 font-mono text-[9px] text-[#bdcf9e]">
          {clan.achievements.donations.progress.toLocaleString()} /{" "}
          {clan.achievements.donations.nextThreshold.toLocaleString()} {t("resource_names.dm.short")}
        </p>
        {clan.donation ? (
          <p className="mt-1 font-mono text-[8px] text-[#a8d96b]">
            {t("clan_panel.your_contribution")}: {clan.donation.contribution.toLocaleString()} /{" "}
            {clan.donation.contribution_cap.toLocaleString()}
          </p>
        ) : null}
        {false ? (
          <p className="mt-2 font-mono text-[8px] text-[#f3d65a]">
            {t("clan_panel.donations_locked")} ·{" "}
            {new Date(clan.donation.available_at).toLocaleString()}
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[100, 500, 1000].map((amount) => (
              <ClaimButton
                key={amount}
                label={`+${amount}`}
                tone="yellow"
                className="h-8"
                onClick={() => act(() => donateToClan(clanId, amount))}
              />
            ))}
          </div>
        )}
        {error ? (
          <p className="mt-2 font-mono text-[8px] text-[#ff7770]">{error}</p>
        ) : null}
      </div>
    );
  if (mode === "helper")
    return (
      <div className="mt-2 border border-[#779b42] bg-[#0b100a] p-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] font-black uppercase text-[#fff0db]">
            {t("clan_panel.achievement_helper")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[#dfff9c]"
          >
            ×
          </button>
        </div>
        <ClaimButton
          label={`${t("clan_panel.request_energy")} ${clan.achievements.helper.benefit.maxEnergyRequest} ${t("clan_panel.energy")}`}
          tone="yellow"
          className="mt-2 h-8 w-full"
          onClick={() =>
            act(() =>
              createClanEnergyRequest(
                clanId,
                clan.achievements.helper.benefit.maxEnergyRequest,
              ),
            )
          }
        />
        <div className="mt-2 space-y-1">
          {items.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2 border border-[#35452e] p-1.5"
            >
              <span className="min-w-0 flex-1 font-mono text-[9px] text-[#e9f4d4]">
                {entry.amount_helped}/{entry.amount_requested}{" "}
                {t("clan_panel.energy")}
              </span>
              <ClaimButton
                label={t("clan_panel.help")}
                tone="yellow"
                className="h-7"
                onClick={() =>
                  act(() => helpClanEnergyRequest(clanId, entry.id))
                }
              />
            </div>
          ))}
        </div>
        {error ? (
          <p className="mt-2 font-mono text-[8px] text-[#ff7770]">{error}</p>
        ) : null}
      </div>
    );
  return (
    <div className="mt-2 border border-[#779b42] bg-[#0b100a] p-2">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-black uppercase text-[#fff0db]">
          {t("clan_panel.achievement_quests")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[#dfff9c]"
        >
          ×
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {/** A member may work on one clan quest at a time. */}
        {questOffers.map((offer) => {
          const quest = CLAN_QUEST_DEFINITIONS.find(
            (definition) => definition.id === offer.definition_id,
          );
          if (!quest) return null;
          const activeQuest = items.find(
            (entry) =>
              entry.status === "ACTIVE" &&
              String(entry.offer_id) === String(offer.id) &&
              String(entry.owner_id) === String(clan.viewerId),
          );
          const activeOwnQuest = items.find(
            (entry) =>
              entry.status === "ACTIVE" &&
              String(entry.owner_id) === String(clan.viewerId),
          );
          const progress = activeQuest
            ? Math.min(
                100,
                Math.round(
                  (Number(activeQuest.progress || 0) /
                    Math.max(1, Number(activeQuest.target || 1))) *
                    100,
                ),
              )
            : 0;
          const unlocked = Boolean(activeQuest || !activeOwnQuest);
          const cooldownUntil = offer.available_at;
          const onCooldown =
            !activeQuest && Date.parse(cooldownUntil || "") > now;
          return (
            <div
              key={offer.id}
              className={`flex items-center gap-2 rounded-[11px] border p-2.5 shadow-[0_5px_14px_rgba(0,0,0,0.08)] ${activeQuest ? "border-[#28ee90] bg-[#20271d] text-[#e2ebd8]" : unlocked ? "border-[#28ee90] bg-[#20271d] text-[#e2ebd8]" : "border-[#40503b] bg-[#1a2118] text-[#71806c]"}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border ${activeQuest || unlocked ? "border-[#526446] bg-[#35402d] text-[#91ba75]" : "border-[#596554] bg-[#283026]"}`}
              >
                <Swords className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[11px] font-black">
                      T{quest.tier} · {formatQuestCondition(quest, t)}
                    </p>
                    <p
                      className={`mt-0.5 truncate font-mono text-[8px] font-black ${activeQuest || unlocked ? "text-[#91ba75]" : "text-[#71806c]"}`}
                    >
                      {activeQuest
                        ? `${activeQuest.progress.toLocaleString()}/${activeQuest.target.toLocaleString()}`
                        : formatQuestRewards(quest.reward, t)}
                    </p>
                  </div>
                  {activeQuest ? (
                    <span className="shrink-0 font-mono text-[9px] font-black text-[#d6ad75]">
                      {formatCountdown(activeQuest.expires_at, now)}
                    </span>
                  ) : null}
                </div>
                <div
                  className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${activeQuest || unlocked ? "bg-[#35402d]" : "bg-[#2f3a2d]"}`}
                >
                  <span
                    className={`block h-full rounded-full ${activeQuest ? "bg-[#53d898]" : "bg-[#6fbd65]"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {activeQuest ? (
                <ClaimButton label={t("clan_panel.in_progress")} tone="green" disabled className="h-8 min-w-[76px]" />
              ) : (
                <ClaimButton
                  label={
                    onCooldown
                      ? formatCountdown(cooldownUntil, now)
                      : unlocked
                        ? t("clan_panel.go")
                        : t("clan_panel.locked")
                  }
                  tone={unlocked && !onCooldown ? "yellow" : "gray"}
                  disabled={!unlocked || onCooldown}
                  className="h-8 min-w-[76px]"
                  onClick={() => act(() => startClanQuest(clanId, offer.id))}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 space-y-1">
        {items
          .filter(
            (quest) =>
              quest.status === "ACTIVE" &&
              quest.help_enabled &&
              String(quest.owner_id) !== String(clan.viewerId),
          )
          .map((quest) => (
            <div
              key={quest.id}
              className="flex items-center gap-2 border border-[#497238] bg-[#10170d] p-1.5"
            >
              <span className="min-w-0 flex-1 font-mono text-[8px] text-[#a8d96b]">
                T{quest.tier} · {quest.progress}/{quest.target} ·{" "}
                {formatCountdown(quest.expires_at, now)}
              </span>
              <ClaimButton
                label={t("clan_panel.help")}
                tone="yellow"
                className="h-7"
                onClick={() => act(() => helpClanQuest(clanId, quest.id))}
              />
            </div>
          ))}
      </div>
      {error ? (
        <p className="mt-2 font-mono text-[8px] text-[#ff7770]">{error}</p>
      ) : null}
    </div>
  );
}

function MemberAvatar({ member, premium = false }) {
  return (
    <div
      className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-none border bg-[linear-gradient(180deg,#263a19_0%,#10170d_100%)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.45)] ${
        premium
          ? "border-[#28ee90] shadow-[0_0_12px_rgba(255,214,92,0.32)]"
          : "border-[#28ee90]"
      }`}
    >
      <AvatarWithFrame
        src={member.avatar || member.photoUrl || member.photo_url || heroIcon}
        alt=""
        frameId={member.avatar_frame_id || "frame1"}
        className="absolute inset-0"
        roundedClassName="rounded-none"
        paddingClassName="p-[3px]"
        imageClassName="scale-[1.08]"
      />
    </div>
  );
}

function MemberPowerChip({ value }) {
  return (
    <div className="relative h-[38px] min-w-[86px] overflow-hidden rounded-none border border-[#28ee90] bg-[linear-gradient(180deg,#1d2a14_0%,#10170d_52%,#070a06_100%)] px-2">
      <div className="absolute inset-[2px] rounded-none bg-[linear-gradient(180deg,rgba(119,184,62,0.22)_0%,rgba(22,34,15,0.16)_48%,rgba(0,0,0,0.24)_100%)]" />
      <img
        src={getResourceIcon("strength")}
        alt=""
        aria-hidden="true"
        className="absolute left-[4px] top-[5px] h-[29px] w-[29px] object-contain"
      />
      <span className="absolute inset-y-0 left-[36px] right-[7px] flex items-center justify-end font-sans text-[12px] font-black leading-none text-[#fff5ba] [text-shadow:0_2px_0_rgba(0,0,0,0.85)]">
        {formatNumber(value)}
      </span>
    </div>
  );
}

function buildClanProfile(
  profile,
  t,
  clanMembers = [],
  raidLeaderboard = [],
  clanRecord = null,
) {
  const playerPower =
    profile?.stat_strength || profile?.power || profile?.attack_power || 0;
  const playerName = profile?.nickname || profile?.username || "local_tester";
  const playerLevel = profile?.level || 1;
  const hasClan = Boolean(profile?.clan_name || profile?.clan_id);
  const fallbackMember = {
    id: profile?.id || "self",
    name: playerName,
    role: hasClan ? t("clan_panel.role_fighter") : t("clan_panel.role_solo"),
    clanLabel: hasClan
      ? getClanRoleLabel(profile?.clan_role, t)
      : t("clan_panel.no_clan_name"),
    power: playerPower,
    avatar: profile?.avatar || profile?.photoUrl || "",
    avatar_frame_id: profile?.avatar_frame_id || "frame1",
    battle_pass_view: profile?.battle_pass_view,
    unlocked_avatar_frames: profile?.unlocked_avatar_frames || [],
    last_login_date: profile?.last_login_date || "",
  };
  const members = clanMembers.length
    ? clanMembers.map((member) => ({
        id: member.id,
        name: member.nickname || member.username || "player",
        role: member.clan_role || t("clan_panel.role_fighter"),
        clanLabel: getClanRoleLabel(member.clan_role, t),
        power: member.stat_strength || member.power || member.attack_power || 0,
        avatar: member.avatar || member.photoUrl || member.photo_url || "",
        avatar_frame_id: member.avatar_frame_id || "frame1",
        battle_pass_view: member.battle_pass_view,
        unlocked_avatar_frames: member.unlocked_avatar_frames || [],
        last_login_date: member.last_login_date || "",
      }))
    : [fallbackMember];
  const today = new Date().toISOString().slice(0, 10);
  const activeMemberCount = members.filter(
    (member) => String(member.last_login_date || "").slice(0, 10) === today,
  ).length;
  const memberIds = new Set(members.map((member) => String(member.id)));
  const lastRaidDamage = raidLeaderboard.reduce(
    (total, entry) =>
      total +
      (memberIds.has(String(entry.player_id)) ? Number(entry.damage || 0) : 0),
    0,
  );

  return {
    id: clanRecord?.id || profile?.clan_id || profile?.clan_name || "",
    viewerId: profile?.id || "self",
    playerLevel,
    viewerRole: String(profile?.clan_role || "")
      .toLowerCase()
      .includes("leader")
      ? "leader"
      : String(profile?.clan_role || "")
            .toLowerCase()
            .includes("deputy")
        ? "deputy"
        : String(profile?.clan_role || "")
              .toLowerCase()
              .includes("elder")
          ? "elder"
          : "member",
    name: profile?.clan_name || t("clan_panel.no_clan_name"),
    logoId: profile?.clan_logo_id || "nuvelor01",
    sign: CLAN_SIGNS[playerLevel % CLAN_SIGNS.length],
    trophy: profile?.clan_trophies || 0,
    clanPower: members.reduce((sum, member) => sum + member.power, 0),
    damage24h: profile?.boss_damage_today || 0,
    type: hasClan
      ? t("clan_panel.clan_type_request")
      : t("clan_panel.not_created"),
    memberLimit: clanRecord?.max_members || 25,
    achievements: clanRecord?.achievements || {
      damage: {
        level: 0,
        progress: 0,
        nextThreshold: 100000,
        maxed: false,
        benefit: { poisonPct: 0 },
        nextBenefit: { poisonPct: 1 },
      },
      quests: {
        level: 0,
        progress: 0,
        nextThreshold: 5,
        maxed: false,
        benefit: { maxTier: 1 },
        nextBenefit: { maxTier: 1 },
      },
      helper: {
        level: 0,
        progress: 0,
        nextThreshold: 10,
        maxed: false,
        benefit: { maxEnergyRequest: 50 },
        nextBenefit: { maxEnergyRequest: 50 },
      },
      donations: {
        level: 0,
        progress: 0,
        nextThreshold: 25000,
        maxed: false,
        benefit: { maxMembers: 25 },
        nextBenefit: { maxMembers: 30 },
      },
    },
    donation: clanRecord?.donation || getClanDonationState(profile, clanRecord),
    questCooldowns: clanRecord?.quest_cooldowns || {},
    location: profile?.active_location || t("clan_panel.start_location"),
    description: hasClan
      ? profile?.clan_description || t("clan_panel.clan_description_default")
      : t("clan_panel.clan_description_guest"),
    hasClan,
    members,
    activeMemberCount,
    lastRaidDamage,
    playerTentacles: Number(profile?.tentacles || 0),
    totalBossKills: members.reduce(
      (sum, member) => sum + Number(member.boss_kills || 0),
      0,
    ),
    milestones: clanRecord?.milestone_achievements || {},
    pinnedAnnouncement: clanRecord?.pinned_announcement || null,
  };
}

function buildClanRows(players = [], t) {
  if (players.every((clan) => clan?.achievements)) {
    return players
      .map((clan) => ({
        id: clan.id,
        name: clan.name,
        join_type: clan.join_type || "open",
        min_level: Number(clan.min_level || 1),
        logoId: clan.logo_id || "nuvelor01",
        description:
          clan.description || t("clan_panel.clan_row_description_default"),
        members: Number(clan.members || 0),
        memberLimit: Number(clan.max_members || 25),
        power: Number(clan.power || 0),
        trophies: 0,
        achievements: clan.achievements,
      }))
      .sort((a, b) => b.power - a.power)
      .slice(0, 50);
  }
  const clans = new Map();
  for (const player of players) {
    const clanName = player?.clan_name?.trim();
    if (!clanName) continue;
    const current = clans.get(clanName) || {
      id: player.clan_id || clanName.toLowerCase().replace(/\s+/g, "-"),
      name: clanName,
      logoId: player.clan_logo_id || "nuvelor01",
      description:
        player.clan_description || t("clan_panel.clan_row_description_default"),
      members: 0,
      power: 0,
      trophies: 0,
    };
    current.members += 1;
    current.power +=
      player?.stat_strength || player?.power || player?.attack_power || 0;
    current.trophies = Math.max(current.trophies, player?.clan_trophies || 0);
    clans.set(clanName, current);
  }
  return [...clans.values()].sort((a, b) => b.power - a.power).slice(0, 50);
}

function ClanLobbyRow({ clan, onJoin, profile, joiningClanId, joinFeedback }) {
  const language = profile?.language || 'uk';
  const state = getClanJoinState(profile, clan, language);
  const feedback = joinFeedback?.clanId === clan.id ? joinFeedback : null;
  const requested = feedback?.requested;
  const levelLocked = Number(profile?.level || 1) < Number(clan.min_level || 1);
  const full = clan.members >= (clan.memberLimit || 25);
  const label = requested ? (language === 'ru' ? 'ЗАЯВКА ОТПРАВЛЕНА' : language === 'en' ? 'APPLIED' : 'ЗАЯВУ НАДІСЛАНО')
    : levelLocked ? 'LVL ' + clan.min_level
    : full ? (language === 'ru' ? 'КЛАН ПОЛОН' : language === 'en' ? 'CLAN FULL' : 'КЛАН ПОВНИЙ')
    : joiningClanId === clan.id ? '…' : state.label;
  return (
    <div className="border border-[#28ee90] bg-[#0f130f] px-3 py-3">
      <div className="flex w-full items-center gap-2">
        <img src={GUILD_LOGOS.find(logo => logo.id === clan.logoId)?.src || DEFAULT_GUILD_LOGO} alt="" className="h-11 w-11 shrink-0 object-contain" />
        <strong className="min-w-0 flex-1 break-words font-mono text-[13px] text-[#fff0db]">{clan.name}</strong>
        <GreenButton label={label} small disabled={state.disabled || levelLocked || full || Boolean(joiningClanId) || requested} onClick={() => onJoin?.(clan)} />
      </div>
      {feedback?.message ? <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'mt-2 font-mono text-[11px] text-[#ffb3a9]' : 'mt-2 font-mono text-[11px] text-[#b9d58d]'}>{feedback.message}</p> : null}
    </div>
  );
}

function ClanLobbyView({ clans, loading, onCreateClan, onJoinClan, profile, joiningClanId, joinFeedback }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2.5">
      <Frame className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#87a55f]">
              {t("clan_panel.open_clans_title")}
            </p>
            <h3 className="font-mono text-[18px] font-bold text-[#fff0db]">
              {t("clan_panel.available_now")}
            </h3>
          </div>
          <div className="px-1 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#d8f67a]">
            {clans.length} rows
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#b9ff6b]" />
          </div>
        ) : clans.length ? (
          <div className="mt-3 space-y-2">
            <LeaderboardPodium
              rows={clans.map((clan) => ({
                title: clan.name,
                subtitle: `${clan.members}/${clan.memberLimit || 25} ${t("clan_panel.players").toLowerCase()}`,
                mediaKind: clan.logoId ? "logo" : "tag",
                mediaSrc: clan.logoId
                  ? GUILD_LOGOS.find((logo) => logo.id === clan.logoId)?.src ||
                    DEFAULT_GUILD_LOGO
                  : null,
                mediaText: clan.logoId
                  ? ""
                  : clan.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase(),
                value: clan.power,
                valueIcon: getResourceIcon("strength"),
              }))}
              getRowLabel={(place) => t("clan_panel.top", { place })}
              getRowValue={(row) => row?.value}
              getRowValueIcon={(row) => row?.valueIcon}
            />
            {clans.map((clan) => (
              <ClanLobbyRow key={clan.id} clan={clan} onJoin={onJoinClan} profile={profile} joiningClanId={joiningClanId} joinFeedback={joinFeedback} />
            ))}
          </div>
        ) : (
          <div className="mt-3 flex min-h-[180px] items-center justify-center px-4 text-center">
            <div>
              <Users className="mx-auto h-8 w-8 text-[#9db57a]" />
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-[#9db57a]">
                {t("clan_panel.no_real_clans_hint")}
              </p>
            </div>
          </div>
        )}
      </Frame>
    </div>
  );
}

const ROLE_UI = {
  leader: ["Космобатя", "#f2c84b"],
  deputy: ["Супутник", "#be72ff"],
  elder: ["Космодід", "#42d8ce"],
  member: ["Стажер", "#9aa09a"],
};


function ClanManagementModal({ clanId, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("members");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [description, setDescription] = useState("");
  const [mailTitle, setMailTitle] = useState("");
  const [mailText, setMailText] = useState("");
  const [transferMemberId, setTransferMemberId] = useState("");
  const load = useCallback(async () => {
    try {
      const next = await getClanManagement(clanId);
      setData(next);
      setDescription(localizeClanDescription(next?.clan?.description, t));
      setError("");
    } catch (caught) {
      setError(caught?.message || "No permission");
    }
  }, [clanId, t]);
  useEffect(() => {
    load();
  }, [load]);
  const act = async (action, payload = {}) => {
    setBusy(true);
    setError("");
    try {
      await manageClan(clanId, action, payload);
      if (action === "transfer" || action === "dissolve") {
        onClose?.();
        await onChanged?.();
        return;
      }
      await load();
      await onChanged?.();
    } catch (caught) {
      setError(translateUiText(caught?.message || "Помилка"));
    } finally {
      setBusy(false);
    }
  };
  const role = data?.role;
  const canLeader = role === "leader";
  const memberName = (member) =>
    member?.nickname || member?.username || "player";
  const transferCandidates = (data?.members || []).filter(member => String(member.id) !== String(data?.clan?.owner_id) && member.clan_role !== "leader");
  const transferMember = transferCandidates.find(member => String(member.id) === transferMemberId);
  const managementLanguage = i18n.language;
  const transferPlaceholder = managementLanguage === "ru" ? "Выберите нового лидера" : managementLanguage === "en" ? "Choose a new leader" : "Виберіть нового лідера";
  return (
    <GameWindow scroll={false} className="bg-[#091008]">
      <div className="mx-auto h-full w-full max-w-[520px] touch-pan-y overflow-y-auto overscroll-contain border border-[#28ee90] bg-[#091008] px-3 pb-[calc(12px+var(--app-safe-bottom))] pt-3 shadow-[0_0_32px_rgba(40,238,144,.16)] [-webkit-overflow-scrolling:touch]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xl text-[#dfff9c]"
          >
            ←
          </button>
          <h2 className="flex-1 font-mono text-[14px] font-black uppercase text-[#fff0db]">
            {t("clan_panel.management_title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl text-[#dfff9c]"
          >
            ×
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {[
            ["members", t("clan_panel.members")],
            ["applications", t("clan_panel.applications", { count: data?.applications?.length || 0 })],
            ["settings", t("clan_panel.settings")],
            ["log", t("clan_panel.log")],
          ].map(([id, label]) => (
            <GameTextureButton
              key={id}
              type="button"
              tone={tab === id ? "green" : "gray"}
              onClick={() => setTab(id)}
              className="h-10 px-1"
            >
              <span className="relative z-10 font-mono text-[10px] font-black uppercase text-[#17220e]">{label}</span>
            </GameTextureButton>
          ))}
        </div>
        {error ? (
          <p className="mt-3 font-mono text-[10px] text-[#ff8978]">{error}</p>
        ) : null}
        {!data ? (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto animate-spin text-[#dfff9c]" />
          </div>
        ) : null}
        {data && tab === "members" ? (
          <div className="mt-3">
            <p className="font-mono text-[10px] uppercase text-[#a9cd74]">
              {t("clan_panel.members")} {data.members.length}/{data.member_limit}
            </p>
            <div className="mt-2 space-y-2">
              {data.members.map((member) => {
                const [label, color] =
                  (ROLE_UI[member.clan_role] || ROLE_UI.member).map((value,index)=>index===0?translateUiText(value):value);
                const targetRole = member.clan_role;
                const canKick =
                  member.id !== data?.clan?.owner_id &&
                  (canLeader || ["elder", "member"].includes(targetRole));
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 border border-[#345333] bg-[#101710] p-2"
                  >
                    <AvatarWithFrame profile={member} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px] font-black text-[#fff0db]">
                        {memberName(member)}
                      </p>
                      <p
                        className="font-mono text-[9px] font-bold"
                        style={{ color }}
                      >
                        {t(`clan_panel.role_${member.clan_role || "member"}`)} · {t("clan_panel.level_short")} {member.level || 1} ·{" "}
                        {formatNumber(member.power)}
                      </p>
                    </div>
                    {canLeader && member.clan_role !== "leader" ? (
                      <select
                        disabled={busy}
                        value={targetRole}
                        onChange={(event) =>
                          act("role", {
                            playerId: member.id,
                            role: event.target.value,
                          })
                        }
                        className="max-w-[92px] border border-[#55774e] bg-[#0b100a] p-1 font-mono text-[8px] text-[#dfff9c]"
                      >
                        <option value="member">{t("clan_panel.role_member")}</option>
                        <option value="elder">{t("clan_panel.role_elder")}</option>
                        <option value="deputy">{t("clan_panel.role_deputy")}</option>
                      </select>
                    ) : null}
                    {canKick ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          window.confirm(
                            t("clan_panel.kick_confirm", { name: memberName(member) }),
                          ) && act("kick", { playerId: member.id })
                        }
                        className="border border-[#a94442] px-2 py-1 font-mono text-[8px] text-[#ff9a8e]"
                      >
                        {t("clan_panel.kick")}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {data && tab === "applications" ? (
          <div className="mt-3 space-y-2">
            {data.applications.length ? (
              data.applications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center gap-2 border border-[#42633c] p-2"
                >
                  <AvatarWithFrame profile={application.player} size="sm" />
                  <div className="min-w-0 flex-1 font-mono">
                    <p className="truncate text-[11px] font-black text-[#fff0db]">
                      {memberName(application.player)}
                    </p>
                    <p className="text-[9px] text-[#9fba7b]">
                      {t("clan_panel.level_short")} {application.player.level || 1} ·{" "}
                      {formatNumber(application.player.power)} {t("clan_panel.power")}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      act("application", {
                        applicationId: application.id,
                        decision: "accept",
                      })
                    }
                    className="border border-[#82bb42] px-2 py-1 font-mono text-[8px] text-[#cbf487]"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      act("application", {
                        applicationId: application.id,
                        decision: "reject",
                      })
                    }
                    className="border border-[#a94442] px-2 py-1 font-mono text-[8px] text-[#ff9a8e]"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className="py-8 text-center font-mono text-[10px] text-[#8ba86d]">
                {t("clan_panel.no_applications")}
              </p>
            )}
          </div>
        ) : null}
        {data && tab === "settings" ? (
          <div className="mt-3 space-y-3">
            <label className="block font-mono text-[9px] uppercase text-[#a9cd74]">
              {t("clan_panel.description")}
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1 h-20 w-full border border-[#42633c] bg-[#080c07] p-2 text-[11px] text-[#fff0db]"
              />
            </label>
            <GameTextureButton
              type="button"
              tone="green"
              disabled={busy}
              onClick={() => act("settings", { updates: { description } })}
              className="h-8 px-3"
            >
              <span className="relative z-10 font-mono text-[9px] font-black text-[#17220e]">{t("clan_panel.save_description")}</span>
            </GameTextureButton>
            {canLeader ? (
              <div className="grid grid-cols-2 gap-2">
                <select
                  defaultValue={data.clan.join_type || "open"}
                  onChange={(event) =>
                    act("settings", {
                      updates: { join_type: event.target.value },
                    })
                  }
                  className="border border-[#42633c] bg-[#080c07] p-2 font-mono text-[9px] text-[#dfff9c]"
                >
                  <option value="open">{t("clan_panel.clan_type_open")}</option>
                  <option value="request">{t("clan_panel.clan_create_type_request")}</option>
                  <option value="invite">{t("clan_panel.clan_type_invite_only")}</option>
                </select>
                <input
                  type="number"
                  defaultValue={data.clan.min_level || 1}
                  onBlur={(event) =>
                    act("settings", {
                      updates: { min_level: event.target.value },
                    })
                  }
                  className="border border-[#42633c] bg-[#080c07] p-2 font-mono text-[9px] text-[#dfff9c]"
                />
              </div>
            ) : null}
            <div className="border-t border-[#345333] pt-3">
              <input
                value={mailTitle}
                onChange={(event) => setMailTitle(event.target.value)}
                placeholder={t("clan_panel.announcement_subject")}
                className="w-full border border-[#42633c] bg-[#080c07] p-2 font-mono text-[10px] text-[#fff0db]"
              />
              <textarea
                value={mailText}
                onChange={(event) => setMailText(event.target.value)}
                placeholder={t("clan_panel.text")}
                className="mt-2 h-16 w-full border border-[#42633c] bg-[#080c07] p-2 font-mono text-[10px] text-[#fff0db]"
              />
              <div className="mt-2 flex gap-2">
                <GameTextureButton
                  type="button"
                  tone="green"
                  disabled={busy}
                  onClick={() =>
                    act("mail", { title: mailTitle, text: mailText })
                  }
                  className="h-8 px-3"
                >
                  <span className="relative z-10 font-mono text-[9px] font-black text-[#17220e]">{t("clan_panel.send_mail")}</span>
                </GameTextureButton>
                <GameTextureButton
                  type="button"
                  tone="yellow"
                  disabled={busy}
                  onClick={() =>
                    act("announcement", { title: mailTitle, text: mailText })
                  }
                  className="h-8 px-3"
                >
                  <span className="relative z-10 font-mono text-[9px] font-black text-[#17220e]">{t("clan_panel.pin")}</span>
                </GameTextureButton>
              </div>
            </div>
            {canLeader ? (
              <div className="border-t border-[#673838] pt-3">
                <select
                  aria-label={transferPlaceholder}
                  value={transferMemberId}
                  onChange={event => setTransferMemberId(event.target.value)}
                  disabled={busy || transferCandidates.length === 0}
                  className="mb-3 block min-h-11 w-full border border-[#28ee90] bg-[#101710] px-3 font-mono text-xs text-[#fff0db]"
                >
                  <option value="">{transferPlaceholder}</option>
                  {transferCandidates.map(member => <option key={member.id} value={String(member.id)}>{memberName(member)} · LVL {member.level || 1}</option>)}
                </select>
                <GameTextureButton
                  type="button"
                  tone="yellow"
                  disabled={busy || !transferMember}
                  onClick={() => {
                    if (transferMember && window.confirm(t("clan_panel.transfer_confirm") + "\n\n" + memberName(transferMember) + " · LVL " + (transferMember.level || 1)))
                      act("transfer", { playerId: transferMember.id, confirmed: true });
                  }}
                  className="mr-2 h-8 px-3"
                >
                  <span className="relative z-10 font-mono text-[9px] font-black text-[#17220e]">{t("clan_panel.transfer_leader")}</span>
                </GameTextureButton>
                <GameTextureButton
                  type="button"
                  tone="red"
                  disabled={busy}
                  onClick={() =>
                    window.confirm(t("clan_panel.dissolve_confirm")) &&
                    act("dissolve", { confirmed: true })
                  }
                  className="h-8 px-3"
                >
                  <span className="relative z-10 font-mono text-[9px] font-black text-[#fff0db]">{t("clan_panel.dissolve")}</span>
                </GameTextureButton>
              </div>
            ) : null}
          </div>
        ) : null}
        {data && tab === "log" ? (
          <div className="mt-3 space-y-2">
            {data.activity.length ? (
              data.activity.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-[#34483b] bg-[#0c110c] p-2 font-mono text-[10px] text-[#c9d6ba]"
                >
                  <p>{localizeClanActivityText(entry, t)}</p>
                  <p className="mt-1 text-[8px] text-[#6e8b60]">
                    {new Date(entry.created_at).toLocaleString(i18n.language === "uk" || i18n.language === "ua" ? "uk-UA" : i18n.language === "ru" ? "ru-RU" : "en-US")}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center font-mono text-[10px] text-[#8ba86d]">
                {t("clan_panel.empty_log")}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </GameWindow>
  );
}

export function ClanBioView({
  clan,
  onOpenPlayerProfile = null,
  onOpenChat,
  onLeaveClan,
  onClose,
  onRefreshClan,
  externalAction = null,
  language,
}) {
  const { t: translate } = useTranslation();
  const t = (key, options) => translate(key, { ...options, ...(language ? { lng: language === 'ua' ? 'uk' : language } : {}) });
  const topMembers = [...clan.members].sort((a, b) => b.power - a.power);
  const [panel, setPanel] = useState(null);
  const [achievementPopup, setAchievementPopup] = useState(null);
  const [donateOpen, setDonateOpen] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteNotice, setInviteNotice] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteText, setInviteText] = useState('');
  const inviteCopy = language === 'ru' ? { title: 'Приглашение в клан', placeholder: 'Напишите, кого ищете в клан...', send: 'Отправить', cancel: 'Назад', done: 'Приглашение отправлено в мировой чат', cooldown: 'Приглашение можно отправить раз в 20 минут.' } : language === 'en' ? { title: 'Clan invitation', placeholder: 'Tell players who your clan is looking for...', send: 'Send', cancel: 'Back', done: 'Invitation sent to world chat', cooldown: 'One invitation per clan every 20 minutes.' } : { title: 'Запрошення в клан', placeholder: 'Напишіть, кого шукаєте в клан...', send: 'Надіслати', cancel: 'Назад', done: 'Запрошення надіслано у світовий чат', cooldown: 'Одне запрошення від клану раз на 20 хвилин.' };
  const [donateAmount, setDonateAmount] = useState("");
  const [donating, setDonating] = useState(false);
  const [donateError, setDonateError] = useState("");
  const [managementOpen, setManagementOpen] = useState(false);
  const canManage = ["leader", "deputy"].includes(
    String(clan.viewerRole || "").toLowerCase(),
  );
  const clanLevel = Math.min(
    ...["damage", "donations", "helper", "quests"].map((type) =>
      Math.max(0, Math.min(10, Number(clan.achievements?.[type]?.level || 0))),
    ),
  );
  const donationRemaining = Math.max(
    0,
    Number(clan.donation?.contribution_cap || 0) -
      Number(clan.donation?.contribution || 0),
  );
  const donationMax = Math.min(
    Number(clan.playerTentacles || 0),
    donationRemaining,
  );
  const donationsLocked = false;
  const closePinnedAnnouncement = async () => {
    try {
      await manageClan(clan.id, "clear_announcement");
      await onRefreshClan?.();
    } catch {
      /* server permission remains authoritative */
    }
  };
  const confirmDonation = async () => {
    const amount = Math.min(donationMax, Math.floor(Number(donateAmount || 0)));
    if (!amount || donating) return;
    setDonating(true);
    setDonateError("");
    try {
      await donateToClan(clan.id, amount);
      setDonateOpen(false);
      setDonateAmount("");
      await onRefreshClan?.();
    } catch (caught) {
      setDonateError(translateUiText(caught?.message || "Помилка"));
    } finally {
      setDonating(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <Frame className="p-3">
        <div className="flex gap-3 px-2 pt-1">
          <div className="-mt-1.5 ml-1 flex h-[106px] w-[106px] shrink-0 items-center justify-center overflow-visible text-[34px] sm:h-[118px] sm:w-[118px]">
            {clan.logoId ? (
              <ClanEmblem
                src={
                  GUILD_LOGOS.find((logo) => logo.id === clan.logoId)?.src ||
                  DEFAULT_GUILD_LOGO
                }
                alt={clan.name}
                level={clanLevel}
              />
            ) : (
              <span aria-hidden="true">{clan.sign.badge}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate font-mono text-[18px] font-bold text-[#fff0db]">
                  {clan.name}
                </h2>
                <p
                  className="mt-0.5 font-mono text-[9px] font-black uppercase tracking-[0.16em]"
                  style={{ color: CLAN_RARITY_COLORS[clanLevel] || "#8d969d" }}
                >
                  {t("clan_panel.clan_level", { level: clanLevel })}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => setManagementOpen(true)}
                    aria-label={t("clan_panel.manage")}
                    className="flex h-10 w-10 items-center justify-center bg-transparent text-[#dfff9c] transition hover:bg-[#101710]"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                ) : null}
                {onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t("clan_panel.close")}
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-transparent text-[#dfff9c] transition hover:bg-[#101710]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            </div>

            <p className="mt-2 font-mono text-[11px] leading-relaxed text-[#d5c5aa]">
              {localizeClanDescription(clan.description, t)}
            </p>
            {clan.pinnedAnnouncement ? (
              <div className="mt-2 border border-[#4dbfd2] bg-[#0a1718] px-2 py-1.5">
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[8px] font-black uppercase text-[#8ee9f5]">
                      📌 {clan.pinnedAnnouncement.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] text-[#c4dddd]">
                      {clan.pinnedAnnouncement.text}
                    </p>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={closePinnedAnnouncement}
                      aria-label={t("clan_panel.close_announcement")}
                      className="h-5 w-5 shrink-0 font-mono text-[14px] leading-none text-[#8ee9f5]"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <ClanRewardAchievements clan={clan} />

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            {
              label: t("clan_panel.clan_power"),
              value: formatNumber(clan.clanPower),
              icon: getResourceIcon("strength"),
            },
            {
              label: t("clan_panel.active_players"),
              value: `${clan.activeMemberCount}/${clan.memberLimit}`,
              icon: heroIcon,
              iconClassName: "h-8 w-8",
            },
            {
              label: t("clan_panel.last_raid_damage"),
              value: formatNumber(clan.lastRaidDamage),
              icon: dmgBossIcon,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex min-h-[56px] min-w-0 items-center gap-2 border border-[#28ee90] bg-[#0e150d] px-2 py-2"
            >
              {item.icon ? (
                <img
                  src={item.icon}
                  alt=""
                  aria-hidden="true"
                  className={`${item.iconClassName || "h-8 w-8"} shrink-0 object-contain`}
                />
              ) : null}
              <div className="min-w-0">
                <p className="truncate font-mono text-[8px] uppercase tracking-[0.14em] text-[#93b765]">
                  {item.label}
                </p>
                <p className="truncate font-mono text-[12px] font-bold text-[#fff0db]">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {inviteOpen && canManage ? <form onSubmit={async event => { event.preventDefault(); if (inviteBusy || !inviteText.trim()) return; setInviteBusy(true); try { await sendChatMessage({ channel: 'world', kind: 'clan_invite', text: inviteText.trim() }); setInviteOpen(false); setInviteText(''); setInviteNotice(inviteCopy.done); } catch (error) { setInviteNotice(error.code === 'CHAT_INVITE_COOLDOWN' ? inviteCopy.cooldown : error.message); } finally { setInviteBusy(false); } }} className="mt-3 border border-[#28ee90] bg-[#081007] p-3">
          <label className="block text-sm font-black text-[#d8ff86]">{inviteCopy.title}<textarea value={inviteText} onChange={event => setInviteText(event.target.value)} maxLength={180} rows={3} placeholder={inviteCopy.placeholder} className="mt-2 block w-full resize-none border border-[#527b33] bg-[#101a0e] p-2 text-[16px] font-normal leading-snug text-[#efffe3]" /></label>
          <p className="mt-1 text-right text-[10px] text-[#b9d58d]">{inviteText.length}/180</p>
          <div className="mt-2 grid grid-cols-2 gap-2"><GameTextureButton type="button" tone="yellow" disabled={inviteBusy} onClick={() => setInviteOpen(false)} className="h-10"><span className="relative z-10 text-xs font-black text-[#13200e]">{inviteCopy.cancel}</span></GameTextureButton><GameTextureButton type="submit" disabled={inviteBusy || !inviteText.trim()} className="h-10"><span className="relative z-10 text-xs font-black text-[#13200e]">{inviteBusy ? '...' : inviteCopy.send}</span></GameTextureButton></div>
        </form> : null}
        {inviteNotice ? <p role="status" className="mt-2 text-xs text-[#d8ff86]">{inviteNotice}</p> : null}
        {externalAction ? (
          <GameTextureButton type="button" tone={externalAction.tone || "yellow"} disabled={externalAction.disabled} onClick={externalAction.onClick} className="mt-3 h-10 w-full">
            <span className="relative z-10 font-mono text-[11px] font-black uppercase text-[#17220e]">{externalAction.label}</span>
          </GameTextureButton>
        ) : <div className={`mt-3 grid gap-2 ${canManage ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px_36px_36px]' : 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px_40px]'}`}>
          <ClaimButton
            label={t("clan_panel.quests")}
            tone="yellow"
            onClick={() =>
              setPanel(panel === "quests-panel" ? null : "quests-panel")
            }
            className="h-10"
          />
          <ClaimButton
            label={t("clan_panel.donate")}
            tone="yellow"
            onClick={() => {
              setDonateError("");
              setDonateOpen(true);
            }}
            className="h-10"
          />
          {canManage ? <GameTextureButton type="button" tone="yellow" disabled={inviteBusy} aria-label={language === 'ru' ? 'Пригласить в мировой чат' : language === 'en' ? 'Invite in world chat' : 'Запросити у світовий чат'} onClick={() => { setInviteNotice(''); setInviteOpen(true); }} className="flex h-10 w-9 items-center justify-center"><Megaphone className="relative z-10 h-5 w-5 text-[#13200e]" /></GameTextureButton> : null}
          <GameTextureButton
            type="button"
            tone="yellow"
            onClick={onOpenChat}
            aria-label={t("clan_panel.clan_chat")}
            title={t("clan_panel.clan_chat")}
            className="flex h-10 w-10 items-center justify-center p-0 text-[#18220d]"
          >
            <MessageCircle
              className="relative z-10 h-5 w-5"
              strokeWidth={2.5}
            />
          </GameTextureButton>
          {clan.hasClan ? (
            <GameTextureButton
              type="button"
              tone="red"
              onClick={onLeaveClan}
              aria-label={t("clan_panel.leave_clan")}
              title={t("clan_panel.leave_clan")}
              className="flex h-10 w-10 items-center justify-center p-0 text-[#fff0db]"
            >
              <LogOut className="relative z-10 h-5 w-5" strokeWidth={2.5} />
            </GameTextureButton>
          ) : (
            <GameTextureButton
              type="button"
              tone="gray"
              aria-label={clan.location}
              title={clan.location}
              className="flex h-10 w-10 items-center justify-center p-0 text-[#cbd6bf]"
            >
              <X className="relative z-10 h-5 w-5" strokeWidth={2.5} />
            </GameTextureButton>
          )}
        </div>}

        <ClanProgressAchievements clan={clan} onSelect={externalAction ? null : setAchievementPopup} />
        {!externalAction && ["quests-panel", "donations-panel"].includes(panel) ? (
          <ClanFeaturePanel
            clan={clan}
            mode={panel.replace("-panel", "")}
            onClose={() => setPanel(null)}
            onChanged={onRefreshClan}
          />
        ) : null}
      </Frame>

      {managementOpen ? (
        <ClanManagementModal
          clanId={clan.id}
          onClose={() => setManagementOpen(false)}
          onChanged={onRefreshClan}
        />
      ) : null}

      {!externalAction && achievementPopup ? (
        <ClanAchievementDetail clan={clan} type={achievementPopup} onClose={() => setAchievementPopup(null)} />
      ) : null}

      {donateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[360px] border border-[#28ee90] bg-[#0b100a] p-4 shadow-[0_0_28px_rgba(40,238,144,0.2)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-mono text-[14px] font-black uppercase text-[#fff0db]">
                {t("clan_panel.donate")}
              </h3>
              <button
                type="button"
                onClick={() => setDonateOpen(false)}
                className="font-mono text-[#dfff9c]"
              >
                ×
              </button>
            </div>
            <p className="mt-2 font-mono text-[9px] text-[#a8d96b]">
              {Number(clan.donation?.contribution || 0).toLocaleString()} /{" "}
              {Number(clan.donation?.contribution_cap || 0).toLocaleString()}{" "}
              tentacles · {t("clan_panel.donation_daily_limit")}
            </p>
            {donationsLocked ? (
              <p className="mt-3 font-mono text-[10px] text-[#f3d65a]">
                {t("clan_panel.donations_locked")}
              </p>
            ) : (
              <>
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={donationMax}
                    value={donateAmount}
                    onChange={(event) => setDonateAmount(event.target.value)}
                    placeholder="0"
                    className="h-10 min-w-0 flex-1 border border-[#477a45] bg-[#050705] px-3 font-mono text-[13px] font-black text-[#fff0db] outline-none"
                  />
                  <ClaimButton
                    label="MAX"
                    tone="yellow"
                    className="h-10 px-3"
                    onClick={() => setDonateAmount(String(donationMax))}
                  />
                </div>
                <p className="mt-1 font-mono text-[8px] text-[#8eaa69]">
                  MAX: {donationMax.toLocaleString()} tentacles
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <ClaimButton
                    label={t("clan_panel.close")}
                    tone="gray"
                    className="h-10"
                    onClick={() => setDonateOpen(false)}
                  />
                  <ClaimButton
                    label={t("clan_panel.confirm")}
                    tone="yellow"
                    className="h-10"
                    disabled={
                      donating || !Number(donateAmount) || donationMax <= 0
                    }
                    onClick={confirmDonation}
                  />
                </div>
                {donateError ? (
                  <p className="mt-2 font-mono text-[9px] text-[#ff7770]">
                    {donateError}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      <Frame className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#87a55f]">
              {t("clan_panel.members")}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {topMembers.map((member, index) => {
            const isLeader = member.role === "Р“Р»Р°РІР°";
            const rankInfo = getCARankProgress(member.power);
            const rankIcon = getCARankIcon(rankInfo.current);
            return (
              <LeaderboardRow
                key={member.id}
                rank={index + 1}
                compactRank
                selected={index === 0}
                mediaSrc={getLeaderboardAvatarUrl(member) || heroIcon}
                mediaFrameId={getLeaderboardFrameId(member)}
                title={member.name}
                titlePlayer={member}
                subtitle={getClanRoleLabel(member.role || member.clanLabel, t)}
                badges={[]}
                rightNode={
                  <div className="flex items-center gap-2">
                    {rankIcon ? (
                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-none">
                        <img
                          src={rankIcon}
                          alt=""
                          aria-hidden="true"
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                    ) : null}
                    <LeaderboardValuePill
                      value={member.power}
                      icon={getResourceIcon("strength")}
                      compact
                    />
                  </div>
                }
                titleClassName={isLeader ? "text-[#d8f67a]" : ""}
                onClick={member.id ? () => onOpenPlayerProfile?.({ ...member, id: member.id, username: member.username || member.name, nickname: member.nickname || member.name }) : null}
              />
            );
          })}
        </div>
      </Frame>
    </div>
  );
}

function ClanCreateView({ profile, onCreateClan, onClose }) {
  const { t } = useTranslation();
  const accent = "#28ee90";
  const [name, setName] = useState("Junk Concept");
  const [description, setDescription] = useState(
    t("clan_panel.clan_create_description_default"),
  );
  const [selectedLogo, setSelectedLogo] = useState(GUILD_LOGOS[0].id);
  const [showEmblemPicker, setShowEmblemPicker] = useState(false);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [requiredTrophies, setRequiredTrophies] = useState(0);

  const canCreate =
    (profile?.level || 0) >= 10 && (profile?.tentacles || 0) >= 10000;
  const clanTypes = [
    {
      label: t("clan_panel.clan_type_open"),
      hint: t("clan_panel.clan_type_open_hint"),
    },
    {
      label: t("clan_panel.clan_create_type_request"),
      hint: t("clan_panel.clan_type_request_hint"),
    },
    {
      label: t("clan_panel.clan_type_invite_only"),
      hint: t("clan_panel.clan_type_invite_only_hint"),
    },
  ];
  const activeLogo =
    GUILD_LOGOS.find((logo) => logo.id === selectedLogo) || GUILD_LOGOS[0];

  const handleCreate = () => {
    if (!canCreate) return;
    onCreateClan?.({
      clan_name: name.trim(),
      clan_id: name.trim().toLowerCase().replace(/\s+/g, "-"),
      clan_role: t("clan_panel.role_leader"),
      clan_description: description.trim(),
      clan_trophies: requiredTrophies,
      clan_logo_id: selectedLogo,
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-[calc(var(--app-top-offset,0px)+40px)] z-[40] flex items-center justify-center overflow-hidden bg-black/75 p-0 text-white backdrop-blur-[2px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(27,57,31,0.72),rgba(2,6,3,0.94)_58%)]" />
      <MarkerFrame
        className="game-modal-enter relative z-10 flex h-full max-h-full w-full max-w-[520px] flex-col"
        innerClassName="flex min-h-0 flex-1 flex-col p-3 sm:p-4"
        variant="dark"
      >
        <header className="relative shrink-0 border-b border-[#28ee90]/70 pb-3 pr-12">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#93c74a]">
            {t("clan_panel.clan_settings")}
          </p>
          <h2 className="mt-1 font-mono text-[clamp(24px,5vw,34px)] font-black uppercase leading-none text-[#f3ffd8]">
            {t("clan_panel.create_clan")}
          </h2>
          <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#a8c97a]">
            {t("clan_panel.clan_create_subtitle")}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("clan_panel.close")}
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center bg-transparent text-[#dfff9c] transition hover:bg-white/[0.06] active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 pr-1 sm:py-4">
          <section className="mx-auto min-w-0 max-w-[620px] space-y-3 border border-[#28ee90]/70 bg-[#0b120c] p-3">
            <div className="grid min-w-0 grid-cols-[92px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[132px_minmax(0,1fr)]">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#88b84f]">
                {t("clan_panel.clan_emblem")}
              </p>
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={activeLogo.src}
                  alt={activeLogo.id}
                  className="h-[76px] w-[76px] shrink-0 object-contain"
                />
                <GameTextureButton
                  type="button"
                  onClick={() => setShowEmblemPicker((value) => !value)}
                  className="flex h-11 min-w-0 flex-1 items-center justify-center px-3 text-[#15210d]"
                >
                  <span className="relative z-10 font-mono text-[11px] font-black uppercase tracking-[0.08em]">
                    {t("clan_panel.change_emblem")}
                  </span>
                </GameTextureButton>
              </div>
            </div>
            <div
              className={`grid transition-all duration-200 ${showEmblemPicker ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}
            >
              <div
                className="ml-[92px] min-w-0 overflow-x-scroll overscroll-x-contain touch-pan-x pb-2 select-none sm:ml-[132px]"
                style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
              >
                <div className="flex min-w-max gap-2">
                  {GUILD_LOGOS.map((logo) => {
                    const isActive = logo.id === selectedLogo;
                    return (
                      <button
                        key={logo.id}
                        type="button"
                        onClick={() => {
                          setSelectedLogo(logo.id);
                          setShowEmblemPicker(false);
                        }}
                        aria-label={logo.id}
                        className={`flex h-16 w-16 shrink-0 items-center justify-center bg-transparent p-0 transition hover:scale-110 active:scale-95 ${isActive ? "drop-shadow-[0_0_10px_rgba(40,238,144,0.8)]" : ""}`}
                      >
                        <img
                          src={logo.src}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-[92px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[132px_minmax(0,1fr)]">
              <label
                htmlFor="clan-name"
                className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#88b84f]"
              >
                {t("clan_panel.clan_name")}
              </label>
              <input
                id="clan-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full min-w-0 border border-[#28ee90] bg-[#0f1711] px-3 font-mono text-[14px] font-bold text-[#f3ffe9] outline-none transition focus:shadow-[0_0_12px_rgba(40,238,144,0.24)]"
              />
            </div>

            <div className="grid min-w-0 grid-cols-[92px_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[132px_minmax(0,1fr)]">
              <label
                htmlFor="clan-description"
                className="pt-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#88b84f]"
              >
                {t("clan_panel.description")}
              </label>
              <div className="relative">
                <textarea
                  id="clan-description"
                  value={description}
                  maxLength={200}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="h-[76px] w-full resize-none border border-[#28ee90] bg-[#0f1711] px-3 py-2 pb-6 font-mono text-[13px] leading-relaxed text-[#f3ffe9] outline-none transition focus:shadow-[0_0_12px_rgba(40,238,144,0.24)]"
                />
                <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] text-[#88b84f]">
                  {description.length} / 200
                </span>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-[92px_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[132px_minmax(0,1fr)]">
              <p className="pt-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#88b84f]">
                {t("clan_panel.clan_type")}
              </p>
              <div>
                <div className="grid max-w-[300px] grid-cols-[44px_minmax(0,1fr)_44px] gap-2">
                  <GameTextureButton
                    tone="green"
                    type="button"
                    onClick={() =>
                      setSelectedTypeIndex(
                        (value) =>
                          (value + clanTypes.length - 1) % clanTypes.length,
                      )
                    }
                    className="flex h-11 w-11 items-center justify-center p-0 text-[#15210d]"
                  >
                    <span className="relative z-10 font-mono text-sm font-black">
                      ◀
                    </span>
                  </GameTextureButton>
                  <div className="flex h-11 min-w-0 items-center justify-center border border-[#28ee90] bg-[#0f1711] px-2 font-mono text-[10px] font-black uppercase text-[#f1ffe8]">
                    {clanTypes[selectedTypeIndex].label}
                  </div>
                  <GameTextureButton
                    tone="green"
                    type="button"
                    onClick={() =>
                      setSelectedTypeIndex(
                        (value) => (value + 1) % clanTypes.length,
                      )
                    }
                    className="flex h-11 w-11 items-center justify-center p-0 text-[#15210d]"
                  >
                    <span className="relative z-10 font-mono text-sm font-black">
                      ▶
                    </span>
                  </GameTextureButton>
                </div>
                <p className="mt-1 min-h-4 font-mono text-[10px] leading-snug text-[#a8c97a]">
                  {clanTypes[selectedTypeIndex].hint}
                </p>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-[92px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[132px_minmax(0,1fr)]">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#88b84f]">
                {t("clan_panel.required_trophies")}
              </p>
              <div className="grid max-w-[230px] grid-cols-[44px_minmax(0,1fr)_44px] gap-2">
                <GameTextureButton
                  tone="green"
                  type="button"
                  onClick={() =>
                    setRequiredTrophies((value) => Math.max(0, value - 500))
                  }
                  className="flex h-11 w-11 items-center justify-center p-0 text-[#15210d]"
                >
                  <span className="relative z-10 font-mono text-xl font-black">
                    −
                  </span>
                </GameTextureButton>
                <div className="flex h-11 min-w-0 items-center justify-center border border-[#28ee90] bg-[#0f1711] px-2 font-mono text-[13px] font-black text-[#f1ffe8]">
                  {formatNumber(requiredTrophies)}
                </div>
                <GameTextureButton
                  tone="green"
                  type="button"
                  onClick={() => setRequiredTrophies((value) => value + 500)}
                  className="flex h-11 w-11 items-center justify-center p-0 text-[#15210d]"
                >
                  <span className="relative z-10 font-mono text-xl font-black">
                    +
                  </span>
                </GameTextureButton>
              </div>
            </div>
          </section>
        </div>

        <footer className="mx-auto mb-[88px] flex w-full max-w-[620px] shrink-0 flex-wrap justify-start gap-2 border-t border-[#28ee90]/70 pl-[94px] pt-3 sm:pl-[140px]">
          <GameTextureButton
            tone="dark-green"
            type="button"
            onClick={onClose}
            className="flex h-11 min-w-[112px] items-center justify-center px-4 text-[#efffd8]"
          >
            <span className="relative z-10 font-mono text-[11px] font-black uppercase">
              {t("clan_panel.cancel")}
            </span>
          </GameTextureButton>
          <GameTextureButton
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className={`flex h-11 min-w-[150px] items-center justify-center px-4 text-[#121b0d] ${canCreate ? "" : "opacity-60 grayscale"}`}
          >
            <span className="relative z-10 flex items-center gap-2 font-mono text-[11px] font-black uppercase">
              <span>
                {canCreate
                  ? t("clan_panel.create_clan")
                  : t("clan_panel.locked")}
              </span>
              <span className="border-l border-[#425d1c] pl-2 text-[10px]">
                {formatNumber(10000)}
              </span>
            </span>
          </GameTextureButton>
        </footer>
      </MarkerFrame>
    </div>
  );
}

function RankBadge({ rank }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-[#28ee90] bg-[radial-gradient(circle_at_35%_30%,#314a25_0%,#111710_74%)] font-mono text-[12px] font-black text-[#dfff9c]">
      {rank}
    </div>
  );
}

function ClanBadge({ label, tone = "green" }) {
  const toneClass =
    tone === "gold"
      ? "border-[#d8b74d] bg-[#201809] text-[#f4d46b]"
      : tone === "blue"
        ? "border-[#5cc5ff] bg-[#0f1820] text-[#a8ddff]"
        : "border-[#28ee90] bg-[#0d160e] text-[#dfff9c]";

  return (
    <div
      className={`flex h-11 min-w-[44px] items-center justify-center rounded-none border px-2 font-mono text-[10px] font-black uppercase tracking-[0.08em] ${toneClass}`}
    >
      {label}
    </div>
  );
}

export default function ClanPanel({
  profile,
  onOpenChat,
  onOpenPlayerProfile = null,
  onRefreshProfile,
  onClose = null,
}) {
  const { t } = useTranslation();
  const hasClan = Boolean(profile?.clan_name || profile?.clan_id);
  const [view, setView] = useState(hasClan ? "bio" : "lobby");
  const [clanRows, setClanRows] = useState([]);
  const [clanMembers, setClanMembers] = useState([]);
  const [clanRecord, setClanRecord] = useState(null);
  const [raidLeaderboard, setRaidLeaderboard] = useState([]);
  const [loadingClans, setLoadingClans] = useState(true);
  const [leaveError, setLeaveError] = useState('');
  const [joiningClanId, setJoiningClanId] = useState(null);
  const joinBusyRef = useRef(false);
  const [joinFeedback, setJoinFeedback] = useState(null);
  const clan = buildClanProfile(
    profile,
    t,
    clanMembers,
    raidLeaderboard,
    clanRecord,
  );
  useEffect(() => {
    setView(hasClan ? "bio" : "lobby");
  }, [hasClan]);

  const loadClans = useCallback(async () => {
    setLoadingClans(true);
    try {
      const clans = await listClans();
      setClanRows(buildClanRows(clans || [], t));
    } catch (_error) {
      setClanRows([]);
    } finally {
      setLoadingClans(false);
    }
  }, [t]);

  useEffect(() => {
    loadClans();
  }, [loadClans, profile?.clan_name, profile?.clan_id]);

  const refreshClanData = useCallback(async () => {
    const clanId = profile?.clan_id || profile?.clan_name;
    if (!clanId) {
      setClanMembers([]);
      setClanRecord(null);
      setRaidLeaderboard([]);
      return;
    }
    const requests = [
      listClanMembers(clanId).then((members) => {
        setClanMembers(Array.isArray(members) ? members : []);
      }),
      getClan(clanId).then((record) => {
        setClanRecord(record || null);
      }),
      listRaidBossLeaderboard().then((leaderboard) => {
        setRaidLeaderboard(Array.isArray(leaderboard) ? leaderboard : []);
      }),
    ];
    await Promise.allSettled(requests);
  }, [profile?.clan_id, profile?.clan_name]);

  useEffect(() => {
    let active = true;
    refreshClanData().catch(() => {
      if (!active) return;
      setClanMembers([]);
      setRaidLeaderboard([]);
      setClanRecord(null);
    });
    return () => {
      active = false;
    };
  }, [refreshClanData]);

  const joinClan = async (selectedClan) => {
    if (!selectedClan || hasClan || joinBusyRef.current) return;
    joinBusyRef.current = true;
    setJoiningClanId(selectedClan.id);
    setJoinFeedback(null);
    const language = profile?.language || 'uk';
    try {
      const result = await joinClanRequest(selectedClan.id);
      if (result?.requested) {
        setJoinFeedback({ clanId: selectedClan.id, requested: true, message: language === 'ru' ? 'Заявка отправлена. Дождитесь одобрения лидера.' : language === 'en' ? 'Application sent. Waiting for leader approval.' : 'Заяву надіслано. Очікуйте схвалення лідера.' });
      } else {
        await onRefreshProfile?.();
        await loadClans();
      }
    } catch (error) {
      const messages = {
        CLAN_LEVEL_REQUIRED: ['Недостатній рівень для вступу.', 'Недостаточный уровень для вступления.', 'Your level is too low.'],
        CLAN_REJOIN_COOLDOWN: ['Після виходу з клану повторний вступ доступний через 24 години.', 'После выхода из клана повторное вступление доступно через 24 часа.', 'Rejoining is available 24 hours after leaving.'],
        CLAN_FULL: ['Клан повний.', 'Клан заполнен.', 'Clan is full.'],
        CLAN_INVITE_ONLY: ['Вступ лише за запрошенням.', 'Вступление только по приглашению.', 'Invite only.'],
        CLAN_ALREADY_JOINED: ['Спочатку вийдіть зі свого клану.', 'Сначала выйдите из своего клана.', 'Leave your current clan first.'],
      };
      setJoinFeedback({ clanId: selectedClan.id, error: true, message: messages[error.code]?.[language === 'ru' ? 1 : language === 'en' ? 2 : 0] || error.message || 'JOIN_FAILED' });
    } finally {
      joinBusyRef.current = false;
      setJoiningClanId(null);
    }
  };

  const createClan = async (payload) => {
    if (!payload?.clan_name) return;
    await createClanRequest(payload);
    await onRefreshProfile?.();
    await loadClans();
  };

  const leaveClan = async () => {
    if (!hasClan) return;
    setLeaveError('');
    try {
      await leaveClanRequest(profile?.clan_id || profile?.clan_name);
      await onRefreshProfile?.();
      await loadClans();
    } catch (error) {
      setLeaveError(error?.message || 'Unable to leave clan');
    }
  };

  const handleClanMutation = useCallback(async () => {
    await onRefreshProfile?.();
    await refreshClanData();
    await loadClans();
  }, [loadClans, onRefreshProfile, refreshClanData]);

  return (
    <div className="space-y-2.5 pb-2">
      {leaveError ? <p className="border border-[#ff7566] bg-[#29100d] px-3 py-2 font-mono text-[10px] text-[#ffb3a9]">{leaveError}</p> : null}
      {!hasClan ? (
        <div className="flex h-12 gap-2">
          <TopTabButton
            active={view === "lobby"}
            label={t("clan_panel.clan_list")}
            onClick={() => setView("lobby")}
          />
          <TopTabButton
            active={view === "create"}
            label={t("clan_panel.create_clan_tab")}
            onClick={() => setView("create")}
          />
        </div>
      ) : null}

      {view === "lobby" && !hasClan ? (
        <ClanLobbyView
          clans={clanRows}
          loading={loadingClans}
          onCreateClan={() => setView("create")}
          onJoinClan={joinClan}
          profile={profile}
          joiningClanId={joiningClanId}
          joinFeedback={joinFeedback}
        />
      ) : null}
      {view === "bio" ? (
        <ClanBioView
          clan={clan}
          onOpenPlayerProfile={onOpenPlayerProfile}
          language={profile?.language}
          onOpenChat={onOpenChat}
          onLeaveClan={leaveClan}
          onClose={onClose}
          onRefreshClan={handleClanMutation}
        />
      ) : null}
      {view === "create" ? (
        <ClanCreateView
          profile={profile}
          onCreateClan={createClan}
          onClose={() => setView(hasClan ? "bio" : "lobby")}
        />
      ) : null}
    </div>
  );
}
