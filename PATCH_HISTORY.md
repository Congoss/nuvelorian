# Patch history

- BETA 0.01 · 2026-10-07 · Version displayed on loading screen and included in client diagnostics.

Before each new uploadable patch, run `node scripts/bump-patch-version.mjs "description"` once, then build. Include src/lib/appVersion.js in the patch alongside dist and server files. Rebuilding the same patch does not increment the version.

- BETA 0.02 · 2026-10-07T18:14:35.590Z · Fix sponge drag lag and persist puddle cleanup through server action

- BETA 0.03 · 2026-10-07T18:19:44.259Z · Android boss scene: static moth composite and reduced GPU effects

- BETA 0.04 · 2026-10-07T18:36:38.403Z · Separate operator password and server permissions; hide owner-only sections and full reset

- BETA 0.05 · 2026-10-07T18:43:17.853Z · Fix boss screen translations to follow player language and translate remaining Ukrainian labels

- BETA 0.06 · 2026-10-07T18:46:40.753Z · Expose public Battle Pass tier so paid player names appear gold to other players

- BETA 0.07 · 2026-10-07T18:51:18.519Z · Use silver player names for Epic Battle Pass and gold for Legendary

- BETA 0.08 · 2026-10-07T18:57:58.628Z · Add roulette x10 with ten independent draws, exact costs and one recoverable reward batch

- BETA 0.09 · 2026-10-07T19:17:55.757Z · Unlock roulette x10 at level 30 with server enforcement and localized conditions hint

- BETA 0.10 · 2026-10-07T19:41:32.822Z · Add visible localized back button above referral banner

- BETA 0.11 · 2026-10-07T19:44:33.224Z · Move compact referral back button into banner

- BETA 0.12 · 2026-10-07T19:49:47.774Z · Fix other clan banners in leaderboard: expose public logo and prefer clan record selection

- BETA 0.13 · 2026-10-07T19:54:14.478Z · Translate stored default clan descriptions; localize clan profile and join status; block joining while already in a clan

- BETA 0.14 · 2026-10-07T20:05:42.327Z · Add lightweight AIRDROPS placeholder icon opposite camp chat

- BETA 0.15 · 2026-10-07T20:10:18.765Z · Move AIRDROPS beside Battle Pass using matching icon size

- BETA 0.16 · 2026-10-07T20:14:48.601Z · Align AIRDROPS and Battle Pass icon heights and labels

- BETA 0.17 · 2026-10-07T20:21:23.561Z · Bound Battle Pass and AIRDROPS to compact equal-height icon boxes; fix oversized artwork

- BETA 0.18 · 2026-10-07T20:27:02.014Z · Preserve accumulated reward energy when upgrading talents and triggering combat refunds

- BETA 0.19 · 2026-10-07T20:35:23.492Z · Show player clans and Battle Pass name colors in boss leaderboards and shared podiums

- BETA 0.20 · 2026-10-07T20:58:55.081Z · Show boss defeat and actual final attacker in boss chest mail in UA/RU/EN

- BETA 0.21 · 2026-10-07T21:11:50.486Z · Update fishing single and combo rewards, twenty-spin combo and +10 CA random bonus

- BETA 0.22 · 2026-10-07T21:17:32.680Z · Expose other player boss medals and add per-boss win counts with medal progress in admin

- BETA 0.23 · 2026-10-07T21:21:15.858Z · Protect mobile fullscreen controls, reserve profile scroll space above navigation and open X authorization externally

- BETA 0.24 · 2026-10-07T21:37:45.577Z · Fix navigation label overlap, referral leaderboard counts, duplicate clan listings and allow missed check-ins for days 1-2

- BETA 0.25 · 2026-10-07T21:43:29.099Z · Count referral relationships for all players even when inviter friend lists are missing

- BETA 0.26 · 2026-10-08T06:01:56.694Z · Tutorial and localization fixes, explicit roulette claims and settings return, isolated daily progress, beta BP extension and referral filtering

- BETA 0.27 · 2026-10-08T06:20:07.813Z · Shorten poison flask names in Ukrainian, Russian and English

