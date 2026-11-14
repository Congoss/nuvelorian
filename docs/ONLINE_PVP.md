# Online duels — production Beta 4.14, 2026-11-14

Online ranked duels are deployed. There are no live PL4 stakes, merchant payouts or token prizes.

The PvP screen has one ranked search button. It searches for a player for 10 seconds, then starts a clearly labeled AI duel. Both use the authenticated player’s actual equipped items, canonical enhancement levels and existing duelStats model, with the same persistent rating, attempts and history. No build selector. Stats freeze when entering the queue; client presets and supplied stats are ignored.

Matchmaking initially allows a 2× difference in attack × HP and a rating distance of 200, increasing by 10 per waiting second. After five seconds it allows a 4× strength difference. Searches expire after 45 seconds without a heartbeat. Polling is 1.2 seconds while visible; the last valid arena remains displayed during a connection error. AI fallback begins at the 10-second search deadline on the player’s next poll. Cancelling at the deadline still cancels; expired, abandoned searches do not start a background AI match. The AI reuses the existing adaptive pilot pool and commits its hidden choice with SHA-256 before accepting the human move.

Five attempts; one attempt returns every eight minutes. Queueing/cancelling costs no attempt; pairing consumes one for each player. Player and AI fallback duels share one rating and history; AI pilots have separate AI profiles and appear with an AI label and ratings earned from completed duels; they are not fake human accounts. Existing shared-damage finger/pencil/poison rules apply. Poison symbols do not consume inventory.

Choices remain server-only until both players submit. The same move can be retried; a changed retry, stale round, wrong match, or third player is rejected. Each round has 30 seconds. One submitted move at timeout wins the match by forfeit; neither submitted is a draw. A match has a 30-round cap and 15-minute deadline. Leaving the arena forfeits; reloading or losing connection preserves the match until its deadline.

`GET/POST /api/pvp/online` derives player identity from the existing session and preserves web origin checks. Queue, moves, HP, attempts, rating and 12-entry histories persist in a dedicated PostgreSQL JSON row locked with `FOR UPDATE` per transaction. The shared lock serializes matchmaking and round settlement across application workers. Production never falls back to memory. A local server uses `.local/pvp-online.json` with serialized atomic file replacement. Finished match snapshots are pruned after one hour; player ratings/history remain. This first implementation shares one database lock; production concurrency/load testing remains a rollout check.

Validation: service and authenticated HTTP tests cover hidden moves, simultaneous requests, identity isolation, authoritative gear, unchanged retries, ratings, timeouts, queue cancellation/expiry, matchmaking expansion, attempt refill, round cap and restart recovery. The file repository was exercised locally; the production PostgreSQL path has not been exercised against the live database. Browser testing uses two independent local pilot profiles and verifies matchmaking, mirrored HP, and resume.

Key files: `server/services/pvp-online.js`, `pvp-online-store.js`, `src/components/game/PvpPanel.jsx`. Local test pilots: `?mockUserId=777000801` and `?mockUserId=777000802` on the local Telegram mock launcher. With a web-mode launcher, add `&platform=telegram` to select mock identities. Existing web guest cookies may take priority: use separate browser profiles when testing player identity.


## NEAR AI and rank rewards

Beta 4.14 uses asynchronous NEAR AI Cloud coaching for future committed moves. Only completed move history is sent; pending player choices are excluded. Valid bounded policies are cached, and actual policy-based moves are labelled NEAR AI. An unavailable provider uses the existing local pilot. See [production verification](PVP_NEAR_AI_VERIFICATION.md).

Resource rewards are granted once per earned rank using durable receipts and the highest rating reached, after a first win. The rank-I base is 40 of each poison size, 10 spins and 5 card plays; each next rank multiplies that base by the rank number. There are no frames or titles in these rank rewards.
