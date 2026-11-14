const creditedRanks = new Map(Object.entries({
  "player-1791392608202-j59g7b": [
    16,
    17
  ],
  "player-1792264339606-omsibr": [
    16
  ],
  "player-1791389016852-4m0ocz": [
    16,
    17
  ],
  "player-1791238578348-1rtnwe": [
    16
  ],
  "player-1791432829035-eo0dr6": [
    16,
    17,
    18
  ],
  "player-1791389945628-c6nvtc": [
    16
  ],
  "player-1791576298777-ita313": [
    16,
    17
  ],
  "player-1791400000953-v8t0k7": [
    16,
    17
  ],
  "player-1791404250187-7y5076": [
    16,
    17
  ],
  "player-1791440615898-at4od8": [
    16,
    17
  ],
  "player-1791402961148-7t4pfa": [
    16
  ],
  "player-1792123597522-1ch46p": [
    16,
    17,
    18
  ],
  "player-1792419975175-r01427": [
    16,
    17
  ],
  "player-1791656072365-3xh67a": [
    16
  ],
  "player-1791653816231-ub0074": [
    16,
    17
  ],
  "player-1791465850037-uxc57w": [
    16
  ]
}));

export function getCARankBackfillNotice(player) {
  const claimed = new Set((player?.ca_rank_rewards_claimed || []).map(Number));
  return (creditedRanks.get(player?.id) || []).filter(rank => claimed.has(rank));
}