- BETA 0.28 · 2026-10-08T06:22:16.402Z · Separate boss attack controls from bottom navigation and keep mail above equipment controls

- BETA 0.29 · 2026-10-08T06:23:33.177Z · Translate Starter Pack description and newbie quest Done and Go buttons

- BETA 0.30 · 2026-10-08T06:26:36.075Z · Fix final bleed ticks and prevent HP threshold transitions from reverting combat status; localize effect labels and show bleed duration

- BETA 0.31 · 2026-10-08T06:27:47.431Z · Keep Done and Go labels in all newbie quest languages

- BETA 0.32 · 2026-10-08T06:31:13.013Z · Fill modal width for newbie quests and partner tasks

- BETA 0.33 · 2026-10-08T06:35:34.066Z · Update partner subscription instructions and verification messages in three languages

- BETA 0.34 · 2026-10-08T06:40:33.183Z · Prevent unchanged daily progress reads and public leaderboard views from queuing unnecessary player database writes

BETA 0.34 also removes a redundant mail chest profile write/refresh and keeps chest close available during requests; timeout errors localized.

- BETA 0.35 · 2026-10-08T07:50:07.527Z · Refresh energy and roulette artwork; replace free-spin wheel prize with an empty Shit happens sector

- BETA 0.36 · 2026-10-08T08:08:56.552Z · Convert legacy pending free-spin prizes to nothing and localize Shit happens confirmation in three languages

- BETA 0.37 · 2026-10-08T08:14:11.154Z · Refresh empty roulette sector artwork

- BETA 0.38 · 2026-10-08T08:17:28.900Z · Use standalone Shit happens icon in roulette result popup

- BETA 0.39 · 2026-10-08T08:21:06.132Z · Hide boss claim tutorial until claim button exists and reduce reward hint height

- BETA 0.40 · 2026-10-08T08:32:06.843Z · Reduce mobile scene animation and blur cost; suspend hidden-page polling and reduce idle profile refresh frequency

- BETA 0.41 · 2026-10-08T08:35:00.087Z · Display bonus spin count and daily free spin availability inside roulette in UA RU EN

- BETA 0.42 · 2026-10-08T08:39:29.873Z · Rename roulette spin button to localized Lets go with available spins and remove duplicate counter

- BETA 0.43 · 2026-10-08T08:43:24.915Z · Remove duplicate empty roulette prize captions and localize next-time luck joke

- BETA 0.44 · 2026-10-08T08:53:02.475Z · Change roulette odds to energy 30 percent and empty result 40 percent

- BETA 0.45 · 2026-10-08T09:11:17.774Z · Show server-confirmed one-second bleed damage with short blood drops on personal bosses

- BETA 0.46 · 2026-10-08T09:24:37.211Z · Move boss name below fight timer and use supplied bleed and toxic mark status icons

- BETA 0.47 · 2026-10-08T10:09:23.496Z · Replace press-and-release talent upgrades with readable bottom detail sheet and explicit upgrade action

- BETA 0.48 · 2026-10-08T10:16:51.726Z · Fix talent sheet button labels stacking and show current base attack damage under talent artwork

- BETA 0.49 · 2026-10-08T10:19:17.485Z · Make lazy panel loading fallback fill available width and center spinner

- BETA 0.50 · 2026-10-08T10:22:00.542Z · Place talent sheet Back button on left and Upgrade on right

- BETA 0.51 · 2026-10-08T10:44:05.517Z · Add chat replies and reusable clan invitation cards; leader deputy invitations every 20 minutes; expand chat viewport

- BETA 0.52 · 2026-10-08T10:45:37.163Z · Replace bleed tick blood drops with three animated claw scratches

- BETA 0.53 · 2026-10-08T10:48:01.902Z · Localize clan system chat history and promotions using shared UA RU EN activity formatter

- BETA 0.54 · 2026-10-08T10:54:59.981Z · Move chat message time to header and keep reply action bottom right

- BETA 0.55 · 2026-10-08T11:02:25.167Z · Compose clan invitation text before sending and align own invitation avatar on right

- BETA 0.56 · 2026-10-08T11:36:23.820Z · Keep raid boss identity after attacks and isolate raid and personal fight screen state; clamp timer color ratio

