# Build plan

Work through the milestones in order. Stop after each one, show the owner, and **offer** to save a backup (commit) and to push it to GitHub. Do each only when they say yes.

The family plays it two ways, and both must keep working after every milestone: **on GitHub** (the public web page) and **from this project folder** on the home network (`share-on-network.command`, 2–4 players).

## Milestone 0: setup (built 13 Nov 2026)

- `git init` this folder and add a `.gitignore` (ignore `node_modules`, `dist/`, `.DS_Store` and generated artifact pages). Set the commit email to the owner's GitHub no-reply address in this repo's git config (as in the owner's other game repos), never the Gmail.
- Copy the core engine, net, tests and share server from Sloth Slap (the local copy at `../Sloth-Slap-Game`, read-only: see `TECH_PLAN.md`). Rename `SS` to `MG`.
- `index.html` with a placeholder title screen: "Marsupial Mayhem™" and "© 2026 Mark A. Nakasone. All rights reserved."
- `.nojekyll`, so GitHub Pages serves the files as they are.
- `.claude/launch.json` with a preview server on port **8790**.
- README skeleton: a PLAY NOW link (once the page exists), play instructions, controls, how to play on home Wi-Fi, and the Privacy, Content (cartoon action with blood on by default, which can be switched off), Credits and Copyright sections (all rights reserved).
- **Done when:** the page opens by double-click and in the preview pane, the tests run (even if they only check boot), and there are no console errors.
- Then offer to create the GitHub repo (`marsupial-mayhem`), push, and switch on GitHub Pages. Only with the owner's yes.

## Milestone 1: vertical slice (the most important one; built 13 Nov 2026, waiting for the owner to play it)

This is where "better than Sloth Slap" gets decided. Polish it before adding more.
- **Boomer** (red kangaroo) fully playable: move, jump, block, basic, big and special (Boomer Bound), plus the Tail Counter trait.
- **One Outback map** with platforms, a gate checkpoint, crates, hearts and two power-ups.
- **Three enemy types:** a rabbit swarmer, a feral cat ambusher and a feral pig charger, plus a mini-boss version of the rabbit.
- **One weapon pickup and the kick grenade:** pull the pin, drop it, kick it. Boomer is the best kicker, so this is where the feel gets tuned.
- **Blood** on by default, with the Settings switch to turn it off.
- Keyboard, gamepad and touch controls, with the on-screen key strip and Pause → Controls.
- Synthesised sounds and one music track for the Outback.
- **Done when:** it feels great to play for 5 minutes, runs at 60 fps on a phone, the tests cover it, and the owner has played it.

## Milestone 2: home Wi-Fi play

Early on purpose: everything after this is built and tested to work on Wi-Fi.
- `share-on-network.command` in this folder starts the share on port **8020**. The host opens `http://localhost:8020`, friends open `http://<wifi-network-address>:8020` and enter the 4-digit code.
- 2–4 player co-op on the vertical-slice map, including a phone joining, and reconnects.
- Keep every hardening rule in `CLAUDE.md`. Only one window may host.
- On the public GitHub page there's no Wi-Fi button (it can't reach a home share).
- **Done when:** the tests cover 3 Wi-Fi players, the owner's family has played it together at home, and the GitHub page still works.
- **From here on,** every milestone adds its Wi-Fi tests and keeps them passing.

## Milestone 3: the roster

- All 12 playable characters with their moves and traits (`ROSTER.md`), built as reusable ability modules: glide, burrow, swim, climb, play dead, tongue grab, super armour, double jump.
- A select screen with 12 tiles plus 2 locked "?" tiles, showing stat bars, the build tag (Fast, Power or Balanced) and a one-line fact.
- **Tournament Duel** vs CPU (three difficulties), 2 players on one keyboard, and 2–4 player Wi-Fi free-for-all with CPU fillers, on duel stages. Fair fights: weapons and armor only from stage pickups.
- **Done when:** every character's special is tested and each feels different.

## Milestone 4: the pouch

- A joey sidekick and a stored item in the pouch (`DESIGN.md`). The owner confirmed both on 13 Nov 2026; show the details before building.
- **Done when:** it's in campaign and duel, it's tested, and the owner likes it.

## Milestone 5: weapons, shop and upgrades

- The weapons (a mix of real-style weapons with marsupial twists, plus themed specials), throwing weapons, weapon upgrades and special weapons (`DESIGN.md`).
- Coins from enemies and crates, the platypus's shop between levels, and health and armor to build up. Weapon, health and armor pickups in maps.
- Follow Zombie Survival's weapons, grenades, armor and shop (`TECH_PLAN.md`), including everyone shopping together with their own coins on Wi-Fi.
- **Done when:** buying, upgrading and every weapon are tested, duels stay fair, and the owner likes it.

## Milestone 6: campaign, worlds 1–3

- **The Marsupial World map:** level stops along paths, your champion walking between them, ✓ and best scores, the shop, and story panels on the map.
- Outback (4 maps), Rainforest (3) and Cane Fields & Coast (4), with water zones.
- Bosses: Warren Warlord, Big Tom and the Cane Toad King. Allies and hazards from `VILLAINS.md`.
- Quokka helpers (the Smile Squad) in levels, and the first hidden clues.
- Story panels: the opening, the invasion, the quokkas offering to help.
- Checkpoints and saves.

## Milestone 7: campaign, worlds 4–7 and the twist

- Tasmania & Alps (3), the City (4), the Time Rift bonus world (3) and Grin Isle (4, the last in the reptilians' lair).
- The betrayal, the reptilian enemies, joining forces (CPU champions fighting beside the players), and the finale: the Grand Grinner, then the Croc Emperor. The Hypnotic Grin mechanic.
- Secret unlocks: Ghost (thylacine) in the Time Rift, and Cousin Cuscus (Sloth Slap crossover).
- Bonus: the Isle of Man wallaby level.

## Milestone 8: polish and release

- Music for each world, settings (volume, blood and gore, key remapping, difficulty), accessibility (bigger touch buttons option, high contrast).
- The level editor (developer tool).
- README finished, with Marsupial Mayhem™ everywhere. The owner decides about an itch.io page; registering the trade mark is the owner's step.
- Optionally an itch.io zip, a Claude Artifact web version and a desktop build.
