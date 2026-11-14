const API = process.env.SIM_API_BASE || 'http://127.0.0.1:4173';

async function req(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.message || `HTTP ${response.status}`);
    error.payload = payload;
    throw error;
  }
  return payload.data ?? payload;
}

async function main() {
  const players = [];
  for (let i = 0; i < 10; i += 1) {
    const created = await req('/api/sim/create-player', {
      method: 'POST',
      body: JSON.stringify({ username: `Bot_${String(i + 1).padStart(2, '0')}`, startLevel: 1, mode: i < 3 ? 'newbie' : i < 7 ? 'active' : 'boss_focused' }),
    });
    players.push(created.playerId);
  }

  for (let tick = 0; tick < 20; tick += 1) {
    for (const playerId of players) {
      await req(`/api/sim/player/${encodeURIComponent(playerId)}/tick`, {
        method: 'POST',
        body: JSON.stringify({ maxActions: 3 }),
      });
    }
  }

  const snapshots = [];
  for (const playerId of players) {
    const state = await req(`/api/sim/player/${encodeURIComponent(playerId)}`);
    snapshots.push({
      playerId,
      level: state.level,
      scrap: state.scrap,
      energy: state.energy,
      bossDamage: state?.newbieQuestProgress?.find((q) => q.id === 'newbie_part_2')?.progress || 0,
      dailyClaims: (state.dailyStatus?.claimedTaskIds || []).length,
    });
  }

  const duplicateClaimFailures = [];
  for (const playerId of players.slice(0, 2)) {
    try {
      await req(`/api/sim/player/${encodeURIComponent(playerId)}/claim`, {
        method: 'POST',
        body: JSON.stringify({ kind: 'daily', taskId: 'daily_energy_30' }),
      });
      await req(`/api/sim/player/${encodeURIComponent(playerId)}/claim`, {
        method: 'POST',
        body: JSON.stringify({ kind: 'daily', taskId: 'daily_energy_30' }),
      });
    } catch (error) {
      duplicateClaimFailures.push({ playerId, code: error.payload?.code || 'ERR' });
    }
  }

  const cooldownFailures = [];
  for (const playerId of players.slice(0, 2)) {
    try {
      await req(`/api/sim/player/${encodeURIComponent(playerId)}/boss-attack`, {
        method: 'POST',
        body: JSON.stringify({ bossId: 'heli', skillId: 'fist' }),
      });
      await req(`/api/sim/player/${encodeURIComponent(playerId)}/boss-attack`, {
        method: 'POST',
        body: JSON.stringify({ bossId: 'heli', skillId: 'fist' }),
      });
    } catch (error) {
      cooldownFailures.push({ playerId, code: error.payload?.code || 'ERR' });
    }
  }

  const leaderboard = await req('/api/sim/leaderboard?type=players');

  console.log(JSON.stringify({
    createdPlayers: players.length,
    ticks: 20,
    snapshots,
    duplicateClaimFailures,
    cooldownFailures,
    leaderboardTop5: (leaderboard.rows || []).slice(0, 5),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