- BETA 0.57 · 2026-10-08T11:43:03.801Z · Fix extra personal boss chests granted for clan assists

- BETA 0.58 · 2026-10-08T15:38:40.005Z · Apply tiered flat equipment damage and cooldown bonuses with shared server/UI calculations

- BETA 0.59 · 2026-10-08T15:53:33.129Z · Add Epic Battle Pass equipment, raven, layered animations and real reward claims

- BETA 0.60 · 2026-10-08T15:55:45.301Z · Place Epic Battle Pass raven behind the hero

- BETA 0.61 · 2026-10-08T15:58:45.086Z · Fix Newbie Pack viewport clipping and scrolling on small screens

- BETA 0.62 · 2026-10-08T17:18:21.610Z · Epic BP stats, raven aura with seasonal background, glove weapon combo, admin full unlock and production admin access

- BETA 0.63 · 2026-10-08T17:25:11.886Z · Admin nickname display and BP full unlock persistence and response validation

- BETA 0.64 · 2026-10-08T17:38:17.280Z · Roulette reward chances: nothing 20, energy 40, large poison 5, medium 15, small 20 percent

- BETA 0.65 · 2026-10-08T18:47:16.107Z · Remove clan donation join cooldown and correct AFK accrued reward display

- BETA 0.66 · 2026-10-08T22:10:17.170Z · Remove guaranteed boss4 pet grant; use shared boss chest drop chances

- BETA 0.67 · 2026-10-08T22:42:07.666Z · Server promo redemption once per account with activation limit and count; talent reset free then 50 paper; bleed victory UI

- BETA 0.68 · 2026-10-09T05:40:02.657Z · Fix boss victory chest transition, events navigation and raid back button, talent damage previews, daily checkin catchup, pack filtering and quest segments

- BETA 0.69 · 2026-10-09T05:48:01.874Z · Fix repeated event entry after fishing Back and late boss victory responses reopening claimed chests

- BETA 0.70 · 2026-10-09T05:57:59.959Z · Close fishing scene on Back before reopening events; preserve boss victory acknowledgement and prevent late leaderboard reopening

- BETA 0.71 · 2026-10-09T06:00:35.288Z · Remove boss victory fade-through and redundant fight request after lethal bleed

- BETA 0.72 · 2026-10-09T06:12:45.527Z · Raid Back button in both entry paths; exclusive event navigation and return state reset; bleeding leaderboard update and chest queue only after victory claim

- BETA 0.73 · 2026-10-09T06:26:45.641Z · Events list uses standalone screen without underlying camp; boss results wait for final ranking before a single presentation, including bleeding kills

- BETA 0.74 · 2026-10-09T06:35:34.814Z · Like reward box above hero and pet; visible fishing Back button beneath inventory

- BETA 0.75 · 2026-10-09T06:49:19.476Z · Compact chat-style clan lobby cards; join policy and application/error feedback; transfer leadership by member nickname selection

- BETA 0.76 · 2026-10-09T06:57:39.638Z · Shared content-bound GameWindow for artifacts and clan management; modal bottom-nav reservation; close management after leadership transfer or dissolve

- BETA 0.77 · 2026-10-09T07:09:07.639Z · Battle Pass claim-all with server-authoritative batch and combined reward summary; repeat artifact collection claims in overview

- BETA 0.78 · 2026-10-09T07:41:18.483Z · Fixed personal global leaderboard row, confirmed collection chest grants, and quest scrolling bounds above navigation

- BETA 0.79 · 2026-10-09T07:55:06.385Z · Artifacts background blur below navigation and pinned leaderboard position over navigation

- BETA 0.80 · 2026-10-09T08:02:03.031Z · Unified leaderboard window with fixed own position footer and independently scrolling ranking

- BETA 0.81 · 2026-10-09T08:05:15.525Z · Responsive fishing inventory with dimmed backdrop; includes server own leaderboard position endpoint

- BETA 0.82 · 2026-10-09T08:16:37.485Z · Removed own position heading from pinned leaderboard row

- BETA 0.83 · 2026-10-09T08:22:56.041Z · Battle pass animation toggle with saved preference and paused portal rendering

