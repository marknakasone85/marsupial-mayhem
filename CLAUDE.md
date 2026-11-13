# Marsupial Mayhem™: project guide

A comical cartoon brawler starring marsupials: **Marsupial Mayhem™** (name chosen by the owner on 13 Nov 2026). It's the follow-up to the owner's *The Sloth Slap Game* (https://github.com/marknakasone85/sloth-slap-game): the same kind of game, but better and a bit bigger. Plain HTML5 canvas and JavaScript, **no build step and no dependencies**: every picture and sound is made in code.

The plan is in `docs/`. Read `docs/DESIGN.md`, `docs/ROSTER.md`, `docs/VILLAINS.md`, `docs/TECH_PLAN.md` and `docs/BUILD_PLAN.md` before writing code, and `docs/DECISIONS.md` before changing anything already decided.

## Status

Planning finished on 13 Nov 2026. Later that day the owner answered the open questions and extended the story (quokkas as allies who betray everyone to the reptilians, levels on a Marsupial World map), and added weapons, a shop and upgrades: see `docs/DECISIONS.md`.

**Milestone 0 (setup) was built on 13 Nov 2026:** the engine from Sloth Slap, a title screen, the share server and tests.

**Milestone 1 (vertical slice) was built on 13 Nov 2026:** Boomer, the Outback map *Tournament Trail* (rabbits, cats, pigs, the mini-boss Big Buck), the kick grenade, the Gumnut Gatling, power-ups, gates, 2 players on one keyboard, and tests including a bot that plays the map. Still to do for Milestone 1: the owner plays it, and it's checked on a real phone (frames take about 1.5 ms on the Mac).

**Milestone 2 (home Wi-Fi) was built on 13 Nov 2026:** WI-FI menu, host lobby with join code, join screen with a number pad, friends' view drawn from snapshots, drop-in, reconnect as the same player, Back to Lobby. Tested with 3 players through the whole map, and live in the app's browser against the real share server. Still to do: the family plays it together at home on real phones.

**Milestone 3 (the roster) was built on 13 Nov 2026:** all 12 marsupials with their own moves, specials and traits, a select screen (12 tiles + 2 locked secret tiles), Tournament Duel (vs CPU at 3 levels, 2 players on one keyboard, 3 stages, supply drops) and Wi-Fi battles for 2-4 with CPU fillers. Still to do: the owner tries the characters and says which feel right. Next is Milestone 4 (the pouch) in `docs/BUILD_PLAN.md`; it needs the owner's answer on the male-character pouch question in `docs/DECISIONS.md`. `docs/README.md` lists the plan files.

## Rules the owner cares about

These carry over from the owner's other games (Sloth Slap, the zombie survival game, Survive Bob).

- **Keep it easy to deploy.** No build tools, no npm to play, no backend beyond the home-network share server. It must run by double-clicking `index.html`, from GitHub Pages, from itch.io (as a zip) and on phones. Flag up front any feature that would need a real server (online play, accounts, global leaderboards).
- **Plain `<script>` tags, no ES modules,** so `file://` works. Data lives in `.js` files, not `.json` loaded with `fetch` (which fails on `file://`). The `data/*.json` files in this folder are planning snapshots, not game files.
- **Controls are always shown on screen** in every mode: a key-hint strip, Pause → Controls, and touch buttons on phones. Any new move or mode goes into all three.
- **Never delete or replace maps.** New ones are appended.
- **Backups:** make this folder a git repo at Milestone 0. After each finished feature, offer to "save a backup", and commit only when the owner says yes. End commit messages with the Co-Authored-By line from the system reminder.
- **How the family plays it** (the owner, 13 Nov 2026): pushed to GitHub and played from its public web page (GitHub Pages), and launched from this project folder (`share-on-network.command`) for multiplayer on the home network. Both must keep working after every milestone.
- **GitHub:** the public repo is https://github.com/marknakasone85/marsupial-mayhem (created 13 Nov 2026). GitHub Pages serves `main` (with a `.nojekyll` file) at https://marknakasone85.github.io/marsupial-mayhem/ and updates a minute or two after each push. Offer to push, and push only when the owner says yes. `git push` signs in with the GitHub CLI (`gh`, account marknakasone85). If GitHub says it isn't signed in, run `gh auth login --hostname github.com --git-protocol https --web </dev/null` in a Terminal tab: it shows a one-time code for the owner to enter at github.com/login/device.
- **Everything tracked is public:** the repo and its web page show every file, `docs/` included. **Never put personal details in tracked files**: no family names, personal emails, home Wi-Fi address or location. Commits use the GitHub no-reply address, set in this repo's git config, never the owner's Gmail.
- **Licence: all rights reserved, not open source.** "© 2026 Mark A. Nakasone. All rights reserved." Don't add an open-source licence. Mark the name ™ on the title screen, page title and README, as with Sloth Slap™. The owner wants to register it later: switch to ® only once a registration has actually been granted.
- **Public statements in the README** must stay true: Privacy (no data collected, saves stay in the browser, Wi-Fi play stays at home), Content (cartoon action with cartoon blood, on by default, which can be switched off in Settings) and "not affiliated". No outside scripts, fonts, trackers or analytics: bundle fonts with their licence files.
- **Before saying it's ready:** run the automated tests and check the change visually. The owner usually asks "let me know when it's ready". Then give the exact steps to play or share it, and what to refresh.
- **The owner adds requirements as they go.** New requests usually extend the game rather than replace it.

## Home-network share (when Wi-Fi play is built)

Copy and adapt Sloth Slap's `tools/share_server.py` and `share-on-network.command`, and keep their hardening:
- Serve only `/index.html`, `/css/` and `/js/`: no hidden files, no `tools/`, no folder listings.
- Decode request paths once. A double-decoded `%252e%252e` once exposed `.git` in another of the owner's games.
- Answer only IP addresses and home names (`localhost`, `*.local`) to block DNS rebinding.
- Only this computer can host. Joining needs a 4-digit code, with a lockout after repeated wrong codes. Use per-player tokens, cap message sizes, and switch the share off after 3 hours.
- Lookup tables keyed by names that guests send must have no prototype (`Object.create(null)`).

**Ports:** use **8020** for the share and **8790** for the local preview. These are already taken by the owner's other games, so never stop or change them: 8000 (Sloth Slap), 8010 (Zombie Survival), 8765 (Survive Bob), 8770, 8781 and 8782 (previews).

## Adding a character

1. Add it to `MG.CHARACTERS` in `js/data/characters.js`: build, stats (see the build ranges in `docs/ROSTER.md`), `basic` and `big` (a `style` for the art plus any numbers that differ from the build's defaults), `abilities`, `special`, `specialName`, `trait`, a checked `fact`.
2. Art: a kangaroo-family animal uses `art: 'kangaroo'` with `colors`; anything else gets a preset in `MG.Art.LOOKS` (`js/art/critters.js`) and `art: 'critter', look: '<preset>'`. New attack styles go in `A.critter`.
3. A new special goes in `MG.SPECIALS` (with a `range` for the CPU), a new trait in `MG.ABILITIES`.
4. The select screen fits 14 tiles (2 rows of 7). Add checks to `tools/tests/test_roster.js`; `test_duel.js` plays every character automatically.

## Gameplay notes

- Pests touch-damage players on their own timer (`touchT`), never the AI timer (`cool`): sharing them once froze Big Buck while he stood next to Boomer.
- A press during a jab queues the next punch, and jabs push only a little (plus a small lunge), so jab-jab-hook combos connect.
- Running into a block stops a charge or pounce dead, which sets up Boomer's Tail Counter.
- Grenades only explode early on pests (not crates) and never hurt players: blasts just bounce them.
- Duels label CPUs "CPU" and number people among people only (P1 = host), on every screen.
- A poison hit (stink cloud) hurts without stunning, so pests can still run away from it.
- Every pest still in front of a closed gate comes running when the players get near it (hidden cats come out too). A pig once idled just off the shared co-op screen and the gate never opened.
- Wi-Fi: a friend whose button messages stop for 1.5 s lets go of every key (no ghost walking off), and a guest view replaces each player's state on every update (zero values are left out of snapshots, so old values must not linger).

## Content guardrails

The full list is in `docs/DESIGN.md`. In short:
- Funny, satirical cartoon action for families. **Blood is on by default** (the owner's choice), with a Settings switch to turn it off and an optional gore mode.
- **The reptilians** (the quokkas' allies) are real Australian reptiles as cartoon villains, not the "lizard people" conspiracy theory.
- **No famous characters or brands:** not Taz (Looney Tunes), Crash Bandicoot, Bluey, Skippy, Blinky Bill, Kangaroo Jack, or the Gumnut Babies' look.
- **The villains' island is the made-up "Grin Isle",** not Rottnest by name. Use a generic giant red rock, not Uluru. Keep the dingo neutral, and don't borrow Aboriginal sacred imagery or art styles.
- Real animal facts in the game must be true. `docs/ROSTER.md` has checked facts. Don't invent new "facts".
- The README is player-facing and public: **no story spoilers there** (the twist lives in `docs/`).

## Code map

Script order lives in `index.html`: plain `<script>` tags, no modules. Everything hangs off the global `MG` (Sloth Slap's `SS`, renamed).

| Area | Files |
|---|---|
| Game loop, 960x540 scaling, host ticker, hit-stop, slow motion, `MG.U` helpers, `MG.Save` (localStorage, keys start `marsupialmayhem.`) | `js/core/engine.js` |
| Keyboard, gamepad and pointer as virtual keys; control schemes `MG.Controls` (SOLO/P1/P2: left, right, up, down, attack, big, special, shoot, grenade); `MG.readControls` (presses like `attackP`, plus held `shoot` and `jump`); `MG.Menu` | `js/core/input.js` |
| Phone touch buttons (HIT, BIG, SUPER, SHOOT, BOOM = grenade, JUMP, BLOCK...) on their own layer | `js/core/touch.js` |
| Synthesised sounds and step-sequencer music (`SONGS`: `title`, `outback`, `boss`) | `js/core/audio.js` |
| Particles, popups, shake, blast rings, blood or confetti, slow-motion finisher; `MG.Settings.blood` (ON by default) | `js/core/fx.js` |
| Art drawn in code: shared helpers (`MG.Art.taper`, `oval`, `shadow`), kangaroos (Boomer, Stinker, Benny), grenade and gatling | `js/art/kangaroo.js` |
| Art: one rig for the other 9 marsupials (`MG.Art.critter` with a species preset in `MG.Art.LOOKS`), `MG.Art.character` (draws anyone), `MG.Art.portrait`, the burrow mound | `js/art/critters.js` |
| Art: rabbits (and Big Buck), feral cats, feral pigs, long grass | `js/art/pests.js` |
| Art: Outback background, decorations, wooden platforms, crates, gates, finish line, pickups, projectiles | `js/art/outback.js` |
| Data: the 12 playable characters `MG.CHARACTERS` (build, stats, `basic`/`big` move styles and numbers, `abilities`, `special`, trait, fact, art + look), the 2 locked `MG.SECRETS`, `MG.coatFor`; maps `MG.LEVELS` | `js/data/*.js` |
| Trait modules `MG.ABILITIES` (hooks: update, physics, jump, hit, speed) run by `MG.Abilities` | `js/entities/abilities.js` |
| The 12 specials `MG.SPECIALS` (start, update, land, pose, CPU range) | `js/entities/specials.js` |
| CPU opponent `MG.CPU` (3 levels: JOEY, CHAMPION, LEGEND) | `js/entities/ai.js` |
| Fighter `MG.Fighter` (each character's attack and big attack, combos, specials and traits through the modules above, grenade pin and punt, gatling, power-ups, `renderState`/`drawState`) and `MG.Projectile` (gumnuts, shockwaves, cubes that become walls, stink clouds, waves, wallabies, bins, the tongue) | `js/entities/fighter.js` |
| The kick grenade `MG.Grenade` (fuse, bounces, kicks, blast that never hurts players) | `js/entities/grenade.js` |
| Pests `MG.Enemy` (behaviours: swarmer, ambusher, charger, boss), `MG.Crate`, `MG.Pickup` | `js/entities/enemy.js` |
| Wi-Fi client `MG.Net` (header `X-Mayhem`; `rejoin()` sends the old token so the relay gives back the same player number) and `MG.Sync`: records effects and sounds for guests, `snapshot(scene)` (the campaign, ~1-2 KB, zero values left out), `sendInput` (held left/right/down/shoot/jump + presses in `MG.PRESS_KEYS`) | `js/net/*.js` |
| Drawing helpers, controls page, key strip, `MG.MenuList` | `js/scenes/ui.js` |
| Title screen `MG.MenuScene` (PLAY, 2 PLAYERS, WI-FI, CONTROLS, BLOOD, SOUND) | `js/scenes/menu.js` |
| Campaign `MG.CampaignScene` (the world interface, camera, gates by zone, boss arena, pause, win/lose; with `net: true` it hosts: `onNet`, `netInput`, drop-in, snapshots ~30/s, Back to Lobby), `MG.drawCampaignWorld` (shared by host and guests) and the HUD `MG.CampaignHUD` | `js/scenes/campaign.js`, `campaign_hud.js` |
| Wi-Fi screens: `MG.WifiScene` (HOST / JOIN), `MG.LobbyScene` (host: join code, player cards, START), `MG.JoinScene` (code pad, I'm ready) | `js/scenes/lobby.js` |
| Friends' view `MG.RemoteScene`: draws snapshots, smooths movement, sends button presses, rejoins by itself | `js/scenes/remote.js` |
| Character select `MG.SelectScene` (modes campaign, coop, duelCpu, duel2), `MG.DuelMenuScene`, `MG.STAGES`, `MG.STAT_BARS`, `UI.characterDetails` | `js/scenes/select.js` |
| Tournament Duel `MG.DuelScene` (rounds, supply drops, CPU, Wi-Fi battle host), `MG.DuelHUD`, `MG.drawDuelStage`, `MG.Sync.duelSnapshot` | `js/scenes/duel.js` |
| Friends' view of a Wi-Fi battle `MG.RemoteDuelScene` | `js/scenes/remote_duel.js` |
| Home-network share and relay (port 8020) | `tools/share_server.py`, `share-on-network.command` |

## Testing

- **Automated:** `tools/run-tests.sh` (a few seconds). It syntax-checks every game file, runs `tools/tests/test_*.js` in macOS's built-in JavaScriptCore with a fake browser (`harness.js`), and checks the share server's safety rules (`test_server.py`). Add checks with `check(ok, 'what')` and add new test names to the `for t in ...` list.
  Tests: `boot` (title screen, settings, Wi-Fi rules), `boomer` (every move, the grenade, the gatling, power-ups, each pest), `campaign` (map, gates, checkpoints, Big Buck, win/lose, blood, pause, touch, 2 players), `solo` (a bot plays the map 3 times and must finish most runs), `roster` (all 12 characters: every attack, big attack, special and trait, every pose drawn), `duel` (CPU vs CPU with every character, fair fights, supply drops, rounds, 2 players, the select flow, a Wi-Fi battle with a guest view), `coop` (3 Wi-Fi players through every map with every snapshot drawn by a guest view, update sizes, lobby, drop-in, leave, reconnect, the friend's side, the WI-FI menu), and `test_server.py` (the share server's file and address rules, plus a live run of the relay: join code, lockout, tokens, size cap, one host, rejoin as the same player, full at 4).
- **Live Wi-Fi test in the app's browser:** start `python3 tools/share_server.py --local --port 8790 --hours 1` in a Terminal tab (this computer only, so it never clashes with the family's port 8020), open `http://localhost:8790` (host) and `http://127.0.0.1:8790`, `http://mayhem.localhost:8790` (friends: separate addresses keep their saves apart), call `MG.Engine.startHostTicker()` in each tab (hidden tabs don't animate), and close the Terminal tab afterwards.
- **Visual:** `.claude/launch.json` has `marsupial-mayhem` (`share_server.py --local` on port 8790, this computer only). The app's preview tool reads `launch.json` from the folder the session **started** in (moving a session to this folder later didn't change that), so start Claude sessions in this folder. A session started in another game's folder must never add this game to that folder's `launch.json`. Without the preview, headless Chrome can screenshot the double-clicked page: load the game scripts in a scratch page, drive `MG.Engine.frame()` yourself, then keep redrawing the frozen frame (a window resize clears the canvas).
- A hidden preview pane doesn't animate: drive scenes with `MG.Engine.frame(t)` or the host ticker.
- Tests change saves: back up `localStorage` keys starting `marsupialmayhem.` before testing in a browser, and put them back afterwards.
