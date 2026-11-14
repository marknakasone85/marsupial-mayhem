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

### As built in Milestone 6 (13 Nov 2026)

- The world map (`js/scenes/worldmap.js`, stops in `js/data/worldmap.js`): stops on curved paths, a shop stop, ticks and best scores, locked stops, a BOSS tag on the world finales, and "coming soon" tags for worlds 4-7. Arrows walk, Enter plays; tapping a stop walks there. 2 local players walk together. On Wi-Fi the host walks (lobby, then after any map via **World Map**), and friends see the same map and story panels.
- Story panels (`MG.STORY`): the opening (4 panels) the first time, the invasion and the Smile Squad after the first map, an intro for the Rainforest and the Cane Fields, and a "three worlds cleared" panel with the Grin Isle party invitation (a tease for world 7, no twist yet). Each plays once; Esc skips.
- Progress is saved per browser (`cleared` + best scores). A best score from before Milestone 6 counts as cleared.
- The maps: Outback: Tournament Trail, Emu Crossing, Red Rock Run, The Warren (boss: Warren Warlord). Rainforest: Canopy Creek, Vine Valley, Big Tom's Den (boss: Big Tom). Cane Fields & Coast: Sugar Cane Scramble, Irrigation Ditch, Mangrove Mud, Toad King's Beach (boss: Cane Toad King).
- New pest: the cane toad (slow high hops, poison contact without a knockdown, a little poison puff when knocked out; Dead Fred is immune).
- Bosses: the Warren Warlord (leaps, thumps for rabbits, dashes, burrows under you), Big Tom (pounces, claw swipes, yowls for cats, hides in the shadows with only his eyes showing), the Cane Toad King (hop slams, a long tongue lash, poison puffs, toadlets). Big Buck stays as the first map's mini-boss.
- Hazards and allies (`js/entities/hazards.js`): emu stampedes, cassowaries (can't be hit; keep your distance), crocodiles in the water (eyes that follow you; they snap at swimmers but never bother the pests), Smile Squad quokkas (hearts, supply drops, tips; some arrive "just too late"), Matschie's tree-kangaroo (throws fruit at pests from a branch), and a northern quoll (bites pests, runs from cane toads).
- Water zones: slow and floaty; JUMP swims up; Paddles is fastest.
- Clues: shed snake skins and scaly footprints near the pests, GRIN ISLE crates, the croc that ignores pests, a quokka chatting with a goanna that freezes when the camera looks at them, a quokka saying crocs "never bother us quokkas", and late quokkas.

### As built in Milestone 7 (13-14 Nov 2026)

- **Maps** (15 new, 26 in all): Tasmania & the Alps: Snow Gum Slopes, Alpine Hut Hideout, Wild South Coast (boss: the quoll champion). The City: Harbour Laneways, Rooftop Rumble, Bridge Brawl, Fox Gang HQ (boss: Foxy Roxy). Time Rift (bonus): Giant Fern Gorge (Diprotodon), Volcano Valley (the marsupial lion), The Age of Giants (Procoptodon; unlocks Ghost). Grin Isle: The Victory Party, Souvenir Street, The Evil Lighthouse (the Grand Grinner), The Reptilians' Lair (the Croc Emperor). Secret: The Isle of Man (Benny's bonus map).
- **Branches:** clearing the City opens both the Time Rift and Grin Isle (`after` in a map). The Isle of Man stop appears once Benny walks the world map (`secret: 'isleofman'`).
- **New pests:** red foxes (City; never in Tasmania), hypnotised pademelons (thump to call one more), reptiles: perentie (charges), lace monitor (waits up a tree, drops on you), inland taipan (darts in, strikes; venom), death adder (lies still with a wriggling tail lure, strikes close up; venom), frilled lizard (sprints, frill up blocks hits from the front; big hits and hits from behind get through), thorny devil (punching it hurts; kick it or use weapons), saltwater crocodile on land (charges), and quokka minions with the **Hypnotic Grin** (face it for about a second and you're dizzy: slow and unable to attack; turn away or block).
- **Native animals** (pademelons, reptiles, quokkas, the quoll champion, the extinct giants) never bleed: knocked out, they snap out of it and run off. Pests (rabbits, cats, pigs, foxes, toads) keep the cartoon blood.
- **Bosses:** the quoll champion (pounce, dash, swipes; joins you afterwards in the story), Foxy Roxy (dash, calls the fox gang, pounce, throws wheelie bins), Diprotodon (dash, ground stomp, leap), the marsupial lion (pounce, guard-breaking bite, hides with glowing eyes), Procoptodon (leaps and huge kicks), the Grand Grinner (three phases: selfie flashes and quokka minions from his plushie throne; then echoes of the Warren Warlord, Big Tom and the Cane Toad King for a few seconds; then he drops the smile and fights), the Croc Emperor (chomp, death roll across the arena, tail sweep, calls reptiles).
- **CPU champions** (`allies` in a map, `js/entities/allies.js`) fight beside the players on Grin Isle: 2-4 per map, back 6 seconds after a knockout, and they can't lose the map for you.
- **Story:** world intros for Tasmania, the City and the Time Rift; the quoll champion's "a smiley quokka told me"; Ghost's unlock; **the betrayal** (before the first Grin Isle map: the victory party, "It's a trap!", Operation Marsupial World Conquest, joining forces); the lair; and the ending (the reptiles go back to sunbaking, the quokkas are banned this year but allowed back if they behave, the platypus finally gets to watch, THE END).
- **Secrets:** Ghost the thylacine (Fast; wide-jaw bite breaks blocks; Phase trait: a hit passes through him every 5 s; special Phantom Dash) unlocks by clearing the Time Rift. Cousin Cuscus (Power; slaps; Take It Easy trait: stand still a second for a SUPER SLAP; special Slap Storm) unlocks by finding the sloth who fell through the rift from Sloth Slap, or automatically if Sloth Slap has saved anything in the same browser (same website, e.g. both on GitHub Pages).
- **Allies and guests:** a mountain pygmy possum guide in the Alps (a fact and a heart), wild red-necked wallabies on the Isle of Man.

### The Top End (the owner, 14 Nov 2026)

The owner asked for a map at Darwin where the good marsupials fight saltwater crocodiles.
- **Darwin Harbour** (map 27, `darwin-1`, the bonus world THE TOP END) opens after Big Tom's Den, on its own branch along the north coast (the arrow keys walk to it straight after the Rainforest). A wharf, croc warning signs, pandanus, magnetic termite mounds, mangroves and two stretches of harbour water with crocs lurking; salties charging on the mud with feral pigs and cats; a Smile Squad quokka who says the salties "never bother us quokkas" (a clue). Theme `topend` (`js/art/topend.js`).
- **Boss: Old Snapjaw**, a huge old saltie in a tour-boat captain's cap: chomp, tail sweep, death roll and a **croc jump** (real salties push themselves up out of the water with their tails). A native: beaten, he swims off in a huff.
- **Story:** a panel before the first visit (the salties have gone grumpy and teamed up with the pigs and cats; a real fact about where salties live).

## The signature mechanic: the pouch (details agreed with the owner, 13 Nov 2026)

Every playable marsupial has a **joey** (a baby of its own kind) and a **pouch slot** for one saved item.

**Who carries the joey where** (the owner: go by the names; only females have a pouch):
| In a pouch (mums) | On the back (boys, and the numbat) |
|---|---|
| Tank (wombat: the pouch faces backwards), Chompers (devil: backwards too), Zip (sugar glider), Paddles (water opossum: a watertight pouch), Bins (brushtail possum) | Boomer, Stinker, Benny, Earl, Dead Fred, Drowsy (koala males are the ones that bellow), and Stripes (numbats have no pouch at all, so their young really do ride on the mother's back) |

**The joey helps by itself** (no button needed):
- When a pest is close, it hops out, nips it and hops back.
- It fetches pickups that are nearby and brings them over.
- **Once per map, a rescue:** when you're knocked out, your joey gets you back up with some health ("JOEY TO THE RESCUE!").

**The JOEY button** sends it out for a bigger hit (a "Joey Rush" at the nearest pest). Its own helping and the button share one cooldown, shown as a little joey icon with a ring on the HUD.

**The joey grows:** every map a character clears makes that character's joey a level stronger (more damage, a little bigger), up to level 5, saved in the browser.

**The pouch saves an item by itself when you don't need it right now:** a heart picked up at full health, or a power-up grabbed while another power-up is still running, goes into the pouch (one item). The **POUCH button** uses it later. With the pouch full, pickups work straight away as before. Grenades and weapons are never stored (they're carried anyway).

**Duels stay fair:** everyone's joey is level 1 and the pouch starts empty (supply drops can fill it). Joeys nip and fetch in duels, but there is no rescue.

**Controls** (added everywhere: key strip, Pause > Controls, touch buttons):
| | Player 1 | Player 2 | Gamepad | Phones |
|---|---|---|---|---|
| JOEY | Q | [ | Back / View | JOEY button |
| POUCH | T | ] | RT (shoot stays on RB) | POUCH button (shows the saved item) |

**Wi-Fi:** the joey and the pouch are in the snapshots, and the JOEY and POUCH presses are sent like any other button.

## Weapons, shop and upgrades (the owner's choices, 13 Nov 2026)

Fighting uses all of these:
1. **Each marsupial's own attacks:** basic, big, special and trait (`ROSTER.md`).
2. **Weapons:** a mix of real-style weapons with funny marsupial twists, plus themed specials. Example names: a gumnut gatling, a drop-bear launcher, a eucalyptus-oil flamethrower. Drawn in the game's cartoon style.
3. **Throwing weapons,** such as a grenade: **pull the pin, drop it, and kick it** toward the target. Every character can kick one, and the kangaroo family kicks furthest.
4. **Weapon upgrades and special weapons.**
5. **Building up health and armor:** an armor bar that takes the hits before health does, plus health upgrades.

**Getting them:** enemies and crates drop **coins**, which you spend at the **platypus's shop** between levels. It can't enter the tournament, so it sells to the animals who can. Weapons, health and armor pickups also turn up during maps. In Wi-Fi co-op everyone has their own coins and shops together, as in Zombie Survival. Duels ignore all of this: they're fair fights.

The owner's zombie survival game already has weapons, grenades, armor, coins and a shop: see `TECH_PLAN.md`.

### As built in Milestone 5 (13 Nov 2026)

Details below were chosen in the build to fit a brawler; the owner can change any of them.
- **One weapon at a time** on SHOOT (no extra switch button: there are already 11 buttons). You pick it in the shop. Bought weapons **refill by themselves** (a full load over a few seconds once you stop shooting), so shooting helps but the marsupials' own moves stay the main way to fight.
- **The 7 weapons** (`js/data/weapons.js`): Shanghai Slingshot 40, Snag Shooter 80, Gumnut Gatling 140, Cricket-Ball Bowler 200 (goes through 3 pests), Eucalyptus Flamethrower 300 (short range, hits crowds), and the two special weapons: Drop-Bear Launcher 420 (lands and mauls an area) and Magpie Swooper 600 (homes in on pests). **Upgrades:** levels 2 and 3 (half the price, then the full price again) for more damage and more shots; level 3 also refills faster.
- **Weapons found in maps** are borrowed: limited shots, no refill, then your own weapon comes back. The Tournament Trail has a Snag Shooter early on and the Gumnut Gatling up on the high stand.
- **Armor:** Bark Vest 60 (25 armor), Billycan Plating 180 (60), Corrugated-Iron Suit 380 (110). A blue bar under health that takes hits first (not poison), repaired every map and checkpoint, and a plate drawn on the fighter's chest. Bark patches in maps and duels: +20 (up to at least 30).
- **Upgrades for good:** Bigger Heart (+20 health per level, 100/220/400) and Grenade Belt (+1 starting grenade per level, 70/150).
- **Coins:** rabbit 2, cat 5, pig 8, Big Buck 40, crate 3-5, plus coins lying on platforms. They fly to whoever knocked the pest out (Zombie Survival's black-hole swirl), or to anyone close by. A full run of the first map earns about 130.
- **Wallets:** per player, not per character: `p1` (this device's player, also on Wi-Fi) and `p2` (the second player on this keyboard). Saved in the browser.
- **The shop:** SHOP on the title screen, and **Shop** after a map (win, or knocked out). 2 players on one keyboard shop on one screen with their own cursors. **Wi-Fi: Shop Together** after a map: everyone shops on their own device with their own coins, sees everybody's wallets and presses I'M READY; the host presses START. Friends' gear goes to the host with their character pick, and the coins they pick up in the host's game are added to their own wallet.
- **Duels:** shop gear is ignored. Supply drops now also bring a weapon to borrow (any of the 7) or armor.

### More items, sections and selling back (the owner, 14 Nov 2026)

The owner asked for the shop to be easier to find, sorted by kind with explanations, for selling back, and for more items.
- **Sections (tabs):** WEAPONS, ARMOUR, HEALTH, GRENADES, EXTRAS (`MG.SHOP_CATS`; each item has a `cat`). Each section has a line saying what that kind of gear is for (with the player's own keys), and the cards of the smaller sections show each item's explanation. Keyboard: up from the top row reaches the tabs; left/right at the end of a section goes into the next one. Taps work on tabs, cards and buttons.
- **New items:** Thong Flinger 110 (three flip-flops in a spread), Full-Blast Garden Hose 250 (low damage, big push back), Roo-Bar Armour 650 (170), Gum-Leaf Tonic 120/260 (heals 1.5 or 3 health a second after 4 s without being hurt), Bigger Bang 90/200 (grenade blasts 25% bigger per level, pushing further), Joey Snacks 80/180 (the joey's waits 20% shorter per level), Coin Magnet 120 (lying coins come from 2.2x as far). 19 items in all. Upgrades carry a short `key` in the loadout (hp, rg, gb, bb, js, mg), so Wi-Fi friends' upgrades reach the host (checked by `MG.Gear.clean`).
- **Selling back** for half of what was paid (`MG.SELL_BACK`): a weapon with all its levels, an armour set, or one level of an upgrade. The first press of SELL asks "SURE?", the second sells. A sold weapon or armour comes off.
- **Easier to find:** a big SHOP button on the world map (top right, with your coins and a "!" when there's something new you can afford; B or the gamepad's Y opens it) that brings you back to the same stop; the shop stop stays on the map. After every map the Shop line comes second, coloured, with your coins (also after a knock-out: "Shop, then try again"). The shop after a map has PLAY (the next map, or this one again) and WORLD MAP (back to that map's stop); after a bonus map, whose next map isn't on the same path, it leads back to the map.
- **More coins later on:** pests not in `MG.COINS` pay by toughness (score / 60, a saltie 10) and world bosses drop a pile (score / 150, up to 100).

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