- BETA 0.84 · 2026-10-09T08:27:41.611Z · Global animation preference in settings; bounded modal windows above bottom navigation

- BETA 0.85 · 2026-10-09T08:34:23.243Z · Fixed mission energy spend resetting through stale regeneration timestamp

- BETA 0.86 · 2026-10-09T08:40:20.479Z · Responsive boss victory modal keeps damage list and claim controls inside viewport

- BETA 0.87 · 2026-10-09T08:42:49.943Z · Artifacts window uses dimmed blurred underlying screen instead of solid black

- BETA 0.88 · 2026-10-09T08:48:01.913Z · Bottom navigation translucent blurred background reveals underlying screen

- BETA 0.89 · 2026-10-09T08:50:19.032Z · Removed bottom navigation fill; transparent blurred overlay reveals underlying content

- BETA 0.90 · 2026-10-09T08:52:45.820Z · Removed remaining solid artifact overlay container background

- BETA 0.91 · 2026-10-09T10:13:54.574Z · Small-screen boss victory overflow fix without changing modal layout

- BETA 0.92 · 2026-10-09T10:17:24.490Z · Boss victory damage list scrolls internally while claim button stays fixed

- BETA 0.93 · 2026-10-09T10:47:46.545Z · Centered karma counters with separate angel and demon PNG icons and immediate reaction count updates

- BETA 0.94 · 2026-10-09T10:52:51.475Z · Boss victory bounded to game content with internal scrolling and fixed claim button

- BETA 0.95 · 2026-10-09T11:14:30.482Z · Persistent public karma counters, recover saved reactions, show own karma

- BETA 0.96 · 2026-10-09T11:26:31.567Z · Responsive collapsible karma drawer below profile header

- BETA 0.97 · 2026-10-09T11:33:21.037Z · Karma drawer bottom handle, compact translucent blurred background

- BETA 0.98 · 2026-10-09T11:47:04.409Z · Own-profile karma drawer only; other profiles always show counters without drawer background or handle

- BETA 0.99 · 2026-10-09T11:52:02.303Z · Move other-profile karma above hero; reduce home navigation blur

- BETA 0.100 · 2026-10-09T11:56:01.695Z · Expose selected camp background in public profiles; improve artifact claim button contrast

- BETA 1.01 · 2026-10-09T12:05:20.023Z · Epic Battle Pass gloves with hockey stick combo; correct version rollover

- BETA 1.02 · 2026-10-09T12:13:29.347Z · Fix Epic Battle Pass gloves with Newbie Pack weapon combo and remove duplicate bare-hand layer

- BETA 1.03 · 2026-10-09T12:31:58.656Z · Server-authoritative compatibility for legacy AFK claims; persist first boss tutorial completion

- BETA 1.04 · 2026-10-09T13:30:43.070Z · Fourth boss pet poison bonuses 40/60/80 and energy capacity 20; centered public-profile karma

- BETA 1.05 · 2026-10-09T13:44:14.419Z · Promo reward popup and admin gift mail subject/text

- BETA 1.06 · 2026-10-09T14:30:29.066Z · Fixed clan preview close control and internal scrolling; promo code popup title

- BETA 1.07 · 2026-10-09T19:54:58.525Z · Prevent accepting clan applications for players already in a clan

- BETA 1.08 · 2026-10-09T20:11:16.160Z · Legendary Battle Pass equipment, cape bound to armor, animated lava glow, eye and lime fire aura, cave background; materialize previously claimed gear once.

- BETA 1.09 · 2026-10-09T20:18:17.654Z · Fix legendary helmet rendering instead of default cardboard head.

- BETA 1.10 · 2026-10-10T10:40:45.915Z · Render legendary cape behind pets while keeping it bound to armor.

- BETA 1.11 · 2026-10-10T11:04:25.739Z · Fix legendary cape positioning so it does not push the hero outside the visible area.

- BETA 1.12 · 2026-10-10T11:13:36.461Z · Admin grant all equipment sets for layer checks; Like Box reward icons and hide zero rewards.

