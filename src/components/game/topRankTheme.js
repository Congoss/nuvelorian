const TOP_RANK_THEME = {
  gold: {
    badgeClass:
      'border-[#28ee90] bg-[linear-gradient(180deg,#3A2A0A_0%,#1b1408_100%)] text-[#FFD866] shadow-[0_0_10px_rgba(240,182,42,0.28)]',
    cardClass:
      'border-[#28ee90] bg-[linear-gradient(180deg,#3A2A0A_0%,#1b1408_100%)] text-[#FFD866] shadow-[0_0_14px_rgba(240,182,42,0.28)]',
    shine: 'linear-gradient(100deg,transparent 35%,rgba(255,216,102,0.24) 50%,transparent 65%)',
  },
  silver: {
    badgeClass:
      'border-[#28ee90] bg-[linear-gradient(180deg,#242B2D_0%,#131719_100%)] text-[#E1ECEA] shadow-[0_0_10px_rgba(184,196,196,0.22)]',
    cardClass:
      'border-[#28ee90] bg-[linear-gradient(180deg,#242B2D_0%,#131719_100%)] text-[#E1ECEA] shadow-[0_0_12px_rgba(184,196,196,0.22)]',
    shine: 'linear-gradient(100deg,transparent 35%,rgba(225,236,234,0.20) 50%,transparent 65%)',
  },
  bronze: {
    badgeClass: 'border-[#28ee90] bg-transparent text-[#E28A45] shadow-none',
    cardClass: 'border-[#28ee90] bg-transparent text-[#E28A45] shadow-none',
    shine: 'linear-gradient(100deg,transparent 35%,rgba(226,138,69,0.10) 50%,transparent 65%)',
  },
  top10: {
    badgeClass:
      'border-[#28ee90] bg-[linear-gradient(180deg,#1d2a14_0%,#10170d_100%)] text-[#dfff9c] shadow-[0_0_10px_rgba(127,227,85,0.18)]',
    cardClass:
      'border-[#28ee90] bg-[linear-gradient(180deg,#1d2a14_0%,#10170d_100%)] text-[#dfff9c] shadow-[0_0_12px_rgba(127,227,85,0.18)]',
    shine: 'linear-gradient(100deg,transparent 35%,rgba(223,255,156,0.16) 50%,transparent 65%)',
  },
  default: {
    badgeClass: 'border-[#28ee90] bg-[#0d120d] text-[#d8f67a]',
    cardClass: 'border-[#28ee90] bg-[#0d120d] text-[#d8f67a]',
    shine: 'linear-gradient(100deg,transparent 35%,rgba(216,246,122,0.16) 50%,transparent 65%)',
  },
};

export function getLeaderboardToneByRank(rank) {
  if (rank === 1) return TOP_RANK_THEME.gold;
  if (rank === 2) return TOP_RANK_THEME.silver;
  if (rank === 3) return TOP_RANK_THEME.bronze;
  if (rank >= 4 && rank <= 10) return TOP_RANK_THEME.top10;
  return TOP_RANK_THEME.default;
}

export function getLeaderboardTone(tone) {
  return TOP_RANK_THEME[tone] || TOP_RANK_THEME.default;
}

export function getTopRankToneByRank(rank) {
  return getLeaderboardToneByRank(rank);
}

export function getTopRankTone(tone) {
  return getLeaderboardTone(tone);
}
