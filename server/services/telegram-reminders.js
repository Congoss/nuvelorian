import { playerDb } from '../data/player-db.js';
import { store } from '../data/store.js';
import { passiveReward } from '../utils/passiveRewards.js';
import { GAME_CONFIG } from '../../src/lib/gameConfig.js';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const RETRY_AFTER_MS = 6 * 60 * 60 * 1000;
const ENERGY_REMINDER_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const ENERGY_REMINDER_RESET_RATIO = 0.3;
const ATTEMPT_FIELD = 'telegram_reminder_attempts';

const copy = {
  uk: {
    afk: '🧪 AFK: Твоя халява дозріла! Забирай, поки не мутувала!',
    energy: '⚡ Енергія: Батарейка повна, ледарю! Час влаштувати хаос!',
    inactive: '👋 3 дні без гри: Ти там живий?! Три дні пропав! Галактика без тебе летить у сраку!',
  },
  en: {
    afk: '🧪 AFK: Your free loot is ready! Grab it before it mutates!',
    energy: '⚡ Energy: Fully charged, you lazy bastard! Time to cause some chaos!',
    inactive: '👋 3 days away: You still alive?! Gone for 3 damn days! The galaxy’s going to shit without you!',
  },
  ru: {
    afk: '🧪 AFK: Твоя халява созрела! Забирай, пока не мутировала!',
    energy: '⚡ Энергия: Батарейка полная, лентяй! Пора устроить хаос!',
    inactive: '👋 3 дня без игры: Ты там живой?! Пропал на три дня! Без тебя галактика летит к чертям!',
  },
};

function languageFor(player) {
  const language = String(player.language || '').toLowerCase();
  if (language.startsWith('ru')) return 'ru';
  if (language.startsWith('en')) return 'en';
  return 'uk';
}

function inactivitySince(player) {
  const exact = Date.parse(player.last_seen_at || '');
  if (Number.isFinite(exact)) return exact;
  const legacy = Date.parse(player.last_login_date || '');
  return Number.isFinite(legacy) ? legacy : null;
}

async function sendTelegramMessage(token, chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(`Telegram sendMessage failed (${result.error_code || response.status})`);
}

export async function processTelegramReminders({ players, now = Date.now(), token, sendMessage = sendTelegramMessage }) {
  if (!token) return 0;
  let sent = 0;
  for (const player of players || []) {
    const chatId = String(player.telegram_id || '').trim();
    if (!/^\d+$/.test(chatId) || player.is_banned || player.is_simulated) continue;
    const reminders = [];
    const state = { ...(player[ATTEMPT_FIELD] || {}) };
    let changed = false;
    const afkReadyAt = Date.parse(player.location_passive_ready_at?.global || '');
    if (passiveReward(player).percent && Number.isFinite(afkReadyAt) && afkReadyAt <= now) {
      reminders.push(['afk', new Date(afkReadyAt).toISOString()]);
    }
    const elapsedMinutes = Math.max(0, (now - Date.parse(player.last_energy_update || '')) / 60_000);
    const regenRate = Number(player.energy_regen_rate) || GAME_CONFIG.ENERGY_REGEN_PER_MIN;
    const maxEnergy = Math.max(1, Number(player.max_energy) || GAME_CONFIG.MAX_ENERGY_BASE);
    const currentEnergy = Number.isFinite(elapsedMinutes)
      ? Math.min(maxEnergy, (Number(player.energy) || 0) + elapsedMinutes * regenRate)
      : Number(player.energy) || 0;
    if (currentEnergy >= maxEnergy) {
      reminders.push(['energy', 'full']);
    } else if (
      state.energy
      && currentEnergy <= maxEnergy * ENERGY_REMINDER_RESET_RATIO
      && Number.isFinite(Date.parse(state.energy_last_sent_at || ''))
      && Number.isFinite(inactivitySince(player))
      && inactivitySince(player) > Date.parse(state.energy_last_sent_at)
    ) {
      delete state.energy;
      player[ATTEMPT_FIELD] = { ...state };
      changed = true;
    }
    const lastSeen = inactivitySince(player);
    if (lastSeen != null && now - lastSeen >= THREE_DAYS_MS) reminders.push(['inactive', new Date(lastSeen).toISOString()]);

    for (const [kind, key] of reminders) {
      const current = state[kind] || {};
      if (kind === 'energy') {
        const lastSentAt = Date.parse(state.energy_last_sent_at || '');
        if (Number.isFinite(lastSentAt) && now - lastSentAt < ENERGY_REMINDER_COOLDOWN_MS) continue;
      } else if (current.key === key && current.sent) {
        continue;
      }
      const attemptedAt = Date.parse(current.attempted_at || '');
      if (current.key === key && Number.isFinite(attemptedAt) && now - attemptedAt < RETRY_AFTER_MS) continue;
      state[kind] = { key, attempted_at: new Date(now).toISOString(), sent: false };
      player[ATTEMPT_FIELD] = { ...state };
      changed = true;
      try {
        await playerDb.flushDirtyPlayers();
        await sendMessage(token, chatId, copy[languageFor(player)][kind]);
        state[kind] = { key, attempted_at: new Date(now).toISOString(), sent: true };
        if (kind === 'energy') state.energy_last_sent_at = new Date(now).toISOString();
        player[ATTEMPT_FIELD] = { ...state };
        await playerDb.flushDirtyPlayers();
        sent += 1;
      } catch (error) {
        console.warn('[telegram-reminders] send failed', { playerId: player.id, kind, error: error.message });
      }
    }
    if (changed) playerDb.flushDirtyPlayers().catch((error) => {
      console.error('[telegram-reminders] player flush failed', error.message);
    });
  }
  return sent;
}

let running = false;
export async function processTelegramReminderTick(now = Date.now()) {
  if (running || !store.players?.length) return 0;
  running = true;
  try {
    await processTelegramReminders({ players: store.players, now, token: process.env.TELEGRAM_BOT_TOKEN });
  } catch (error) {
    console.error('[telegram-reminders] tick failed', error.message);
  } finally {
    running = false;
  }
}