- BETA 1.13 · 2026-10-10T11:19:10.223Z · Increase Legendary Battle Pass equipment and set bonuses; preserve Epic balance.

- BETA 1.14 · 2026-10-10T12:13:04.969Z · UA/RU/EN equipment names, game UI translations, promo and player-facing API error localization.

- BETA 1.15 · 2026-10-10T14:58:07.826Z · Level milestone reward queue, keyless clan-invited boss attacks, clan help translations, and js-sha256 eval-free update

- BETA 1.16 · 2026-10-10T15:30:38.683Z · Confirm milestone reward claims, persist claimed levels in bootstrap, and remove duplicate level-up frame

- BETA 1.17 · 2026-10-10T15:35:35.010Z · Preserve boss invite buttons in clan chat and close help modal after sending

- BETA 1.18 · 2026-10-10T15:51:14.055Z · Speed up equipment set rendering; redesign clan boss invite card and remove redundant solo leaderboard tab

- BETA 1.19 · 2026-10-10T16:08:28.190Z · Limit clan boss calls to the fight starter once per fight and hide invites after the boss is defeated

- BETA 1.21 · 2026-10-10T19:38:47.723Z · CA ranks 11–15 artwork and translations; permanently lock the last three bosses until release

- BETA 1.30 · 2026-10-11 · Profile rollback protection, atomic player persistence, faster mission saves, stable BP rendering and admin talent compensation.

- BETA 1.31 · 2026-10-11 · Clan donation recovery, single quest reward icon, scrollable equipment and fullscreen daily event with Back.

- BETA 1.32 · 2026-10-11 · Defer CA rank reward popups until the newbie tutorial final reward is claimed.

- BETA 1.33 · 2026-10-11 · Remove tutorial Skip buttons, fix newbie-tab hint placement and grant five training poison flasks once on the server.

- BETA 1.34 · 2026-10-11T10:21:07.640Z · Preserve loaded player profile when optional startup initialization fails

- BETA 1.35 · 2026-10-11T10:39:45.742Z · Automatic NEAR payment reconciliation and Battle Pass tier delivery


- BETA 1.36 · 2026-10-11T10:47:56.808Z · Fix NEARBlocks incoming transfer scan for pending payment recovery

- BETA 1.36 · 2026-10-11 · Return the newbie tutorial to planet selection when the quest list is not open.

- BETA 1.37 · 2026-10-11T10:50:18.170Z · Fix NEARBlocks incoming transfer scan for pending payment recovery

- BETA 1.37 · 2026-10-11 · Guide the first 231-energy quest cycle, route day-seven claims directly to Newbie Quest, repair the five-poison tutorial grant, and recover tutorial progression after an early boss kill.

- BETA 1.38 · 2026-10-11T12:07:21.704Z · Allow multi-reward admin gifts and refresh mailbox on open

- BETA 1.39 · 2026-10-11 · Guide and protect the first 231-energy quest cycle, move directly to Newbie Quest after a successful daily claim, repair the tutorial poison grant, and recover after an early boss kill.

- BETA 1.40 · 2026-10-11T12:20:30.930Z · Make admin gift mail claimable exactly once

- BETA 1.41 · 2026-10-11T12:35:25.945Z · Redesign mail panel with Planet4 sender, mini banner and claim button

- BETA 1.42 · 2026-10-11T12:54:04.917Z · Allow catch-up claims on unlocked event days when saved daily progress is missing

- BETA 1.43 · 2026-10-11T13:06:32.982Z · Keep claim label for legacy gift mail and verify safe dismissal

- BETA 1.44 · 2026-10-11T13:08:41.498Z · Restart legacy tutorial skip states and grant five poison flasks exactly once

- BETA 1.45 · 2026-10-11T13:13:44.011Z · Add three-language subject and message fields to gift mail

- BETA 1.46 · 2026-10-11T13:36:03.229Z · Verify poison mail rewards and prevent object-object locale rendering

- BETA 1.47 · 2026-10-11T13:39:03.119Z · Credit boss kills to invited clan contributors and verify poison claims

- BETA 1.50 · 2026-10-11T13:54:21.172Z · Block starting or joining another boss fight while one is active, with localized guidance

