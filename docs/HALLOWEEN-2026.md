# Halloween 2026

Source backup: E:/testbase44/recovery/before-halloween-20261019-170209.
Window: 19 October 00:00 UTC through 3 November 00:00 UTC (exclusive).
Configuration: src/lib/halloweenEvent.js. All balances, drops and purchases are server-authoritative.

- Tentacles: 20,000 per pumpkin; 15 allowance per UTC day; unused allowance banks up to 45. No paid allowance increases or paper exchange.
- Bosses: 35% chance; maximum 20 pumpkins/day; guaranteed on fifth unsuccessful eligible kill. Direct damage must meet the normal participation threshold. Shared indirect damage does not qualify. One drop roll per settled fight; opening a box does not roll again.
- Final quests: 50% chance at completion of the full final-quest cycle; cap 20/day; pity at 3 attempts. MAX uses the same authoritative missions.
- Successful fishing: 50% chance; cap 8/day; pity at 3 successful catches. Fishing extended to the Halloween end.
- Non-checkin daily task claims: guaranteed 1; cap 12/day. Repeated claims do not award twice.
- Find pumpkins from boss + quest + fishing in one UTC day: automatic 10-pumpkin bonus, once per day.
- Activity milestones: 10 / 25 / 50 / 100. Exchanged pumpkins never count toward milestones or rankings.
- Clan: 100 activity pumpkins unlock a one-time personal reward (100 energy + 3 small poison). Server calculates clan totals; changing clans cannot claim again.
- Shop purchase limits last for the event. No direct sale of pumpkins. Activity score remains after spending.
- Last-hit status does not affect pumpkin drops. Key chance and key pity remain unchanged.
- Boss reward eligibility now checks the actual invited player ID; merely having someone invited no longer enables rewards for unrelated clan contributors.

No deployment or patch archive created. Browser visual QA unavailable because the in-app browser bridge rejected the connection; JSX compilation, Vite build and API checks used instead.

Exclusive shop: Pumpkin Talisman (accessory) 120 pumpkins, requires 80 activity; Pumpkin Frankie (pet) 180 pumpkins, requires 140 activity. Each once per event, inventory ownership checked. Shared metadata in halloweenEquipment.js. Economy model: scripts/halloween-economy.mjs. Active scenario: 10 eligible boss kills, 3 final quest cycles, 6 fishing casts (80% catch), 6 daily task rewards => expected 24.05 activity pumpkins/day, 39.05 including full daily exchange. This is an estimate, not a guaranteed payout. Cap 85 including catchup daily tasks and 15 exchange; banked exchange allows up to 115 on one day.
