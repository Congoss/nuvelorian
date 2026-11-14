# Weapon enhancement: accepted direction, 2026-10-28

The user considers the latest silhouette-driven plasma direction better and asks
to preserve it as the baseline. This is a direction approval, not final acceptance
of every effect. Snapshot: `recovery/weapon-vfx-approved-direction-20261028/`.

## Preserve

- Original PLANET4 weapon art remains recognizable. Translucent energy may cross
  it; a solid replacement color is prohibited.
- A luminous edge, soft halo and irregular tongues of flowing energy follow the
  alpha silhouette. Stronger effects gather near the striking part/tip.
- No DNA helices, regular wrapping lines, isolated static dashes or uniform white
  cloud. Do not regress to a barely visible outline.
- Six milestones: +4 cyan, +6 strong cyan, +8 blue/violet, +10 violet/pink plasma,
  +12 orange/red fire, +15 gold plasma with a white core.
- Intermediate levels retain the previous milestone with a small boost.
- Effects remain in the same scene layer and transform as their weapon. Compare
  all six on the same weapon and inspect at mobile hero size.

## Next design proposals (not yet approved or implemented)

- +10: coherent slow plasma tongues that gather, stretch and dissolve.
- +12: fiery flow, a few drifting embers, and one short, softly fading electrical
  branch roughly every 4–6 seconds, originating at the actual weapon edge.
- +15: gold/white directional energy surge, then 2–3 connected electrical branches
  roughly every 2–3 seconds. The maximum tier differs in choreography, not only hue
  or brightness. No whole-screen flashes or strobing.
- Electrical branches should travel along the blade/striking part and connect
  briefly to nearby contour points, with a narrow bright core and a soft halo.

## Performance direction

The current prototype computes a noise field in JavaScript. Measure its cost; do
not claim phone temperature or battery behavior from desktop testing.

Prefer pre-rendering/caching a cropped short loop for the base plasma, then drawing
infrequent short electrical paths and a few particles over it. Keep caches bounded
to active/recent effects; keep the drawing area near the weapon, not the full hero.
Stop all animation when hidden, offscreen, disabled or covered. Use a reduced mode
with fewer particles and lower frame rate while retaining the silhouette/glow.

Illustrative target: 18 frames at 128×256 RGBA are about 2.25 MiB decoded per loop;
actual cropping and resolution must be checked on each weapon. This is a design
budget, not a measured runtime allocation or a promise of thermal behavior.

Sources consulted:
- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- https://developer.android.com/games/optimize/materials
- https://dev.epicgames.com/documentation/unreal-engine/vfx-optimization-guide?application_version=4.27