- BETA 1.51 · 2026-10-11T13:56:43.989Z · Fix daily reward claims and weekly streak eligibility


- BETA 1.52 · 2026-10-11T13:57:36.082Z · Prevent simultaneous personal and clan boss fights, show the active clan fight, and localize the block message

- BETA 1.53 · 2026-10-11T14:09:28.947Z · Fix nested three-language gift mail content and hide corrupted object text

- BETA 1.54 · 2026-10-11T14:14:42.122Z · Show an unread mail badge for new gift mail and clear it after opening

- BETA 1.55 · 2026-10-11T14:19:10.435Z · Change unread mail badge to a high-contrast red style

- BETA 1.56 · 2026-10-11T15:17:37.894Z · Auto-open queued boss rewards from clan fights

- BETA 1.57 · 2026-10-11T19:09:28.569Z · Add persistent admin mail delivery log

- BETA 1.58 · 2026-10-11T19:13:49.804Z · Add demo VOID FLUSH scene under Home Airdrops

- BETA 1.59 · 2026-10-11T19:58:13.201Z · Make event energy goals cumulative and expand task details

- BETA 1.60 · 2026-10-11T20:01:49.977Z · Keep boss damage leaderboard scrollable above the bottom navigation

- BETA 1.61 · 2026-10-11T20:33:28.816Z · Prevent startup crash when daily event progress is not initialized

- BETA 1.62 · 2026-10-11T20:44:27.566Z · Limit full-energy Telegram reminders to one every six hours across energy spends

- BETA 1.63 · 2026-10-11T20:47:13.311Z · Enable horizontal touch scrolling in the background picker on iOS

- BETA 1.64 · 2026-10-11T20:50:54.216Z · Guard daily task progress reads against absent or malformed history

- BETA 1.65 · 2026-10-11T20:54:31.974Z · Improve bottom navigation label contrast over every background

- BETA 1.66 · 2026-10-11T20:57:48.263Z · Prevent background picker cards from stretching vertically

- BETA 1.67 · 2026-10-11T21:01:04.624Z · Remove blank vertical space from background selection modal

- BETA 1.68 · 2026-10-11T21:05:26.720Z · Remove leaderboard navigation from boss medal icons

- BETA 1.69 · 2026-10-11T21:10:29.319Z · Move profile like counters below ranking back button

- BETA 1.70 · 2026-10-11T21:11:36.150Z · Shorten readonly profile back button label

- BETA 1.71 · 2026-10-11T21:19:15.274Z · Restore profile karma counter position

- BETA 1.72 · 2026-10-11T21:39:12.995Z · Localize boss source labels in Russian and restore catalog boss IDs

- BETA 1.73 · 2026-10-11T21:45:24.505Z · Match delivery mission title to its artifact

- BETA 1.74 · 2026-10-11T22:26:13.336Z · Block AIRDROPS in production and update VOID FLUSH progress UI

- BETA 1.75 · 2026-10-12T05:48:13.817Z · Add localized clan achievement details popup

- BETA 1.76 · 2026-10-12T05:54:00.916Z · Simplify fish exchange reward labels and add combo EXP

- BETA 1.77 · 2026-10-12T06:04:02.201Z · Retry and pace NEAR audience token checks

- BETA 1.78 · 2026-10-12T06:34:43.187Z · Award capped owner-only Battle Pass XP for boss victories

- BETA 1.79 · 2026-10-12T06:43:10.064Z · Add localized Battle Pass progress hint

- BETA 1.80 · 2026-10-12T10:48:42.520Z · Переработаны подсказки боя с боссом и клана, обновлены таланты и энергия, добавлены цели Battle Pass по боссам и значок новых сообщений, штраф за побег от босса — 30 минут

- BETA 1.81 · 2026-10-12T11:22:03.883Z · Fix scrolling in clan achievement and boss status help dialogs

- BETA 1.82 · 2026-10-12T11:27:28.793Z · Reset personal clan donation cap every 12 hours

- BETA 1.83 · 2026-10-12T11:30:08.447Z · Limit each roulette spin pack to five purchases per day

