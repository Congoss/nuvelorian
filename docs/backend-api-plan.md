# Remote Game API Plan

## Current adapter behavior

`src/services/gameApi/index.js` now selects the active provider:

- `base44GameApi` for the current working data source
- `remoteGameApi` for the future backend path

Selection rule:

- if `VITE_APP_PLATFORM=telegram` and `VITE_API_BASE_URL` is set, the app switches to `remoteGameApi`
- otherwise it stays on `base44GameApi`

## Recommended first backend endpoints

### Session / auth

- `POST /auth/telegram/verify`
- `GET /auth/me`

Frontend request headers already prepared in `remoteGameApi`:

- `X-Telegram-Init-Data`
- `X-Telegram-User-Id`
- `X-Telegram-Username`
- `X-Telegram-Mock-User` for local mock mode only

### Player profile

- `POST /players/bootstrap`
- `GET /players/me`
- `POST /players`
- `PATCH /players/:id`
- `GET /players`
- `GET /leaderboard`

Bootstrap responsibility:

- create player if missing
- hydrate passive income
- hydrate current energy
- return normalized progression state

### Wallets

- `GET /wallets/me`
- `POST /wallets/ton/proof-payload`
- `POST /wallets/ton/proof-verify`
- `POST /wallets/ton/connect`
- `DELETE /wallets/ton`

Current local backend skeleton already supports:

- loading current linked wallet state
- issuing TON proof payload sessions for TonConnect
- storing proof session results and proof metadata
- linking one TON wallet per player
- preventing the same TON address from being linked to multiple players
- unlinking the current TON wallet

### Boss fights

- `GET /boss-fights/active`
- `GET /boss-fights/:id`
- `POST /boss-fights`
- `POST /boss-fights/:id/attack`
- `PATCH /boss-fights/:id`
- `GET /boss-fights/:id/damage-logs`
- `GET /boss-fights/:id/damage-logs/me`
- `POST /boss-damage-logs`
- `PATCH /boss-damage-logs/:id`

Current local backend skeleton already handles for boss attack:

- weapon cost deduction
- cooldown write
- damage roll
- boss HP update
- personal damage log update
- kill reward summary when the boss dies

### Attack logs

- `GET /attack-logs?defenderEmail=...`
- `POST /attack-logs`
- `PATCH /attack-logs/:id`

### Raid resolution

- `POST /raids/resolve`

Current behavior in the local backend skeleton:

- validates target
- validates attacker energy
- deducts raid energy
- resolves success/failure
- updates attacker and defender state
- creates attack log

## Response shape

The frontend accepts either of these response formats:

- raw JSON payload
- envelope format: `{ "data": ... }`

## Important implementation note

When the backend arrives, reward-critical actions should be server-owned:

- raid resolution
- boss damage write validation
- reward issuance
- promo code claims
- inventory mutations

That will make TON/NEAR reward logic much safer to add later.
