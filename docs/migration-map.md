# Base44 Migration Map

## Current persisted entities

### `PlayerProfile`

Core player progression and inventory state:

- identity: `username`
- progression: `level`, `xp`, `xp_to_next_level`, `hero_tier`
- economy: `tentacles`, `safe_tentacles`, `safe_capacity`, `premium`
- stamina loop: `energy`, `max_energy`, `energy_regen_rate`, `last_energy_update`
- passive income: `tentacles_per_hour`, `last_income_collect`
- combat stats: `attack_power`, `defense_power`
- upgrade levels: `attack_level`, `defense_level`, `income_level`, `stash_level`
- raid stats: `total_raids`, `successful_raids`, `total_stolen`, `total_lost`
- boss stats: `total_boss_damage`, `boss_kills`, `best_medal`, `boss_hits_today`
- content state: `collection_items`, `collection_boxes`, `claimed_collection_rows`, `claimed_collection_full`
- gameplay state: `active_location`, `task_completions`, `keycards`, `weapon_cooldowns`
- meta state: `login_streak`, `last_login_date`, `used_promo_codes`, `clan_name`

### `BossFight`

Shared global boss state:

- `boss_id`, `boss_name`, `location`
- `max_hp`, `current_hp`
- `status`, `started_at`, `ended_at`

### `BossDamageLog`

Per-player contribution inside a boss fight:

- `fight_id`
- `player_email`, `player_name`
- `damage`, `hits`

### `AttackLog`

PvP/raid notification history:

- `attacker_email`, `attacker_name`
- `defender_email`, `defender_name`
- `success`, `amount_stolen`
- `is_revenge`, `seen`

## Recommended backend replacement

For Telegram Mini App migration, the easiest durable split is:

1. `players`
2. `boss_fights`
3. `boss_damage_logs`
4. `attack_logs`
5. `sessions`
6. `wallet_links`

## Identity replacement

Current ownership depends on Base44 `created_by` / `user.email`.

Recommended replacement:

- primary user id: Telegram `user.id`
- public handle: Telegram `username`
- optional wallet bindings:
  - TON address
  - NEAR account id

## Important migration note

Right now some gameplay writes happen directly from the client. For blockchain-ready gameplay, reward-critical actions should move server-side before wallet or token logic is added.
