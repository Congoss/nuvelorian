# PLANET4: PvP duel design decisions

Status: working LOCAL-ONLY prototype at http://127.0.0.1:4184/pvp-preview. No deployment. Updated 2026-11-12.

## Confirmed direction

- Portrait mobile mini-game using existing PLANET4 artwork: two reusable astronauts from Cosmo Fishing, not separately drawn equipment costumes.
- Three choices: finger, pencil, small poison. Counter cycle: finger beats pencil; pencil beats poison; poison beats finger. Equal choices draw, no damage.
- ALL THREE choices have ONE shared damage value per combatant, primarily determined by equipped weapon and its enhancement. Winning choice applies the winner's own shared damage; losing means receiving the other fighter's damage. They are not necessarily the same between players.
- Defensive equipment/set determines HP and its enhancement increases survivability. Do not derive HP from the same fighter's own attack, which would cancel offensive progression.
- Small poison is an action symbol here, not an inventory consumable.
- AI-controlled snapshot opponents avoid waiting for a human. Clearly label AI/asynchronous opponents; AI choice must be committed before player choice and cannot read the pending choice.
- UI: expanded central arena; no equipment thumbnail rows; counter explanation behind a small '?' inside top-right arena. Three large buttons at bottom. One shared 'weapon damage' label, not three different damage values.

## Needs calibration before code/release

- Authoritative PvP weapon power table for all weapon IDs, including mixed equipment and older records. Existing PvE item bonuses are not a complete PvP weapon-power table.
- All defensive sets need HP assignments; only early catalogue sets currently have nonzero legacy HP.
- Explicit separate PvP enhancement coefficients; the accepted +5% NPC resale coefficient is unrelated. Previously discussed +10% HP per enhancement was only a draft, not approved or shipped.
- Offensive talents must modify the shared damage rather than encourage one action. Defensive talents may modify HP. Every talent requires an explicit PvP mapping (active/adapted/not applicable); do not blindly import time-based poison/bleed/boss effects.
- Base first model should use deterministic damage. Crit, double strike, bleed, cooldown conversion and pet effects require bounded rules before enabling.
- Matchmaking and AI strength should account for damage, HP, weapon enhancement, armour enhancement, talents and pets. Initial target is 4–6 winning rounds for comparable builds; validate distributions, not just averages.
- No PL4 payouts/stakes or treasury-funded farming rewards are approved for this duel mode.

## Existing calculation artifact

scripts/model-pvp-balance.mjs and output/pvp-balance/ contain 336 profiles calculated through existing PvE weapon/talent functions. They are a BASELINE audit showing why direct PvE transfer fails, not the accepted shared-damage PvP model. Do not use those three separate action damage columns as final PvP values.


## Local prototype implemented

Run `npm run start:pvp`, open `/pvp-preview`. Test with `npm run test:pvp`.

- Dev-only route and Vite middleware, loopback host/origin checks. Build excludes the preview route and dev middleware. No production server/API edits, no wallet calls, no game state writes, no rewards.
- Authoritative in-memory server match per tab session; 30-minute expiry, 30-round cap, exact round replay, rejected changed replays, no active-match reroll. Restarting dev server expires prototype sessions.
- Three NPC pilots: balanced, historical-frequency counter, and bluffing. This prototype uses local algorithms, not NEAR AI Cloud, and does not yet provide asynchronous human snapshots.
- Server chooses and SHA-256 commits with a nonce before accepting the player's action. Client checks revealed commitments. Only previous choices feed the adaptive pilot.
- Prototype common weapon power: 160 + 4 * set hit stat, minimum 100. No weapon: 100. Weapon enhancement multiplies damage by 1 + .05 * level. Effective offensive talent levels give .25% each, capped 30%; pet small-poison bonus gives a bounded shared bonus up to 10%. All actions use this identical final damage.
- Defensive base slot HP: head120 / armor210 / legs160 / hands80 / boots70, scaled by item's tier power / 200 and its own enhancement factor 1 + .05 * level. Base hero HP200. Mixed gear supported by stats function; selector currently offers seven full boss sets.
- Preview talent allocations 0/50/100 spend real points through applyTalentUpgrade and obey prerequisites. No mutation of the player's real talents.
- All coefficients above are LOCAL experimental PvP rules, not changes to PvE or NPC resale. 84 preset builds require 3–5 successful equal-power hits; real matchup and player testing still required.
- UI: same-style astronaut sprite sheet, large arena, shared damage, three actions, help dialog, short reaction animations, language selector uk/ru/en, build controls, reduced-motion support and scrollable small-screen layout. No forced turn timer in this first version.
- Validation: 7 unit/invariant tests, completed local API match and resume/replay/proof checks, dev page/assets/module HTTP200, production build passed. Browser automation unavailable in the current environment; no claimed visual browser QA.

## Merchant bounties (local prototype, 2026-11-12)

**Parked until after the hackathon:** the `For $PL4` tab is hidden (`SHOW_TOKEN_TAB=false` in PvpLobby.jsx) and bounties are off unless `PVP_BOUNTY_ENABLED=1`. Code and tests are kept.

Tor (smith) and Grym (hunter) — the two AI market traders — can be challenged from the `For $PL4` lobby tab.

- Free entry; a loss, draw, abandon or expiry costs the player nothing. There is no player stake, so this is not a wager.
- A win pays a small PL4 prize funded only from that merchant's **realised market profit** (sale price − 5% fee − cost basis; forged/seed stock counts 0, same rule as `treasuryState`). No profit → no prize offer, the card shows an empty till.
- Limits (env-overridable): prize $0.05 (`PVP_BOUNTY_PRIZE_USD`), at most 50% of realised profit (`PVP_BOUNTY_PROFIT_SHARE`), $0.50/day per merchant (`PVP_BOUNTY_DAILY_USD`, counted in whole prizes), 1 prize per merchant per player per day (`PVP_BOUNTY_PER_PLAYER_DAY`), opt-in `PVP_BOUNTY_ENABLED=1`.
- The offer is shown before the fight; the ledger re-checks profit share and caps at payout and is idempotent per match.
- Merchant duels use the same commit-reveal AI, attempts and cooldown as ranked duels.
- Payout is **simulated**: awards are recorded as `pending_payout` in memory. Profit is read from the local market state (`LOCAL_GAME_STATE_PATH`); `PVP_BOUNTY_DEMO_PROFIT_USD` adds demo profit for screen recordings only. A real payout would be an `ft_transfer` from `tor.nuvelorian.near` / `grym.nuvelorian.near` through the existing market signer; not wired and not deployed.
- Code: `server/services/pvp-bounty.js`, `server/services/pvp-duel.js`, `scripts/pvp-prototype-plugin.mjs`, `src/pages/PvpLobby.jsx`, `src/pages/PvpPreview.jsx`. Tests: `tests/pvp-bounty.test.mjs` (6) + `tests/pvp-duel.test.mjs` (8).
