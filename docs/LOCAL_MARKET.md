# Local market

Run `npm run start:market`.

Closed local pilot: `.local/market-access.json` contains the authoritative `telegramIds` allowlist. Current invited tester: `<tester-id>`; open `http://127.0.0.1:4183/?mockUserId=<tester-id>`. The launcher creates an isolated demo profile for invited IDs with test inventory/funds, preserving existing saves. Uninvited identities cannot read or mutate market, simulation or testnet routes. The navigation button is hidden without server permission. Editing the list takes effect on the next request, without restarting. An empty or invalid file denies everyone; the file overrides `MARKET_TEAM_TELEGRAM_IDS`. Without a file, the launcher enables only its two synthetic localhost demo IDs by default.

This remains loopback-only. Mock identities are convenient for local tests and are not authentication for an internet-facing team pilot. Remote team access requires a separately approved staging setup with genuine verified login and isolated test data; do not expose this mock server or use `mockUserId` as a team password. No deployment or real payments were performed.

- Web buyer: http://127.0.0.1:4183/?mockUserId=880001
- Web seller: http://127.0.0.1:4183/?mockUserId=880002
- Telegram simulation: http://127.0.0.1:4183/?mockUserId=880001&platform=telegram
- Supplied mechanics example: http://127.0.0.1:4183/market-example/index.html

Uses an isolated `.local/market-game-state.json`, API port 3011, frontend port 4183. The two seeded demo players receive $100-equivalent simulated P4 once at setup; this is not withdrawable money. NPC prices are provisional: 100 scrap × (1 + enhancement). Legacy sample listings are converted to the local startup USD reference once. Existing local saves are preserved.

P4 prices use integer hundredths. Seller fee is 3%, rounded up to the next hundredth. Local fees credit the configured simulated treasury agent; the real-chain recipient is unset and no token transfers are implemented. Purchases, escrow, cancellations and fees commit together to local storage. Equipped, bound, locked, stacked and ambiguous duplicate-ID items are excluded. Buying an already-owned catalog ID is rejected because the current game equipment model uses catalog IDs as inventory IDs.

The launcher disables production database and bot connections, does not start payment workers and rejects payment/wallet mutations. Market endpoints require an explicit local-only opt-in and loopback requests, and refuse database-backed or production operation. Market navigation is development-only. Telegram simulation exposes NPC sales only. No deployment or version change.

Checks: `node --test tests/local-market.test.mjs`.

## AI market players

`npm run start:market` also starts AI players (`MARKET_AGENTS`, default 2, max 5) as ordinary local players. They trade only through `marketCommand` (same escrow, fee, idempotency and ownership checks as people). Code: `server/services/market-agents.js`; prices: `src/lib/marketPricing.js` (docs/MARKET_ECONOMY.md).

Default pair for the demo:
- **Тор Кузнец (smith)** — sells; forges a tradable boss-set piece when the market has none, subject to stock limits. Forging is free by default (`MARKET_AGENT_FORGE_COST_RATIO`, e.g. 0.6 to burn 60% of the estimate); pets are never forged. The concept currently allows all tradable gear sets to be forged at a premium.
- **Грым Скупщик (hunter)** — buys cheap listings from players and resells; receives the 3% seller fees (treasury).
Optional with `MARKET_AGENTS=3..5`: Ирис Коллекционер, Вексель Маркетмейкер, Мила Паникёр.

Anti-abuse rules (env overrides in brackets):
- Agents buy at ≤80% of the estimate and sell at ≥90%: buy-from-agent → sell-to-agent always loses money.
- Items sold by an agent carry `agentSoldAt`; agents do not buy them for 7 days (`MARKET_AGENT_RESALE_DAYS`).
- Only players level ≥30 (`MARKET_AGENT_MIN_SELLER_LEVEL`) with accounts ≥7 days old (`MARKET_AGENT_MIN_ACCOUNT_DAYS`; the local launcher sets 0) can sell to agents, 1 item a day each (`MARKET_AGENT_SELLS_PER_PLAYER_DAY`).
- The estimate uses only trades between two different human players: median of the last 6, ±30% of the price list at most. Agent trades and self-dealing do not move it.
- Max $1 per buy or forge (`MARKET_AGENT_MAX_BUY_USD`), $2 a day for all agents together (`MARKET_AGENTS_DAILY_USD`).

