# Planet4 — demo video script (about 2 minutes)

Record in English, or add English subtitles. Use the real game where possible. Never show `.env` files, the
admin panel, wallet seed phrases, or private keys. Telegram Stars are not shown.

| Time | Screen | Voice-over / caption |
| --- | --- | --- |
| 0:00–0:12 | Game: boss fight, loot drop, equipment screen | "Planet4 is a live boss-fighting game. Every fight drops gear, and now that gear has a real market on NEAR." |
| 0:12–0:25 | Web sign-in with a NEAR wallet (NEP-413), PL4 ticker | "Players sign in with a NEAR wallet, no Telegram needed. Prices are in PL4, our NEAR token, quoted live." |
| 0:25–0:45 | Market: list a spare item; the AI hunter Grym buys it; the feed shows the reason | "Players trade with each other. Two AI merchants with their own NEAR accounts take part. Grym only buys to replace stock he has sold, and never pays more than 80% of the revenue from that sale." |
| 0:45–0:58 | Try a second sale to the agents → rejected | "One farmer can't drain them: one agent sale per seller per day, a shared budget, identity grouping, and items sold by an agent can never be sold back to one." |
| 0:58–1:12 | Missing set piece → Tor forges and lists it at a premium → player buys | "Tor, the smith, covers shortages. If nobody sells a piece, he forges it, priced above the player level so player drops sell first." |
| 1:12–1:25 | NearBlocks: PL4 transfer of the trade + 5% fee to nuvelorian.near; Tor's signed tx | "Payments are real PL4 on NEAR mainnet. The server checks the final receipt before delivering, and the merchants sign their own transfers." |
| 1:25–1:38 | AI traders tab → Simulate 7 days; feed with model lines | "Decisions come from a rules engine. A model on NEAR AI Cloud picks among safe options, but it can never invent a price or sign anything." |
| 1:38–1:50 | NFT holder rewards: Legion pet claim | "NFT holders get in-game rewards, checked against on-chain ownership." |
| 1:50–2:00 | PvP preview (labelled "prototype"), then repo + `npm run test:market` passing | "Next: PvP against the same AI merchants. All code is open, and the tests run without keys." |

## Shots to capture separately

1. One real closed-pilot trade: listing → wallet `ft_transfer` → item delivered, plus its NearBlocks page.
2. The terminal: `npm ci && npm run test:market && npm run demo:market`.
3. The 7-day simulation chart.
4. Screenshots for the X post: market, AI feed, NearBlocks tx, NFT pet.

## Local fallback

If the live pilot is unavailable, record `npm run start:market` (http://127.0.0.1:4183, simulated PL4) and label it
"local demo, simulated PL4". Don't present simulated trades as mainnet trades.
