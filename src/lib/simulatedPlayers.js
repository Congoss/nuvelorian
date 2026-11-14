export const SIM_BOT_FLAG = true;
export const SIM_BOT_TYPE = 'ironclaw_simulated_player';
export const SIM_MAX_BOTS_DEFAULT = 100;

export const SIM_MODES = {
  casual: 'casual',
  active: 'active',
  whale: 'whale',
  newbie: 'newbie',
  boss_focused: 'boss_focused',
};

export const SIM_NEWBIE_QUESTS = [
  { id: 'newbie_part_1', goal: 3, type: 'missions', reward: { tentacles: 100, xp: 40 } },
  { id: 'newbie_part_2', goal: 150, type: 'boss_damage', reward: { energy: 30, xp: 60 } },
];

export const SIM_DAILY_TASKS = [
  { id: 'daily_energy_30', type: 'energy_spent', goal: 30, reward: { tentacles: 80 } },
  { id: 'daily_missions_3', type: 'missions', goal: 3, reward: { xp: 35 } },
  { id: 'daily_boss_hit_1', type: 'boss_hits', goal: 1, reward: { roulette_bonus_spins: 1 } },
];

export function isSimulatedPlayer(player) {
  return Boolean(player?.isBot) && player?.botType === SIM_BOT_TYPE;
}

export function getAvailableModes() {
  return Object.values(SIM_MODES);
}
