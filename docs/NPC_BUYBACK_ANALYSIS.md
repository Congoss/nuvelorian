# NPC buyback analysis — 2026-11-12

No prices or deployment changed. Currency: tentacles, the standard game resource. No farm/building is assumed. Analysis uses the deployed-source baseline under deploy/market-mainnet-build, not pending local gameplay changes. Runtime admin reward overrides have not been independently read.

## Verified mechanics

- Existing NPC payout is a provisional 100 * (1 + enhancementLevel), clamped to +15; it ignores boss, rarity, and drop probability (server/services/local-market.js).
- Shkraban boss8: 7,000,000 HP. With baseline boss_v2 formula, solo 100% actual damage, rank 1, daily multiplier 1, no first-kill bonuses: tentacles 4,793,473–6,485,285, midpoint 5,639,380 (src/lib/bossRewardSystem.js).
- Resource reward scales with actual damage share. Free finger/pencil attacks, inventory poisons, talents, gear and clan bonuses mean there is no single fixed cost per boss kill.
- Shkraban baseline gear chance: (0.03 / 0.041) * (0.041 + 0.01) = 3.731707% at rank 1. About 26.8 eligible kills per any gear success, NOT a guarantee. Rank >100: 3%; top10 and top100 have intermediate bonuses. Threshold 1,000 actual damage qualifies for special rolls on this boss. Gear probability is not proportional to damage share.
- Gear resolver chooses an unowned piece; all six already owned produces a 250–500 tentacles fallback. Selling a piece makes it eligible to drop again. First-boss gear has separate first-kill/pity rules (up to eight misses), not a guaranteed piece on every kill.
- Daily resource reduction begins after 100 prior kills (gold medal), but special-drop selection does not multiply by dailyMultiplier. NPC accepts non-transferable-to-market farm drops via isScrappableItem unless separately bound. New large payouts need their own budget/anti-farm analysis.
- Daily shop prices: small/medium/large poison 27,000/56,000/90,000 tentacles; energy100 =20,000. Default starting shop gear 10,000 is not a late-game anchor.
- The market USD/PL4 estimate is a separate heuristic, not a tentacles exchange rate. Shkraban +0 estimates range $9.18–$14.04 by slot; pet-toaster baseline $24. No verified direct conversion from a $26 listing to NPC currency.

## Explicit proposed design anchor, not an existing rule

Set a full six-piece +0 set's liquidation value near one midpoint solo boss tentacles reward, or one piece = midpoint / 6, rounded for UI. This is a balance policy choice, not a measured market value or a claim of abuse-proof pricing.

| Set | Midpoint solo reward | Proposed +0 piece |
|---|---:|---:|
| Cardboard | 2,850 | 500 |
| Night Disinfector | 32,386 | 5,000 |
| NUVELOR | 476,614 | 80,000 |
| set4 | 674,033 | 110,000 |
| set5 | 3,014,375 | 500,000 |
| Anubis | 3,691,841 | 615,000 |
| Shkraban | 5,639,380 | 940,000 |

At rank1 solo, expected extra emission from one gear roll sold at midpoint/6 is ~0.62–0.65% of midpoint base boss reward for ordinary bosses. This estimate DOES NOT hold for arbitrarily many low-damage participants: every eligible participant rolls gear independently. A fixed-price table alone is not an anti-abuse mechanism. Quantify participant counts and repeat farming before enabling these payouts; add a bounded buyback issuance policy or authoritative drop contribution provenance.

Enhanced items and pets require separate liquidation rules; do not blindly reuse dollar-denominated enhancement estimates or cosmetic rarity multipliers. Keep fixed purchase sources excluded, and verify old daily-shop gear provenance because the shop grant currently stores id/slot/setId without sourceType.

Calculation scripts: .local/analyze-npc-economy.mjs and .local/npc-price-proposal.mjs. They perform source-based deterministic calculations only; no player state, blockchain transaction or Telegram message is changed.
