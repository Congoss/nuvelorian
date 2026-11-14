# Hackathon baseline reconstruction

The project had no version control before the hackathon. The `pre-hackathon` tag is rebuilt from what
existed before the NEAR Hackathon announcement (2026-10-19 19:02 UTC); the last pre-announcement build is BETA 2.49
(built 2026-10-15). Method, per file in the published tree:

1. Last modified before the announcement → included unchanged (2276 files).
2. Modified later, and an older copy exists in a deploy package ≤ 2.49 → that copy is used (198 files).
3. Created after the announcement → not in the baseline; it is hackathon work (2013 files).
4. Modified later, created earlier, no older copy recoverable → **the current version is put in the baseline**,
   so the diff never claims old code as new. These changes are therefore *not* credited (7 files).

Files in group 4:
- `scripts/halloween-economy.mjs`
- `src/components/game/HalloweenEventScene.jsx`
- `src/components/game/PublicPlayerProfile.jsx`
- `src/lib/halloweenEquipment.js`
- `src/lib/halloweenEvent.js`
- `tests/halloween-event.test.mjs`
- `tests/halloween-sources.test.mjs`
