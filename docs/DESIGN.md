# Design: Marsupial Mayhem™

## Pitch

A comical cartoon brawler set in **Marsupial World**. Australia's marsupials, plus two American opossums, start out fighting each other for **marsupial supremacy** in the Great Pouch Tournament. Pests crash the tournament: cane toads, rabbits, foxes, feral cats and feral pigs. The friendly quokkas offer to help, and the champions play level after level across the Marsupial World map to drive the pests out. Late in the game comes the twist: the always-smiling quokkas are traitors in a dark alliance with the reptilians. The good marsupials join forces to defeat them and save Marsupial World.

It's Sloth Slap's formula, bigger and better: more characters with more distinct moves, weapons, a shop and upgrades, a story that builds to a twist, and real animal facts built into the moves.

## Audience and tone

- Family game. Kids and adults play together, on one keyboard, phones, or 2–4 players on home Wi-Fi.
- Funny and a bit satirical: cartoon action, funny sounds, silly names and exaggerated animals.
- **Blood is on by default** (the owner's choice, 13 Nov 2026). Settings → Blood switches it off when younger kids play, and an optional gore mode adds extra splatter. The README's Content section must say this plainly.
- **Fun facts are true.** Every playable animal's moves come from something it really does (see `ROSTER.md`). Loading screens can show the facts.

## Modes

1. **Campaign** (1 player, 2 on one keyboard, or 2–4 on Wi-Fi co-op): levels played one after another across the **Marsupial World map**. 7 worlds of side-scrolling brawler maps, with bosses, checkpoints, the shop and the story.
2. **Tournament Duel** (versus): the "fight for supremacy" mode. vs CPU at three difficulties, 2 players on one keyboard, or 2–4 player Wi-Fi free-for-all. Last one standing wins the round, first to 2 rounds. **Fair fights:** everyone starts equal, and weapons and armor come only from pickups on the stage.
3. **Later, optional:** an endless survival mode (waves of invaders), as in Survive Bob.

## Story

The owner's outline (13 Nov 2026): the marsupials play levels across the Marsupial World map, and the story, and the reason they're fighting, develops as they go. The quokkas appear as allies. Not until the late levels do they reveal themselves as evil traitors who have made a dark alliance with the reptilians. The good marsupials join forces to defeat them and save Marsupial World.

**Why they fight changes three times:**
1. **For glory** (the opening): the champions fight each other for marsupial supremacy.
2. **For home** (worlds 1–5): they drive the pests out of each region. Rivals start to respect each other.
3. **For Marsupial World** (world 7): after the betrayal, every good marsupial joins forces.

**Story beats:**
1. **Opening:** the Great Pouch Tournament begins in the Outback, "proudly sponsored by Grin Isle Holidays". A jolly quokka sponsor hands out medals and poses for selfies. Champions are introduced, and the platypus tries to enter and is turned away: "Egg-layers can't enter!" (a running gag).
2. **The invasion:** pests storm the first event. The quokkas' cheerful **Smile Squad** rushes in to help and sends the champions across Marsupial World to chase the pests out, region by region.
3. **Allies on the road:** quokka helpers turn up in levels and on the map with hearts, tips and supply drops. They really are helpful, so the twist is a surprise.
4. **The clues,** for sharp-eyed players: shed snake skins and scaly footprints near pest camps, crates stencilled "GRIN ISLE", crocodile eyes watching from the river in world 3, a quokka helper chatting with a goanna in the background (both freeze when you look), and quokka help that always arrives just too late.
5. **The time rift:** an optional world where the extinct giants appear (Diprotodon, the marsupial lion, the giant short-faced kangaroo). The secret thylacine is unlocked here.
6. **The twist** (world 7): the quokkas invite the champions to a victory party on Grin Isle. It's a trap. The quokkas drop their smiles, and the reptilians come out of hiding: crocodiles, goannas, snakes and lizards. The quokkas shipped the pests in for them, in return for a share of Marsupial World. Their plan has a name: **Operation Marsupial World Conquest**.
7. **Joining forces:** every good marsupial teams up, including former rivals such as the spotted-tailed quoll. In the last maps, CPU marsupial champions fight beside the players.
8. **Finale:** the **Grand Grinner** (the jolly sponsor, unmasked) on Grin Isle, then the **Croc Emperor** in the reptilians' lair under the island. Marsupial World is saved. The tournament resumes, the quokkas are on probation, the reptilians go back to sunbaking, and the platypus finally gets to watch.

Tell the story with simple in-engine panels between worlds and on the world map: no video, just a few lines of text and the characters posing.

## The Marsupial World map

- Campaign levels are stops along paths on a cartoon map of **Marsupial World**: a made-up continent based on Australia's regions, with Grin Isle off the coast and the Time Rift as a glowing crack.
- Your champion walks the map between stops. Clearing a level opens the next. Cleared levels show a ✓ and best score, and any level you've seen can be replayed at any time (the Sloth Slap rule).
- The platypus's shop is open on the map between levels. Story panels play on the map.
- Grin Isle is on the horizon from the start, sunny and smiling.
- In co-op everyone sees the same map, and the host picks the level.

## The signature mechanic: the pouch (confirmed by the owner, 13 Nov 2026)

Each playable marsupial carries something in its pouch:
- **A joey sidekick** that pops out to help (a quick extra attack, a revive, or picking up items), and grows stronger through the campaign.
- **One stored item:** grab a power-up and keep it for later instead of using it at once.
- **Funny true detail:** numbats have no pouch, so the numbat's joey rides on its back. Wombats, bilbies and Tasmanian devils have backwards-facing pouches, and the art can show it.

## Weapons, shop and upgrades (the owner's choices, 13 Nov 2026)

Fighting uses all of these:
1. **Each marsupial's own attacks:** basic, big, special and trait (`ROSTER.md`).
2. **Weapons:** a mix of real-style weapons with funny marsupial twists, plus themed specials. Example names: a gumnut gatling, a drop-bear launcher, a eucalyptus-oil flamethrower. Drawn in the game's cartoon style.
3. **Throwing weapons,** such as a grenade: **pull the pin, drop it, and kick it** toward the target. Every character can kick one, and the kangaroo family kicks furthest.
4. **Weapon upgrades and special weapons.**
5. **Building up health and armor:** an armor bar that takes the hits before health does, plus health upgrades.

**Getting them:** enemies and crates drop **coins**, which you spend at the **platypus's shop** between levels. It can't enter the tournament, so it sells to the animals who can. Weapons, health and armor pickups also turn up during maps. In Wi-Fi co-op everyone has their own coins and shops together, as in Zombie Survival. Duels ignore all of this: they're fair fights.

The owner's zombie survival game already has weapons, grenades, armor, coins and a shop: see `TECH_PLAN.md`.

## Characters

There are 12 playable characters and 2 secret ones, with 4 each of Fast, Power and Balanced. Full move sets are in `ROSTER.md`.

Sloth Slap's select screen fits exactly 12 (2 rows of 6). The 2 secret slots need a new layout, or locked "?" tiles that appear once found.

## Worlds and maps (about 25 maps, up from Sloth Slap's 17)

| # | World | Feel | Maps | Boss | Notes |
|---|---|---|---|---|---|
| 1 | **The Outback** | red dirt, spinifex, a generic giant red rock (not Uluru), road trains | 4 | **Warren Warlord** (giant rabbit, swarms) | Tournament arena; rabbit swarms; feral pig chargers; emu stampede hazard |
| 2 | **Rainforest** | Queensland and New Guinea canopy, vines, waterfalls | 3 | **Big Tom** (feral cat) | Cassowary hazard; ally: Matschie's tree-kangaroo |
| 3 | **Cane Fields & Coast** | sugar cane, mangroves, the reef offshore | 4 | **Cane Toad King** | Swimming sections (the water opossum shines); crocodile hazards, with crocodile eyes watching you (a clue); northern quoll ally (must avoid toads) |
| 4 | **Tasmania & the Alps** | snow gums, alpine huts, wild southern coast | 3 | **Spotted-tailed quoll** (rival champion, tricked by the quokkas) | Ally: mountain pygmy possum. No foxes here (Tasmania has no established fox population). |
| 5 | **The City** | a harbour city with a bridge, laneways, rooftops, bins | 4 | **Foxy Roxy** (urban fox gang boss) | The brushtail possum's home turf; city foxes are real |
| 6 | **Time Rift** (bonus) | prehistoric Australia, giant ferns, volcanoes | 3 | **Diprotodon**, the marsupial lion, the giant short-faced kangaroo | Thylacine unlocked here |
| 7 | **Grin Isle** | sunny holiday island, souvenir shops, an evil lighthouse, and the reptilians' lair under it | 4 | **The Grand Grinner** (quokka), then **the Croc Emperor** (giant saltwater crocodile) | The betrayal; reptilian enemies; hypnotic-smile mechanic; every pest returns; CPU marsupial champions fight beside you |

Bonus ideas: a secret **Isle of Man** level for the red-necked wallaby (feral wallabies really live there), and the musky rat-kangaroo as a joke unlock that refuses to hop.

## Gameplay rules carried over from Sloth Slap

These worked, so keep them:
- Gongs or gates as checkpoints, hearts after each gate and before bosses, two power-up bubbles per map.
- Co-op partners revive next to a teammate after 5 seconds, and enemy health scales with the number of players.
- **Every map can be chosen at any time** once seen (on the world map), with a ✓ and best score saved in the browser.
- Power-ups (rename them to fit the theme): Bubble Shield, Super Slap, Rapid Fire and Coffee, plus an extra-life item. Gumleaf, Termite Snack and Billy Tea are possible names.

## What "better than Sloth Slap" means

1. **More distinct characters:** every playable has a real trait-based ability that changes how you play: glide, burrow, play dead, swim, climb, tongue-grab.
2. **A story with a twist,** told across a world map: a reason to finish the campaign.
3. **Weapons, a shop and upgrades:** guns with marsupial twists, kickable grenades, armor and health to build up.
4. **Gamepad support,** remappable keys and difficulty settings.
5. **Richer art at the same tiny size:** pre-render the code-drawn sprites to offscreen canvases, so there's more detail and it still runs at 60 fps on phones.
6. **A level editor** (in the browser, exporting a `.js` data file), so maps are quicker to make.
7. **Still tiny:** a 2–3 MB budget, with no images or audio files.

## Content guardrails

- **Avoid famous characters and brands:** Taz the Tasmanian Devil (Looney Tunes), Crash Bandicoot, Bluey, Skippy the Bush Kangaroo, Blinky Bill, Kangaroo Jack, the Gumnut Babies. Character designs must not resemble them.
- **Places:** Marsupial World is made up. The villains live on the made-up **Grin Isle**. Rottnest Island is a real, protected reserve, so don't name it in-game. Use a generic giant red rock, never Uluru, which is sacred to the Anangu people. Don't borrow Aboriginal sacred imagery or art styles.
- **The dingo** is culturally important to many Aboriginal peoples, so keep it neutral, not a villain.
- **Pests and reptilians** are cartoon villains. Over-the-top cartoon action and cartoon blood are fine (blood can be switched off). No realistic pest-control methods such as baits, traps or culling.
- **The reptilians are animals:** real Australian reptiles drawn as cartoon villains, not the "lizard people secretly run the world" conspiracy theory, which carries ugly baggage. Like the quokkas, they get a light, forgiving ending.
- **Real people:** none. Any resemblance is a coincidence, as the owner's other games' READMEs say.
- **Facts must be true.** Use the checked facts in `ROSTER.md` and `VILLAINS.md`. If a new fact is needed, check it first.
