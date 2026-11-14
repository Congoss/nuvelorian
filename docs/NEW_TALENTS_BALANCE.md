# Advanced talents — implemented locally, not released

- Unlock: all 60 original talents at level 10 (600 points). Twenty new talents, ten levels each.
- Levels cost 2, 4, …, 20 points; talent a10 costs 10, 11, …, 19. New tree: 2235 points; both trees: 2835. Reset refunds actual weighted costs.
- Two Fingers and Enema replace Finger/Pencil after learning a01/a02. Final direct damage +20%, original equipment, talents, bleed and cooldown family retained. Switching back is free and does not clear cooldown.
- Shkraban armor: 15% physical block, 20% poison block, one roll per whole x1/x5/x10/x100 batch. Blocked batches have zero direct damage and no hit effects; existing bleed continues.
- Breach is personal per fight: base 10 seconds, a04 adds one second per level (maximum 20). Refresh replaces expiry; durations do not stack. Poison breach benefits subsequent batches.
- Additional physical hits cannot recursively generate extra hits or cooldown resets. Double-hit chance adds to the original Finger talent; triple replaces a successful double.
- Marks cap at 5 + a08 level (maximum 15). Original per-mark bonus remains. Overdose affects only flask mark-consumption bonus, up to +50%. Preservation rolls per flask.
- Poison critical hits remain per dose. Acid Blood adds critical chance while bleeding. Last Drop stacks after a batch with no critical doses, at most five times, and clears on a critical batch.
- No Misfire rolls once per blocked batch and returns only actually consumed inventory. Blocked batches award no damage XP or hit progress.
- Poison bleed extension/refresh rolls once per batch, caps remaining duration at 60 seconds, preserves stronger wounds, longer existing duration and unpaid ticks.
- Armor/breach buff icons open localized help; first Shkraban fight opens illustrated help. Acknowledgment persists per player.

Validation: unit/API checks cover unlock, weighted prices/refunds, shared cooldown, damage, batch armor, breach expiry, extra hits, marks, refund and bleed. Seeded simulation covers no gear and enhanced Anubis gear; production balance still needs playtesting. Browser QA was unavailable because the native bridge rejected initialization.

No version bump, packaging, deployment, chat announcement or gift mail.
