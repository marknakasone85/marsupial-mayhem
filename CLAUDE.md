# Marsupial Mayhem™: project guide

A comical cartoon brawler starring marsupials: **Marsupial Mayhem™** (name chosen by the owner on 13 Nov 2026). It's the follow-up to the owner's *The Sloth Slap Game* (https://github.com/marknakasone85/sloth-slap-game): the same kind of game, but better and a bit bigger. Plain HTML5 canvas and JavaScript, **no build step and no dependencies**: every picture and sound is made in code.

The plan is in `docs/`. Read `docs/DESIGN.md`, `docs/ROSTER.md`, `docs/VILLAINS.md`, `docs/TECH_PLAN.md` and `docs/BUILD_PLAN.md` before writing code, and `docs/DECISIONS.md` before changing anything already decided.

## Status

Planning finished on 13 Nov 2026. Later that day the owner answered the open questions and extended the story (quokkas as allies who betray everyone to the reptilians, levels on a Marsupial World map), and added weapons, a shop and upgrades: see `docs/DECISIONS.md`.

**Milestone 0 (setup) was built on 13 Nov 2026:** the engine from Sloth Slap, a title screen, the share server and tests. Next is Milestone 1 in `docs/BUILD_PLAN.md`. `docs/README.md` lists the plan files.

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
| Keyboard, gamepad and pointer as virtual keys; control schemes `MG.Controls` (SOLO/P1/P2: left, right, up, down, attack, big, special, shoot); `MG.readControls`; `MG.Menu` | `js/core/input.js` |
| Phone touch buttons (`TouchAttack`, `TouchBig`...) on their own layer | `js/core/touch.js` |
| Synthesised sounds and step-sequencer music (`SONGS`: only `title` so far) | `js/core/audio.js` |
| Particles, popups, shake, blood or confetti, slow-motion finisher; `MG.Settings.blood` (ON by default) | `js/core/fx.js` |
| Wi-Fi client `MG.Net` (header `X-Mayhem`) and the effect/sound recorder `MG.Sync` (scene snapshots come in Milestone 2) | `js/net/*.js` |
| Drawing helpers, controls page, key strip, `MG.MenuList` | `js/scenes/ui.js` |
| Title screen `MG.MenuScene` (PLAY placeholder, WI-FI, CONTROLS, BLOOD, SOUND) | `js/scenes/menu.js` |
| Home-network share and relay (port 8020) | `tools/share_server.py`, `share-on-network.command` |

## Testing

- **Automated:** `tools/run-tests.sh` (a few seconds). It syntax-checks every game file, runs `tools/tests/test_*.js` in macOS's built-in JavaScriptCore with a fake browser (`harness.js`), and checks the share server's safety rules (`test_server.py`). Add checks with `check(ok, 'what')` and add new test names to the `for t in ...` list.
- **Visual:** `.claude/launch.json` has `marsupial-mayhem` (`share_server.py --local` on port 8790, this computer only). The app's preview tool reads `launch.json` from the session's main folder, so open Claude sessions in this folder; a session started in another game's folder can't use it, and must never add this game to that folder's `launch.json`. Without the preview, headless Chrome can screenshot the double-clicked page (`--headless=new --screenshot`, a file:// address).
- A hidden preview pane doesn't animate: drive scenes with `MG.Engine.frame(t)` or the host ticker.
- Tests change saves: back up `localStorage` keys starting `marsupialmayhem.` before testing in a browser, and put them back afterwards.
