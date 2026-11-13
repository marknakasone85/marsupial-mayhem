# Tech plan

## Starting point: reuse Sloth Slap's engine

The owner's *Sloth Slap Game* already has a working engine: about 9,200 lines of JavaScript plus tests, all the owner's own code. Don't start from scratch.

A copy is already on this computer at `../Sloth-Slap-Game` (on 13 Nov 2026 it matched GitHub). Read and copy from it, but **never change anything in that folder**: each of the owner's games keeps its own files, backups, settings and servers. Only if it's missing, clone a read-only reference:

```bash
git clone https://github.com/marknakasone85/sloth-slap-game.git ../sloth-slap-reference
```

**Copy and adapt** (rename the global namespace from `SS` to `MG` throughout):

| From Sloth Slap | What it gives |
|---|---|
| `js/core/engine.js` | game loop, scaling, host ticker, utilities, `Save` (localStorage) |
| `js/core/input.js` | keyboard, gamepad and pointer mapped to virtual keys; control schemes SOLO/P1/P2; menus |
| `js/core/touch.js` | phone touch buttons |
| `js/core/audio.js` | synthesised sound effects and step-sequencer music |
| `js/core/fx.js` | particles, popups, screen shake |
| `js/net/net.js`, `js/net/sync.js` | Wi-Fi co-op and battles: host-runs-the-game, snapshots about 30 per second, auto-rejoin |
| `tools/share_server.py`, `share-on-network.command` | home-network share and relay, already hardened (see CLAUDE.md) |
| `tools/run-tests.sh`, `tools/tests/harness.js` | automated tests with a fake browser |
| `.claude/launch.json` | preview server for the app's browser pane. **Change the port to 8790.** |

**Use as patterns, but rewrite for marsupials:** the fighter (`js/entities/fighter.js`), enemies (`enemy.js`), the duel CPU (`ai.js`), the scenes (`js/scenes/*`), art (`js/art/*`) and data (`js/data/*`).

**Don't copy:** Sloth Slap's characters, art, maps, names or trademark text.

Sloth Slap's own `CLAUDE.md` explains how its engine fits together: the world interface, campaign and duel scenes, Wi-Fi messages, enemy behaviours, and how to add a character, map or enemy. Read it in the reference copy.

## Weapons, grenades, armor and the shop: follow Zombie Survival

The owner's zombie survival game (`../Jacob-ZombieSurvival`, its own repo) already has most of what `DESIGN.md` asks for: guns as data (`js/weapons.js`), grenades that bounce, stick and explode in four ways (`js/grenades.js`), armor sets and health boosts (`js/gear.js`), and coins and a shop (`js/game.js`), including shopping together on Wi-Fi with each player's own coins. Its README describes how they play. Read it for patterns and copy what fits into this folder. **Never change that folder.** Its weapons are named and drawn for zombies, so rename and redraw them as the mix in `DESIGN.md`. The kick grenade (pull the pin, drop it, kick it) is new.

## Architecture

- **No ES modules, no build:** plain `<script>` tags in `index.html`, in dependency order, so `file://` works.
- **Data as `.js` files:** `js/data/characters.js`, `levels.js`, `stages.js`, `weapons.js` and `worldmap.js` (the Marsupial World map: stops, paths and which level each opens). Each map is a plain object: theme, music, length, platforms, enemies, crates, pickups, gates, boss, props, and optional `gravity` or `water` zones.
- **Character abilities as components:** glide, burrow, swim, climb, play dead and tongue grab are small ability modules a character lists, not special cases scattered through `fighter.js`. That keeps 12 or more characters manageable.
- **Water zones:** a new engine feature for world 3 and the water opossum: buoyancy, slower movement for non-swimmers, and breath for most characters.
- **Fixed timestep:** keep the update rate steady (for example 60 Hz) and decouple it from drawing, so physics and Wi-Fi sync behave the same on every device.

## Better than Sloth Slap

1. **Pre-rendered procedural art:** draw each character pose once to an offscreen canvas and cache it, so the art can be more detailed and stay fast on phones. Re-render on resize.
2. **Gamepad everywhere:** the input layer already reads gamepads. Make sure every menu and mode works with one, for up to 4 local pads.
3. **Remappable keys and difficulty settings,** saved in localStorage.
4. **An in-browser level editor:** place platforms, enemies and gates, play-test, then export a `levels.js` entry to copy in. It's a developer tool, not linked from the player menus.
5. **A select screen for 14:** 12 tiles plus 2 locked "?" tiles that reveal once unlocked. Sloth Slap's layout fits only 12.
6. **Story panels:** a simple in-engine scene between worlds and on the world map, with characters, a few lines of text, and tap or press to continue.
7. **A world map scene:** the Marsupial World map, where your champion walks between level stops and the shop opens. It replaces Sloth Slap's plain map picker.
8. **Allied CPU champions:** in the last Grin Isle maps, CPU marsupials fight beside the players. Build them from the duel CPU (`ai.js`) pointed at enemies instead of players.

## Budgets

- **Size:** 2–3 MB total, with no image or audio files. Fonts are bundled `.woff2` files with their licence files, as in the owner's other games.
- **Performance:** 60 fps on a mid-range phone with 4 players and about 30 enemies on screen.
- **Network:** at most about 3 KB per Wi-Fi snapshot at about 30 per second.

## Testing

- Keep Sloth Slap's approach: a fake-browser harness that runs menus, every character's specials, every map, Wi-Fi co-op with 3 players, and a difficulty bot. Add checks with `check(ok, 'what')`.
- Sloth Slap's harness runs on **macOS's built-in JavaScriptCore**. If this computer isn't a Mac, adapt `run-tests.sh` to run the harness with Node, which needs no npm packages for this.
- Also check visually in the app's browser pane (`.claude/launch.json` on port 8790). A hidden pane freezes animation, so drive the game with a step function or the host ticker when testing.

## Deployment (all static)

The family's two main ways to play (the owner, 13 Nov 2026) are the GitHub page and the home Wi-Fi share from this folder. Both must keep working after every milestone.

- **Double-click `index.html`:** works offline.
- **Home Wi-Fi (main):** `share-on-network.command` in this project folder, on port **8020**, for 2–4 players. Built early, at Milestone 2.
- **GitHub Pages (main):** the repo `marknakasone85/marsupial-mayhem`, serving `main` with a `.nojekyll` file, as with the owner's zombie survival game. Every push updates the page within a minute or two. Wi-Fi play switches itself off on public addresses (any host that isn't localhost, an IP address or `*.local`). The page must contact no other website: no outside scripts, fonts, trackers or analytics.
- **itch.io (optional):** zip the folder and upload it as an HTML5 game. Wi-Fi play is off there too.
- **Claude Artifact web version (optional):** like Sloth Slap's `artifact.html`, with inline CSS and `WEB_ONLY = true`.
- **Desktop app (optional, later):** Electron as in Sloth Slap, or Tauri for a smaller download.
