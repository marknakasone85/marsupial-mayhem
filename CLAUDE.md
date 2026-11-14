# Marsupial Mayhem™: project guide

A comical cartoon brawler starring marsupials: **Marsupial Mayhem™** (name chosen by the owner on 13 Nov 2026). It's the follow-up to the owner's *The Sloth Slap Game* (https://github.com/marknakasone85/sloth-slap-game): the same kind of game, but better and a bit bigger. Plain HTML5 canvas and JavaScript, **no build step and no dependencies**: every picture and sound is made in code.

The plan is in `docs/`. Read `docs/DESIGN.md`, `docs/ROSTER.md`, `docs/VILLAINS.md`, `docs/TECH_PLAN.md` and `docs/BUILD_PLAN.md` before writing code, and `docs/DECISIONS.md` before changing anything already decided.

## Status

Planning finished on 13 Nov 2026. Later that day the owner answered the open questions and extended the story (quokkas as allies who betray everyone to the reptilians, levels on a Marsupial World map), and added weapons, a shop and upgrades: see `docs/DECISIONS.md`.

**Milestone 0 (setup) was built on 13 Nov 2026:** the engine from Sloth Slap, a title screen, the share server and tests.

**Milestone 1 (vertical slice) was built on 13 Nov 2026:** Boomer, the Outback map *Tournament Trail* (rabbits, cats, pigs, the mini-boss Big Buck), the kick grenade, the Gumnut Gatling, power-ups, gates, 2 players on one keyboard, and tests including a bot that plays the map. Still to do for Milestone 1: the owner plays it, and it's checked on a real phone (frames take about 1.5 ms on the Mac).

**Milestone 2 (home Wi-Fi) was built on 13 Nov 2026:** WI-FI menu, host lobby with join code, join screen with a number pad, friends' view drawn from snapshots, drop-in, reconnect as the same player, Back to Lobby. Tested with 3 players through the whole map, and live in the app's browser against the real share server. Still to do: the family plays it together at home on real phones.

**Milestone 3 (the roster) was built on 13 Nov 2026:** all 12 marsupials with their own moves, specials and traits, a select screen (12 tiles + 2 locked secret tiles), Tournament Duel (vs CPU at 3 levels, 2 players on one keyboard, 3 stages, supply drops) and Wi-Fi battles for 2-4 with CPU fillers. Still to do: the owner tries the characters and says which feel right.

**Milestone 4 (the pouch) was built on 13 Nov 2026:** a joey for every character (in the pouch for the mums, a backwards pouch for Tank and Chompers, on the back for the boys and Stripes) that nips pests and fetches pickups by itself, a JOEY button (Joey Rush, one shared cooldown), a rescue once per map, joey levels 1-5 that grow with each map cleared (saved), and the pouch slot (a spare heart or power-up is saved by itself; POUCH uses it). In the campaign, duels (level 1, no rescue) and Wi-Fi. Still to do: the owner tries it.

**Milestone 5 (weapons, shop and upgrades) was built on 13 Nov 2026:** 7 weapons (one carried at a time, refilling by itself, upgradable to level 3), weapons to borrow in maps and duel supply drops, 3 armor sets (a blue bar that takes hits first), Bigger Heart and Grenade Belt, coins from pests, crates and platforms, and the platypus's shop (title screen, after a map, 2 players on one screen, and Shop Together on Wi-Fi). Details and the choices made are in `docs/DESIGN.md` and `docs/DECISIONS.md`. Still to do: the owner tries it, and Shop Together is tried live on the home Wi-Fi. 

**Milestone 6 (worlds 1-3) was built on 13 Nov 2026:** the Marsupial World map (walk between stops, ticks and best scores, the shop stop, Wi-Fi friends see the host's map), story panels (opening, invasion, Smile Squad, world intros), 10 new maps (11 in all: Outback 4, Rainforest 3, Cane Fields & Coast 4), cane toads, three world bosses (Warren Warlord, Big Tom, Cane Toad King), emu stampedes, cassowaries, crocodiles, water and swimming, Smile Squad quokka helpers, a tree-kangaroo and a quoll as allies, and the first clues. Player 1's grenade is now G and the big attack E (the owner's request). Still to do: the owner plays it.

**Milestone 7 (worlds 4-7 and the twist) was built on 14 Nov 2026,** while the owner slept (they asked for it to be saved and pushed without asking): 15 new maps (26 in all), branches on the world map (Time Rift and Grin Isle both after the City), foxes, hypnotised pademelons, seven reptiles, quokka minions with the Hypnotic Grin (dizziness), seven new bosses (quoll champion, Foxy Roxy, Diprotodon, marsupial lion, Procoptodon, the Grand Grinner in three phases, the Croc Emperor), CPU champions fighting beside you on Grin Isle, native animals that run off instead of bleeding, the betrayal and the ending, the two secret characters (Ghost, Cousin Cuscus) and Benny's Isle of Man bonus map. Helper agents drew the new scenery, creatures and songs. Still to do: the owner plays it.

**Milestone 8 (polish and release) was built on 14 Nov 2026:** a Settings page (music and effects volume, blood ON/GORE/OFF, difficulty for the adventure, bigger touch buttons, high contrast, key hints, changing the keys for both players), a level editor (`tools/editor.html`), an itch.io zip script (`tools/make-itch-zip.sh`) and the finished README. What's left is the owner's: playing it all, an itch.io page if wanted, and registering the trade mark. `docs/README.md` lists the plan files.

**The Top End and a bigger shop were added on 14 Nov 2026** (the owner's requests): map 27, Darwin Harbour (a bonus branch after the Rainforest, saltwater crocodiles, the boss Old Snapjaw); the shop in sections (WEAPONS, ARMOUR, HEALTH, GRENADES, EXTRAS) with explanations, 7 new items (19 in all) and selling back for half price; a big SHOP button on the world map that brings you back to the same stop; the Shop line standing out after every map. Details in `docs/DESIGN.md` and `docs/DECISIONS.md`. Later that day, "meanwhile" cutscenes after each world (the sponsor's secret deal with the reptilians, step by step) and friend panels (the quoll champion joins; friends from every map) made the story clearer, at the owner's request.

## Rules the owner cares about

These carry over from the owner's other games (Sloth Slap, the zombie survival game, Survive Bob).

- **Keep it easy to deploy.** No build tools, no npm to play, no backend beyond the home-network share server. It must run by double-clicking `index.html`, from GitHub Pages, from itch.io (as a zip) and on phones. Flag up front any feature that would need a real server (online play, accounts, global leaderboards).
- **Plain `<script>` tags, no ES modules,** so `file://` works. Data lives in `.js` files, not `.json` loaded with `fetch` (which fails on `file://`). The `data/*.json` files in this folder are planning snapshots, not game files.
- **Controls are always shown on screen** in every mode: a key-hint strip, Pause → Controls, and touch buttons on phones. Any new move or mode goes into all three.
- **Never delete or replace maps.** New ones are appended.
- **Backups:** make this folder a git repo at Milestone 0. After each finished feature, offer to "save a backup", and commit only when the owner says yes. End commit messages with the Co-Authored-By line from the system reminder.
- **How the family plays it** (the owner, 13 Nov 2026): pushed to GitHub and played from its public web page (GitHub Pages), and launched from this project folder (`share-on-network.command`) for multiplayer on the home network. Both must keep working after every milestone.
- **GitHub:** the public repo is https://github.com/marknakasone85/marsupial-mayhem (created 13 Nov 2026). GitHub Pages serves `main` (with a `.nojekyll` file) at https://marknakasone85.github.io/marsupial-mayhem/ and updates a minute or two after each push. Offer to push, and push only when the owner says yes. `git push` signs in with the GitHub CLI (`gh`, account marknakasone85). If GitHub says it isn't signed in, run `gh auth login --hostname github.com --git-protocol https --web </dev/null` in a Terminal tab: it shows a one-time code for the owner to enter at github.com/login/device.
- **Keep all three places up to date** (the owner, 14 Nov 2026): the project folder on this computer, GitHub, and the claude.ai web version. After a finished change that passes the tests and has been checked visually: commit, push, then rebuild and republish the web version (below).
- **Web version (claude.ai artifact):** https://claude.ai/artifact/UmSTargLRWgTvt9XTpunxC (private until the owner shares it). Run `python3 tools/make-artifact.py`: it builds `artifact.html` from `index.html` (the stylesheet built in, `window.MG_WEB_ONLY = true` so there's no Wi-Fi menu) and prints the `files` map. Publish `artifact.html` to that URL with the Artifact tool, passing that map (every `js/...` path mapped to itself). `artifact.html` is generated, so git ignores it.
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

1. Add it to `MG.CHARACTERS` in `js/data/characters.js`: build, stats (see the build ranges in `docs/ROSTER.md`), `basic` and `big` (a `style` for the art plus any numbers that differ from the build's defaults), `abilities`, `special`, `specialName`, `trait`, a checked `fact`, and `joey` (`'pouch'` for a mum, `'backPouch'` if her pouch faces backwards, `'back'` for the boys and pouchless species).
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
- Joeys share one cooldown (`MG.Joey`: nip 5 s, fetch 3.5 s, rush 8 s). The rescue is used up for the whole map: a checkpoint respawn keeps `rescueUsed` and the pouch. Duels make level-1 joeys with no rescue.
- The pouch saves a heart only at full health and a power-up only while one is already running; grenades and gatling ammo are never saved. With the pouch full, pickups work as normal.
- Weapons (`MG.WEAPONS`): `f.ownWeapon` is the bought one (refills at mag/reload per second after 0.6 s without shooting); `f.weapon` is what's in the paws, which can be a borrowed one from a pickup (`own: false`, no refill) until it runs out. Duels never call `MG.Gear.apply`, so shop gear stays out.
- The shop's items are `MG.Gear.ITEMS` (each with a `cat` from `MG.SHOP_CATS`). Upgrades are generic: add one to `MG.UPGRADES` with `cat`, a short loadout `key`, `prices` and `per`, then give it an effect in `MG.Gear.apply` (it sets fields on the fighter: `regen`, `blastK`, `joeyCool`, `coinReach`). Selling back: `MG.Gear.sellValue` / `sell` (half of what was paid, `MG.SELL_BACK`).
- Pest coins: `MG.coinsFor(e)` (`MG.COINS` first, else by score; world bosses a pile). "Next Map" and the shop's PLAY use `MG.Progress.next(i)`, which is -1 after a bonus map.
- The world map walks its stops in `MG.WorldMapScene.walkOrder()` (each map right after the one that opens it), so an appended branch sits next to where its path starts. A new bonus world goes at the end of `MG.WORLDS` with `bonus: true`.
- Coins go to `MG.killerOf(hit)`: the fighter, a shot's `hit.owner` (set by `shot()` in `weapons.js`) or a grenade's owner. Wallets are per player (`p1`, `p2`), never per character. A Wi-Fi friend adds coins from the host's running total `co` with `MG.Gear.netEarn` (remembered per game id, so rejoins don't count twice).
- `MG.WEAPONS`, `MG.ARMORS`, `MG.UPGRADES` and `MG.Gear.friends` have no prototype (friends send item names), and `MG.Gear.clean` checks every friend's loadout.
- Maps are appended to `MG.LEVELS` and each needs a stop in `MG.MAP_STOPS` and a place in `MG.WORLDS` (`js/data/worldmap.js`). A map is open when it's the first, or it or the one before it is cleared (`MG.Progress`). A best score from before Milestone 6 counts as cleared.
- Animals that aren't pests (`MG.NPC`, `js/entities/hazards.js`) can't be hit and aren't in `targets()`. Crocs never attack pests (a clue). A quokka with `late` stays hidden until that gate opens (or the boss falls).
- Water: `L.water` zones `{ x, w, depth }`; a fighter more than 24 px under the surface is `swimming` (gravity x0.22, speed x0.6, Paddles x1.35, JUMP = a stroke up). Never put a gate or a boss arena in water.
- Bosses use `d.moves` with `<move>Wind` states; the world bosses' moves are in `Enemy.worldBossMove`, and `world.spawnMinions(type, n)` brings their helpers. A burrowed or lurking boss can't be hit (visual flags 64 and 128).
- Native animals (`native: true` in `MG.ENEMY_TYPES`) are knocked out by `Enemy.snapOut`: no blood, they run off (`fleeing`), coins still drop. Boss "echoes" (`echo` seconds) vanish without coins.
- Boss poses for the art (and Wi-Fi friends) come from `Enemy.pose()` ([option, amount]); snapshots send it as enemy fields 11-12. The Grand Grinner's moves come from `d.phases` by health (`checkPhase` after damage).
- The Hypnotic Grin: a grinning quokka calls `f.hypnotise(dt)` on players facing it (not blocking); ~1.1 s makes them dizzy (`f.dizzy(secs)`: slow, no attacks, stars). The Grand Grinner's flash dazzles anyone looking at him.
- Story panels and cutscenes are data in `MG.STORY` (fields listed at its top: `meanwhile`, `dark`, `props`, `bursts`, `banner`; cast `from`/`walk`, `at`, `says`, `shadow` + `eyes`, `grin`, `dizzy`, `laugh`). `MG.Story.pending()` decides the order; a key press finishes a panel's animation before turning the page. Wi-Fi friends restart a panel's animation when the host turns the page (`storyT`).
- Secret characters live in `MG.SECRETS` with full definitions; `MG.Unlocks` (saved 'unlocked') decides; `MG.charById` finds them; `MG.pickable()` is what this device can pick; `MG.validCid` accepts any real id from Wi-Fi friends.
- Keys: never hard-code keyboard letters in hints; use `MG.Keys.label(player, action)` (the key strip and Controls page do). New scripts go into both `index.html` and `tools/editor.html` (a test checks).
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
| Keyboard, gamepad and pointer as virtual keys; control schemes `MG.Controls` (SOLO/P1/P2: left, right, up, down, attack, big, special, shoot, grenade, joey, pouch; gamepad RB shoot, LT grenade, Back joey, RT pouch); `MG.readControls` (presses like `attackP`, plus held `shoot` and `jump`); `MG.Menu` | `js/core/input.js` |
| Phone touch buttons (HIT, BIG, SUPER, SHOOT, BOOM = grenade, JUMP, BLOCK, JOEY, POUCH showing the saved item...) on their own layer | `js/core/touch.js` |
| Synthesised sounds and step-sequencer music (`SONGS`: `title`, `outback`, `boss`) | `js/core/audio.js` |
| Particles, popups, shake, blast rings, blood or confetti, slow-motion finisher; `MG.Settings.blood` (ON by default) | `js/core/fx.js` |
| Art drawn in code: shared helpers (`MG.Art.taper`, `oval`, `shadow`), kangaroos (Boomer, Stinker, Benny), grenade and gatling | `js/art/kangaroo.js` |
| Art: one rig for the other 9 marsupials (`MG.Art.critter` with a species preset in `MG.Art.LOOKS`), `MG.Art.character` (draws anyone), `MG.Art.portrait`, the burrow mound, `MG.Art.joey` (a mini parent peeking from the pouch, riding on the back or hopping out) | `js/art/critters.js` |
| Art: rabbits (and Big Buck), feral cats, feral pigs, long grass | `js/art/pests.js` |
| Art: Outback background, decorations, wooden platforms, crates, gates, finish line, pickups, projectiles | `js/art/outback.js` |
| Data: weapons, armor, upgrades and coin values (`MG.WEAPONS` with each weapon's `fire`, `MG.ARMORS`, `MG.UPGRADES`, `MG.COINS`, `MG.WEAPON_LEVELS`) | `js/data/weapons.js` |
| Data: the worlds `MG.WORLDS`, map stops `MG.MAP_STOPS`, story panels `MG.STORY` | `js/data/worldmap.js` |
| Data: the 12 playable characters `MG.CHARACTERS` (build, stats, `basic`/`big` move styles and numbers, `abilities`, `special`, trait, fact, art + look), the 2 locked `MG.SECRETS`, `MG.coatFor`; maps `MG.LEVELS` | `js/data/*.js` |
| Trait modules `MG.ABILITIES` (hooks: update, physics, jump, hit, speed) run by `MG.Abilities` | `js/entities/abilities.js` |
| Wallets and the shop's rules `MG.Gear` (saved per player `p1`/`p2`: `offer`, `act`, `loadout`, `apply`, `clean`, `friends`, `netEarn`), coins in maps `MG.Coin`, `MG.killerOf` | `js/entities/gear.js` |
| CPU champions on the players' team `MG.AllyAI` (maps list them in `allies`) | `js/entities/allies.js` |
| Hazards and allies `MG.NPC` (emus, cassowary, croc, Smile Squad quokka, tree-kangaroo, quoll; `snap`/`drawState` for Wi-Fi) | `js/entities/hazards.js` |
| The joey `MG.Joey` (nip, fetch, Joey Rush, rescue, `renderState` for Wi-Fi) and saved joey levels `MG.joeyLevel` / `MG.growJoey` | `js/entities/joey.js` |
| The 12 specials `MG.SPECIALS` (start, update, land, pose, CPU range) | `js/entities/specials.js` |
| CPU opponent `MG.CPU` (3 levels: JOEY, CHAMPION, LEGEND) | `js/entities/ai.js` |
| Fighter `MG.Fighter` (each character's attack and big attack, combos, specials and traits through the modules above, grenade pin and punt, weapons (`equip`, `giveWeapon`, `tryFire`), armor, power-ups, the joey and the pouch (`store`, `usePouch`), `renderState`/`drawState`) and `MG.Projectile` (gumnuts, shockwaves, cubes that become walls, stink clouds, waves, wallabies, bins, the tongue, and the weapons' shots: `pierce` counts, `burst` areas, homing `home`) | `js/entities/fighter.js` |
| The kick grenade `MG.Grenade` (fuse, bounces, kicks, blast that never hurts players) | `js/entities/grenade.js` |
| Pests `MG.Enemy` (behaviours: swarmer, ambusher, charger, boss), `MG.Crate`, `MG.Pickup` | `js/entities/enemy.js` |
| Wi-Fi client `MG.Net` (header `X-Mayhem`; `rejoin()` sends the old token so the relay gives back the same player number) and `MG.Sync`: records effects and sounds for guests, `snapshot(scene)` (the campaign, ~1-2 KB, zero values left out), `sendInput` (held left/right/down/shoot/jump + presses in `MG.PRESS_KEYS`) | `js/net/*.js` |
| Drawing helpers, controls page, key strip (compact = labels under the keys, for two strips side by side), `UI.pouchItem`, `MG.MenuList` | `js/scenes/ui.js` |
| Title screen `MG.MenuScene` (PLAY, 2 PLAYERS, TOURNAMENT DUEL, SHOP, WI-FI, CONTROLS, SETTINGS) | `js/scenes/menu.js` |
| Settings data: gore, difficulty `MG.difficulty()`, touch size, contrast, volumes `MG.applyVolume`, changing keys `MG.Keys` (fills `MG.Controls` in place), `MG.keyLabel` | `js/core/settings.js` |
| The Settings page `MG.SettingsScene` (and its keys page) | `js/scenes/settings.js` |
| Level editor (developer tool, double-click to open): page, rules `MG.EditorCore` (place, pick, move, remove, check, serialize) | `tools/editor.html`, `tools/editor.js`, `tools/editor-core.js` |
| Campaign `MG.CampaignScene` (themes, water `waterAt`, animals `npcs`, `spawnMinions`, saved progress `MG.Progress`; the world interface, camera, gates by zone, boss arena, pause, win/lose; with `net: true` it hosts: `onNet`, `netInput`, drop-in, snapshots ~30/s, Back to Lobby), `MG.drawCampaignWorld` (shared by host and guests) and the HUD `MG.CampaignHUD` | `js/scenes/campaign.js`, `campaign_hud.js` |
| Wi-Fi screens: `MG.WifiScene` (HOST / JOIN), `MG.LobbyScene` (host: join code, player cards, START), `MG.JoinScene` (code pad, I'm ready) | `js/scenes/lobby.js` |
| Friends' view `MG.RemoteScene`: draws snapshots, smooths movement, sends button presses, rejoins by itself | `js/scenes/remote.js` |
| The Marsupial World map `MG.WorldMapScene` (host, local, Wi-Fi friend; SHOP button; `walkOrder`), story panels and cutscenes `MG.StoryScene` / `MG.Story` (silhouettes, walking cast, speech bubbles, bursts) | `js/scenes/worldmap.js` |
| The platypus's shop `MG.ShopScene` (sections as tabs with explanations, buy and sell back; from the title screen, the world map (`toMap`, back to `mapAt`), after a map (PLAY or WORLD MAP), 2 players, Wi-Fi host and friend) | `js/scenes/shop.js` |
| Art: worlds 4-7 scenery (backgrounds alps, tasmania, city, rift, grinisle, lair, isleofman; their plants, platforms, water, decor, `A.weather`) | `js/art/worlds2.js` |
| Art: worlds 4-7 creatures (fox, pademelon, reptiles, `crocLand`, Grand Grinner, extinct giants, pygmy possum, sloth) | `js/art/creatures.js` |
| Art: worlds 1-3 (backgrounds by theme, ground plants, themed platforms, water, decor and clues, toad, emu, cassowary, croc, quokka, goanna, tree-kangaroo, quoll, fruit, the world map) | `js/art/worlds.js` |
| Art: weapons in paws (`MG.Art.heldWeapon`, `weaponIcon`, `weaponPickup`), the new shots (wraps `MG.Art.projectile`), coins, armor plates (`armorOn`), upgrade icons, the platypus | `js/art/gear.js` |
| Art: the Top End (theme `topend`: background, plants, wharf platforms, estuary water, weather; decor termiteMound, pandanus, bigMangrove, crocSign, wharf, boatWreck) | `js/art/topend.js` |
| Character select `MG.SelectScene` (modes campaign, coop, duelCpu, duel2), `MG.DuelMenuScene`, `MG.STAGES`, `MG.STAT_BARS`, `UI.characterDetails` | `js/scenes/select.js` |
| Tournament Duel `MG.DuelScene` (rounds, supply drops, CPU, Wi-Fi battle host), `MG.DuelHUD`, `MG.drawDuelStage`, `MG.Sync.duelSnapshot` | `js/scenes/duel.js` |
| Friends' view of a Wi-Fi battle `MG.RemoteDuelScene` | `js/scenes/remote_duel.js` |
| Home-network share and relay (port 8020) | `tools/share_server.py`, `share-on-network.command` |

## Testing

- **Automated:** `tools/run-tests.sh` (a few minutes: bots play all 27 maps alone and as 3 Wi-Fi players). It syntax-checks every game file, runs `tools/tests/test_*.js` in macOS's built-in JavaScriptCore with a fake browser (`harness.js`), and checks the share server's safety rules (`test_server.py`). Add checks with `check(ok, 'what')` and add new test names to the `for t in ...` list.
  Tests: `boot` (title screen, settings, Wi-Fi rules), `boomer` (every move, the grenade, the gatling, power-ups, each pest), `campaign` (map, gates, checkpoints, Big Buck, win/lose, blood, pause, touch, 2 players), `solo` (a bot plays the map 3 times and must finish most runs), `roster` (all 12 characters: every attack, big attack, special and trait, every pose drawn), `settings` (changing keys and the swap rule, the settings pages, difficulty in the adventure but not duels, volumes, gore, touch size, contrast), `editor` (its script list matches index.html, every tool, the checks, export round-trips every map), `twist` (the "meanwhile" cutscenes: their order, every frame drawn, finishing then turning a page; friend panels; the 15 new maps and their branches, the Isle of Man secret, the Hypnotic Grin, natives running off, every reptile, every new boss move, the Grand Grinner's phases and echoes, CPU champions, the betrayal and ending stories, unlocking and playing Ghost and Cousin Cuscus, Wi-Fi poses and champions), `worlds` (the 11 maps check out and draw, progress and unlocking, the world map and story panels, emus, cassowary, water and swimming, crocs, quokka helpers, tree-kangaroo, quoll, cane toads, every boss move, clues, Wi-Fi world map and animals, the lobby's open maps), `shop` (wallets and buying rules, the sections, selling back, the 7 newer items, every weapon hits, refills, borrowed weapons, levels, piercing, drop bears, magpies, armor, gear in maps and at checkpoints, coins to the right player, the shop screen with keys and taps, fair duels, Wi-Fi gear and coins, Shop Together), `joey` (who carries their joey where, nip, fetch, Joey Rush, rescue once per map, growing, duels, the pouch rules, the controls everywhere, every joey drawn, Wi-Fi presses and snapshots), `duel` (CPU vs CPU with every character, fair fights, supply drops, rounds, 2 players, the select flow, a Wi-Fi battle with a guest view), `topend` (Darwin Harbour: where it opens, the walk order, its story, Old Snapjaw's moves; the map's SHOP button and coming back to the same stop; the Shop line and the shop's two ways out after a map or a knock-out), `coop` (3 Wi-Fi players through every map with every snapshot drawn by a guest view, update sizes, lobby, drop-in, leave, reconnect, the friend's side, the WI-FI menu), and `test_server.py` (the share server's file and address rules, plus a live run of the relay: join code, lockout, tokens, size cap, one host, rejoin as the same player, full at 4).
- **Live Wi-Fi test in the app's browser:** start `python3 tools/share_server.py --local --port 8790 --hours 1` in a Terminal tab (this computer only, so it never clashes with the family's port 8020), open `http://localhost:8790` (host) and `http://127.0.0.1:8790`, `http://mayhem.localhost:8790` (friends: separate addresses keep their saves apart), call `MG.Engine.startHostTicker()` in each tab (hidden tabs don't animate), and close the Terminal tab afterwards.
- **Visual:** `.claude/launch.json` has `marsupial-mayhem` (`share_server.py --local` on port 8790, this computer only). The app's preview tool reads `launch.json` from the folder the session **started** in (moving a session to this folder later didn't change that), so start Claude sessions in this folder. A session started in another game's folder must never add this game to that folder's `launch.json`. Without the preview, headless Chrome can screenshot the double-clicked page: load the game scripts in a scratch page, drive `MG.Engine.frame()` yourself, then keep redrawing the frozen frame (a window resize clears the canvas).
- A hidden preview pane doesn't animate: drive scenes with `MG.Engine.frame(t)` or the host ticker.
- Tests change saves: back up `localStorage` keys starting `marsupialmayhem.` before testing in a browser, and put them back afterwards.
