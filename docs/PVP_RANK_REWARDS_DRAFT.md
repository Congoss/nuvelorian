# PvP rank resources — current configuration

Implemented resource-only rank rewards. Rank I requires a first win; higher ranks use the highest earned rating. Each rank is claimable once via a durable receipt. Frames and titles are not included.

| Rank | Rating | Each poison size | Spins | Card plays |
| --- | ---: | ---: | ---: | ---: |
| 1 | 0 | 40 | 10 | 5 |
| 2 | 72 | 80 | 20 | 10 |
| 3 | 144 | 120 | 30 | 15 |
| 4 | 240 | 160 | 40 | 20 |
| 5 | 360 | 200 | 50 | 25 |
| 6 | 504 | 240 | 60 | 30 |
| 7 | 672 | 280 | 70 | 35 |
| 8 | 864 | 320 | 80 | 40 |
| 9 | 1032 | 360 | 90 | 45 |
| 10 | 1200 | 400 | 100 | 50 |

All amounts derive from src/lib/pvpRankRewards.js; the server uses its shared configuration when granting, and the claim receipt preserves what was actually granted. The filename is retained for existing links.