- BETA 1.84 · 2026-10-12T11:35:42.251Z · Reduce poison preservation talents from 2% to 1% per level

- BETA 1.85 · 2026-10-12T11:40:52.326Z · Render clan and boss help dialogs above mobile navigation

- BETA 1.86 · 2026-10-12T12:05:21.183Z · Fix mobile clan achievement window and remove demo chat messages

- BETA 1.87 · 2026-10-12T12:24:19.465Z · Refresh first weapon WebP and include mobile clan/chat fixes

- BETA 1.88 · 2026-10-12T12:31:58.883Z · Show profile window over bottom navigation

- BETA 1.89 · 2026-10-12T13:08:13.713Z · Remove boss leaderboard flicker and anchor attack panel near navigation

- BETA 1.90 · 2026-10-12T13:27:11.124Z · Hide expired newbie pack without flicker and add ad acquisition tracking in admin

- BETA 1.91 · 2026-10-12T15:45:30.140Z · Airdrop Void Flush: compact resource exchange, animated tentacles and resource/AP particles, UK/RU/EN localization

- BETA 1.92 · 2026-10-12T15:59:26.733Z · Center ATTACK STATS equipment button and size it to its label

- BETA 1.93 · 2026-10-13T11:25:44.435Z · Reduce mobile game rendering load

- BETA 1.94 · 2026-10-13T11:32:26.051Z · Prevent boss scenes from appearing before all layers decode

- BETA 1.95 · 2026-10-13T11:39:48.287Z · Fix daily boss-damage claim and add persistent clan-mail actions

- BETA 1.96 · 2026-10-13T11:42:34.958Z · Speed up Go/Claim responses; fix daily boss-damage quest claim and persistent clan-mail read/delete actions

- BETA 1.97 · 2026-10-13T11:47:02.002Z · Include daily quest definitions required by the server for the day-two boss-damage claim

- BETA 1.98 · 2026-10-13T11:53:56.875Z · Clarify clan boss assistance notice; keep clan-mail delete only; include daily claim and action responsiveness fixes

- BETA 1.99 · 2026-10-13T11:58:48.080Z · Make daily task claims idempotent and prevent rapid duplicate taps from showing false errors

- BETA 2.00 · 2026-10-13T12:05:15.811Z · Ship server-side daily-claim idempotency, clan-mail deletion, clan assistance clarification, and immediate talent-upgrade responses

- BETA 2.01 · 2026-10-13T12:21:17.105Z · Queue gameplay persistence in background to reduce GO and Claim waits

- BETA 2.02 · 2026-10-13T14:01:25.948Z · Add Stars and NEAR shop purchases for single poisons and variable energy top-ups

- BETA 2.03 · 2026-10-13T14:04:38.890Z · Removed tentacle-priced energy shop offers

- BETA 2.04 · 2026-10-13T14:11:01.625Z · Removed full-energy premium item from regular shop

- BETA 2.05 · 2026-10-13T14:14:00.348Z · Removed overpriced duplicate boss pack and corrected shop box previews

- BETA 2.06 · 2026-10-13T14:15:13.620Z · Removed empty energy and duplicate daily tentacle shop sections

- BETA 2.07 · 2026-10-13T14:20:48.020Z · Adjusted shop box price and aligned energy purchase control

- BETA 2.08 · 2026-10-13T14:21:57.441Z · Matched energy plus button height to the bar and restored its attached position

- BETA 2.09 · 2026-10-13T14:24:08.939Z · Inset energy purchase button and changed to rectangular shape

- BETA 2.10 · 2026-10-13T14:24:59.073Z · Made energy plus button square and inset

- BETA 2.11 · 2026-10-13T14:27:59.802Z · Matched square energy plus button to full meter height

- BETA 2.12 · 2026-10-13T16:12:59.220Z · Added shop item icons and selectable poison purchases up to 100 units

- BETA 2.13 · 2026-10-13T16:22:57.609Z · Restored gray clan energy request button with cooldown timer

- BETA 2.14 · 2026-10-13T19:46:00.863Z · Improve leaderboard, chat, fishing, and raid boss loading

- BETA 2.15 · 2026-10-13T19:58:32.191Z · Add dismiss control to tutorial hints and optimize slow screens