Profit rules: every item an agent buys or forges records `agentCost`; the agent never lists it below cost + 5% (covers the 3% fee). Agents hold at most 6 items (`MARKET_AGENT_MAX_HOLDINGS`) and skip buying an item when 2+ other copies are already listed. The AI traders tab shows treasury value, profit (value − start) and today's limit. Simulated week, 6 players, default limits: treasury $23.38 → $28.0–28.8, no sale below cost (tests/market-agents.test.mjs).

Supply: first-boss drops (cardboard set, pet-bot) need no keycard, so they are scrap-only (NPC for tentacles, never P4). Existing `marketBound` flags are enforced (usable, scrap-only). The proposed gold-medal daily drop-binding curve is not wired into server/app.js in the audited checkout; it must not be advertised as implemented.

Treasury: agents start with $20 of PL4 in total (`MARKET_AGENTS_TREASURY_USD`), split by role. Seller fees refill it. If cash + stock at cost basis falls below 50% of the start, agents pause and the feed says so. `MARKET_AGENTS_ENABLED=0` stops them entirely. Unsold listings are re-listed 5% cheaper, at most 4 times, never below the floor.

Optional LLM: `MARKET_AGENT_LLM_URL` (OpenAI-compatible, e.g. NEAR AI Cloud), `MARKET_AGENT_LLM_KEY`, optional `MARKET_AGENT_LLM_MODEL`, `MARKET_AGENT_LANG`. The rules produce candidate actions with fixed prices; the LLM only picks one or waits and adds a line. Invalid replies fall back to the rules. `MARKET_AGENT_<KEY>_NEAR` shows a NEAR account per agent; no on-chain transfers are made.

Web market: **AI traders** tab (agents, balances, treasury, today's limit, live feed), AI badge on agent listings, market estimate in item dialogs; refresh every 5 s while idle. Telegram unchanged.

Checks: `node --test tests/market-agents.test.mjs tests/local-market.test.mjs`.

## Safety audit and reproducible rehearsal (2026-11-11)

Use `npm run test:market` for the full focused suite, `npm run demo:market` for an offline narrated smoke scenario, and `npm run simulate:market` for the fixed-seed seven-day simulation. The generated `.local/hackathon/week-simulation.json` contains simulated cash and stock-at-cost metrics, not a profitability forecast.

All agents share the daily two-copy cap (`MARKET_AGENTS_ITEM_BUYS_PER_DAY`), spending cap, and verified-identity seller counters. Quote-based decisions are rechecked inside the transaction after any LLM response. Limits, cost basis, journal, fee income and feed are persisted with the trade. Local store initialization explicitly restores this metadata. Zero daily budget prevents paid agent purchases.

Same verified wallet or Telegram identity is grouped for seller limits. Price samples exclude known linked accounts, unknown counterparties and agent trades; repeated pairs count only once in the median/demand sample. Independent Sybil wallets still need additional risk controls before real-fund use.

The public market API refuses agent identities, strips private cost basis and identifies all funds as simulated with withdrawals disabled. Old experimental saves are not valid real-fund ledgers. The local launcher seeds only synthetic demo users with account age and low-tier stock; it does not change real player accounts or waive the general seller-age rule. Read-only wallet checks run in the background so unreachable RPC does not prevent opening the game.

See `docs/HACKATHON_PLAN.md` for stage boundaries and missing on-chain work, and `docs/HACKATHON_DEMO.md` for the recording script.