- BETA 2.16 · 2026-10-14T07:25:52.400Z · Add raid boss participant rewards in admin with multi-resource mail and duplicate-send protection

- BETA 2.17 · 2026-10-14T07:48:11.948Z · Stabilize roulette and clan-help popups; include raid reward administration

- BETA 2.18 · 2026-10-14T07:54:32.063Z · Prevent game-wide rerenders when reward popups open or close

- BETA 2.19 · 2026-10-14T08:01:07.781Z · Prevent boss loot boxes from appearing before the damage leaderboard claim

- BETA 2.20 · 2026-10-14T08:29:57.943Z · Show boss damage results immediately, then open a single loot box

- BETA 2.21 · 2026-10-14T08:34:49.741Z · Load current raid participant data from persistent storage for admin rewards

- BETA 2.22 · 2026-10-14T11:16:47.147Z · Clarify talent unlocks, improve mobile reward dialogs, compact leaderboard rows, and expand profile navigation

- BETA 2.23 · 2026-10-14T11:39:08.752Z · Speed up clan roster and leaderboard loading

- BETA 2.24 · 2026-10-14T13:31:41.834Z · Fix local campaign route and separate NFT and token holder drops

- BETA 2.25 · 2026-10-14T13:35:12.941Z · Fix holder campaign admin routes behind the local API proxy

- BETA 2.26 · 2026-10-14T13:55:27.466Z · Add multi-campaign holder drops and holder list

- BETA 2.27 · 2026-10-14T14:04:02.642Z · Guard malformed list data against startup render errors
- BETA 2.28 · 2026-10-14 · Repackage holder drops API route for production deployment
- BETA 2.29 · 2026-10-14 · Explain holder scans and report verified wallet coverage

- BETA 2.30 · 2026-10-14T15:07:11.078Z · Fix clipped mail loot-box reward modal

- BETA 2.31 · 2026-10-14T15:12:36.226Z · Scan saved NEAR profile wallets for token and NFT holder drops without requiring relinking

- BETA 2.32 · 2026-10-14T15:22:18.834Z · Fix holder-drop translations and show scanned holders as eligible regardless of legacy verification flag
- BETA 2.33 · 2026-10-14 · Separate raid reward estimates from sending; allow review and editing before dispatch
- BETA 2.34 · 2026-10-14 · Calculate raid rewards for all eligible players and send reviewed rewards in one batch
- BETA 2.35 · 2026-10-14 · Localize raid reward mail subject and message using the recipient's language

- BETA 2.42 · 2026-10-15T12:52:34.013Z · Raid boss 30M, rank rewards, cosmetics, aura bonuses, battle-pass rewards and 48h poison shop

- BETA 2.43 · 2026-10-15T13:32:33.958Z · Reset stale raid boss HP and leaderboard data for the new encounter

- BETA 2.44 · 2026-10-15T13:56:43.457Z · Recover bulk holder drops from NEAR RPC 429 and translate accessory/animation slots

- BETA 2.45 · 2026-10-15T14:36:24.823Z · NFT holder pet grants once per player and wallet, poison quantity 1, responsive boss bottom spacing

- BETA 2.46 · 2026-10-15T18:16:41.858Z · Meteor: combined connection and signed wallet proof, cancellable verification and bounded waits; clan profile callback fix; aura cleanup guard; server error diagnostic messages

- BETA 2.47 · 2026-10-15T19:26:44.288Z · Cumulative: HERE Early layered pet; NFT-specific permanent redemption ledger, public checker and player self-claim; locked equipment catalog and obtain hints; fullscreen boss leaderboard; laser pulse with 20-30s idle; previous Meteor and diagnostics fixes

- BETA 2.48 · 2026-10-15T19:51:27.365Z · HERE Early Pet: +50/+75/+100 poison damage and +5% critical chance; damage leaderboard centered with 520px max width on desktop; cumulative previous changes

- BETA 2.49 · 2026-10-15T22:12:03.847Z · Stabilize hero positioning without group scaling; stop hidden scene effects; fix duplicate boss reward randInt failures and clarify pet issuance status
