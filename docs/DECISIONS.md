# Decisions and open questions

## Decided by the owner (12–13 Nov 2026)

- **A marsupial game** in the style of *The Sloth Slap Game*, but better and a bit bigger.
- **Premise:** marsupials fighting for supremacy, and they also fight other things, not just each other.
- **Roster:** 12 playable characters and 2 secret ones.
- **The 12:** red kangaroo, western grey kangaroo, red-necked wallaby, common wombat, koala, common brushtail possum, sugar glider, Tasmanian devil, numbat, greater bilby, Virginia opossum, water opossum. The owner picked the three kangaroo-family characters and the quokka. The rest were proposed to cut down on kangaroos and accepted into the planning sheet.
- **Secret:** thylacine and spotted cuscus.
- **The twist:** quokkas live on an island and look happy, but they're evil, the secret main villains. (Extended on 13 Nov: see the story below.)
- **Builds:** each character is Fast, Power or Balanced, 4 of each.

## Answered by the owner later on 13 Nov 2026

- **Name: Marsupial Mayhem™.** The owner wanted "Marsupial" in the name, something funny or satirical, and a name that can be registered as a trade mark later. Mark it ™ on the title screen, page title and README now. Use ® only once a registration has actually been granted. A web search on 13 Nov 2026 found no game with this exact name, but that isn't a trade mark search: the owner checks with the trade mark office (the USPTO in the US) before registering. The owner's other favourite, "Marsupial World Conquest", can be the name of the villains' plan.
- **Story:** the marsupials play levels across a **Marsupial World map**. The story, and the reason they're fighting, develops as they go, with a twist: the **quokkas appear as allies**, and not until the late levels do they reveal themselves as **evil traitors in a dark alliance with the reptilians**. The good marsupials join forces to defeat them and save Marsupial World. Details are in `DESIGN.md` and `VILLAINS.md`.
- **The pouch: both** the joey sidekick and the stored item.
- **Male characters carry their joey on their back** (the owner, 13 Nov 2026), as numbat joeys really do. Only females have a pouch.
- **Pouch details** (the owner, 13 Nov 2026): the joey helps **both** by itself and on a JOEY button; the pouch saves an item **by itself when it isn't needed** (POUCH button uses it); boys and mums **go by the names**; the joey **grows each map**. Full design in `DESIGN.md`.
- **Weapons: all of these.**
  1. Each marsupial's own attacks (`ROSTER.md`).
  2. Various weapons: **a mix** of real-style weapons with funny marsupial twists, plus themed specials. Example names: gumnut gatling, drop-bear launcher, eucalyptus-oil flamethrower.
  3. Throwing weapons, such as a grenade: **pull the pin, drop it, and kick it** toward the target.
  4. A weapon upgrade system and special weapons.
  5. Building up health and armor.
- **Getting them: shop and pickups.** Coins from enemies and crates, spent at the platypus's shop between levels, plus weapon, health and armor pickups found during maps.
- **Duels are fair fights.** Everyone starts equal, and weapons and armor come only from pickups on the duel stage. Campaign upgrades don't count.
- **Blood is on by default.** A Settings switch turns it off when younger kids play, and a gore mode is fine too.
- **Nicknames:** keep all 14 (Boomer, Stinker, Tank, Chompers, Zip, Stripes, Earl, Paddles, Benny, Drowsy, Bins, Dead Fred, Ghost, Cousin Cuscus).
- **Online play:** home Wi-Fi only. No online server.
- **How it's played:** pushed to GitHub and played from its public web page (GitHub Pages), and launched from the project folder for multiplayer on the home network.
- **Price:** decide before release. Because it will be public on GitHub, it's free to play there, so selling it is unlikely to make sense. A pay-what-you-want itch.io page could still work as a tip jar.

## Carried over from the owner's other games (treat as decided)

- Plain HTML5 canvas and JavaScript, with no build and no dependencies. All art and sound made in code.
- Easy to deploy: double-click, GitHub Pages, itch.io, and home Wi-Fi for 2–4 players.
- **All rights reserved** (like Sloth Slap and Survive Bob), not open source.
- Saves stay in the browser. No accounts, ads, analytics or tracking.

## Proposed in planning (accepted unless the owner says otherwise)

- **Story structure:** the Great Pouch Tournament, "proudly sponsored by Grin Isle Holidays", is crashed by invasive pests. The quokkas' Smile Squad helps the champions across Marsupial World. On Grin Isle the quokkas betray them and the reptilians come out of hiding (see `DESIGN.md`).
- **Marsupial World** is a made-up cartoon continent based on Australia's regions, with Grin Isle off the coast.
- **7 worlds, about 25 maps** (see `DESIGN.md`). Grin Isle gets a 4th map: the reptilians' lair under the island.
- **The reptilians** are real Australian reptiles drawn as cartoon villains: crocodiles, goannas, snakes and lizards. Their leader is a giant saltwater crocodile, **the Croc Emperor**. In the last maps, CPU marsupial champions fight beside the players.
- **Grenade kick:** every character pulls the pin, drops it and kicks it. The kangaroo family kicks furthest.
- **Wi-Fi co-op shop:** everyone has their own coins and shops together, as in Zombie Survival.
- **Home Wi-Fi play comes early** (Milestone 2, right after the vertical slice), not at the end. Every later feature is then built and tested to work on Wi-Fi, which is much easier than adding Wi-Fi to a finished game.
- **GitHub repo name:** `marsupial-mayhem`.
- Villains' island named **Grin Isle** (not Rottnest). A generic red rock, not Uluru. The dingo stays neutral.
- Tournament Duel versus mode alongside the campaign.
- Start from Sloth Slap's engine. Weapons, grenades, armor and the shop follow Zombie Survival. Both are the owner's own code.

## Chosen while building Milestone 5 (13 Nov 2026; the owner can change any of these)

- **Weapon names and prices** (placeholders): Shanghai Slingshot, Snag Shooter, Gumnut Gatling, Cricket-Ball Bowler, Eucalyptus Flamethrower, Drop-Bear Launcher, Magpie Swooper; Bark Vest, Billycan Plating, Corrugated-Iron Suit; Bigger Heart, Grenade Belt. Prices are in `js/data/weapons.js`.
- **One weapon carried at a time**, chosen in the shop, refilling by itself. No weapon-switch button.
- **Coins and gear belong to the player, not the character**, and are kept between games (as in Zombie Survival). No selling back yet.
- **No boomerang weapon:** boomerangs are Aboriginal tools, so it's left out to stay well clear of the guardrail about Aboriginal culture.

## Chosen while building Milestone 6 (13 Nov 2026; the owner can change any of these)

- **Map names** (placeholders): Emu Crossing, Red Rock Run, The Warren, Canopy Creek, Vine Valley, Big Tom's Den, Sugar Cane Scramble, Irrigation Ditch, Mangrove Mud, Toad King's Beach.
- **Player 1's keys:** the grenade moved to G and the big attack to E (the owner asked for the grenade on G, 13 Nov 2026).
- **Wi-Fi co-op:** the lobby still picks the first map (only maps this computer has opened); after that the host can take everyone to the shared world map.
- **Story panels play once** each and can be skipped with Esc.

## Chosen while building Milestone 7 (14 Nov 2026; the owner can change any of these)

- **Map names** (placeholders) for worlds 4-7 and the Isle of Man: see `DESIGN.md`.
- **Native animals don't bleed:** tricked or hypnotised natives (pademelons, reptiles, quokkas, the quoll, the extinct giants) snap out of it and run off, which keeps the story pro-wildlife. Invasive pests keep the cartoon blood.
- **The Time Rift and Grin Isle both open after the City**, so the bonus world can be skipped.
- **The Sloth Slap crossover:** a sloth cameo in the Time Rift unlocks Cousin Cuscus, and so do Sloth Slap saves in the same browser (only possible when both games are on the same website, like GitHub Pages). Nothing is sent anywhere.
- **Benny's secret:** the Isle of Man stop appears once Benny walks the world map.
- **The owner said to keep saving and pushing without asking** while away (14 Nov 2026), and to check the full build afterwards.

## Chosen while building Milestone 8 (14 Nov 2026; the owner can change any of these)

- **Settings** replaced the title screen's BLOOD and SOUND buttons (the pause menus still have Blood and Sound). Blood cycles ON, GORE (2.2x the cartoon splatter, bigger splats), OFF (confetti).
- **Difficulty** affects only the adventure: EASY pests hit 0.65x and have 0.8x health; HARD 1.35x and 1.3x. Duels stay fair.
- **Changing keys:** one keyboard key per action per player; taking a key another action uses swaps the two; gamepads and touch buttons stay as they are; Esc can't be used. Solo play's extra J, K and L keys stay.
- **Accessibility:** bigger touch buttons (1.2x) and high contrast (solid dark panels with white borders, and a coloured ring under every pest and player).
- **The level editor** is a developer tool in `tools/` (not part of the game page, and never served on the home network).
- **itch.io:** `tools/make-itch-zip.sh` makes the zip; uploading it and the price are the owner's decisions.

## Chosen while adding the Top End and the bigger shop (14 Nov 2026; the owner can change any of these)

- **Where the Darwin map sits:** a bonus branch after the Rainforest (Big Tom's Den), so it can be played early and its path runs along the north coast. It doesn't block the main path.
- **The boss's name:** Old Snapjaw (a placeholder, like the other boss names).
- **Shop sections:** WEAPONS, ARMOUR, HEALTH, GRENADES, EXTRAS. Selling back gives half of what was paid, and asks "SURE?" first.
- **The new items and prices** (Thong Flinger, Full-Blast Garden Hose, Roo-Bar Armour, Gum-Leaf Tonic, Bigger Bang, Joey Snacks, Coin Magnet) are placeholders too.
- **The map's SHOP button** sits top right, over the sea, so it never covers a stop.

- **The twist is now shown to the players early** (the owner asked for the alliance to be clearer): "meanwhile" cutscenes after each world. The heroes still only find out at the victory party, so the betrayal stays a surprise for them (the players are in on it, like in a cartoon).

## Chosen in the graphics pass (14 Nov 2026; the owner can change any of these)

- **Polish, not a new style:** the cartoon look stays; light, haze and colour are laid over it. Changing the style would mean redrawing every character and world.
- **The title screen's line-up:** Boomer and the power characters at the front left, Benny, Drowsy and Bins at the front right, the fast ones at the back. The quokka on the mesa grins for about 2 seconds in every 11 (a hint, not a spoiler: the Smile Squad are friends at the start).
- **Light and haze is on by default**, with a Settings switch, and switches itself off on slow devices unless the player chose ON.
- **Livelier movement** has no switch: it's subtle (at most a quarter squash), costs almost nothing, and works the same for Wi-Fi friends (the host sends the squash amount and the falling speed).
- **Pests and ground (15 Nov 2026):** pests squash and stretch like the heroes (a bit less wobble for bosses when hit), with no switch either. The ground detail adds to each world's own ground rather than replacing it, most in the Outback and least where there was already a lot; it's always on (about 10 batched fills a frame), so it isn't part of the "Light and haze" switch.

## Chosen after a player's feedback (15 Nov 2026; the owner asked for both)

- **Every marsupial punches and kicks:** the attack is a punch and the big attack a kick, for all 14 (the secret ones too). Each keeps its own numbers, so Chompers' kick still breaks blocks and Tank's still shoves hardest. Zip's kick still spins and Benny's still lands twice. The specials keep their bites, chomps and slaps. On screen the keys are now called "punch" and "kick" (the Controls page, the key strip, Settings > keys, the touch buttons PUNCH and KICK). Inside the code the actions keep their old names (`attack`, `big`), so saved keys keep working.
- **Punches and kicks feel different:** a punch lands with a quick white star, streaks the way the target flies, words like POW! and BIFF!, a crisp snap (a little higher or lower each time) and the shortest pause. The combo's third punch (the hook) gets a bigger star, its own words and a fuller smack. A kick lands with a golden burst and a shock arc, dust from the planted foot, words like THWACK! and BOOT!, a deep thud and a slightly longer pause (0.1 s). Specials keep their own look. Wi-Fi friends see and hear all of it.
- **Hints use the player's own keys:** the first map's tip said "Press G", which was wrong for anyone who changed the key or used a gamepad. Tips now name keys as `{grenade}` and show the key chosen in Settings, LT on a gamepad, or the solo arrow-key set.
- **A practice corner for new players:** on the first map, a straw-stuffed training dummy stands just past the TOURNAMENT sign and a coach board walks through punch (3 times), kick, jump, block and the grenade, showing each move's key (the button on a touch screen, both players' keys with two on one keyboard). The first rabbits wait until it's done; walking on past the dummy skips it. It shows only when the map is started from the world map (or restarted), never on Wi-Fi, and stops once it's been done or skipped, or the first map has been cleared. Punching the dummy scores nothing. Afterwards the dummy stays as scenery.
- **Every key's job clearly labelled on a computer (the owner, 15 Nov 2026):** the key strip is now a solid band along the bottom with bigger keys and what each one does written underneath, in groups (move, jump, block | punch, kick, special | shoot, grenade, joey, pouch | pause). It shrinks to fit if long key names are chosen in Settings. On a computer it can't be switched off: Pause > On-screen controls swaps between the key hints and the clickable buttons, and Settings shows "Key hints at the bottom: ALWAYS ON". Phones and tablets keep their switch (they have touch buttons).
- **The screens around the game get the same labelled key bar:** the world map (a box at the bottom left; the stop's panel moved up above it), the shop, character select (one or two players, with the real keys: P1 changes with E, which the old hint called G), the story panels, Settings and its keys page, the pause menu, Stage Clear and Knocked Out, the Tournament Duel menus, and Wi-Fi friends' menus. A gamepad shows its buttons; phones and tablets keep their tap hints. The title screen keeps its line-up (the cast stands along the bottom edge).
- **A sticker book (title screen > STICKER BOOK):** 27 stickers saved in this browser (no server): every world cleared (9, the last two secret), the practice corner, a punch-punch-hook combo, 10 hits in a row, a pest knocked out by a kicked grenade, a special, a Joey Rush, the pouch, a map with no knockouts, a level-5 joey, a first purchase, a level-3 weapon, 6 and 12 marsupials that have cleared maps ("a group of kangaroos is called a mob"), a map with a friend, a duel win, beating the LEGEND CPU, and the two secret marsupials. Only the people on this computer earn them, never the CPU, CPU champions or Wi-Fi friends' fighters on the host; a Wi-Fi friend gets "Mates" on their own device. A pop-up shows each new one; the title screen also checks the saves, so worlds cleared before the book existed count (one pop-up for all of them). Secret stickers show ??? until earned.
- **All the controls at the bottom:** the joey's level and the pouch's saved item moved from the top-left panel into the key strip at the bottom. The panel is shorter whenever the strip or the touch buttons show them; with the on-screen controls off, they stay in the panel. On a computer (anything with a mouse or trackpad), the touch buttons sit in one row along the bottom, moving on the left and PUNCH at the right-hand end, and a mouse click presses them. Phones and tablets keep the thumb layout.

## Chosen for older phones (15 Nov 2026; the owner asked for "smoother on older phones")

- **Still layers are drawn once and copied, with no switch:** skies, seas, mist, soil and the light's still layers (glow, colour grade, canopy shade, lava glow, vignette) become pictures at the screen's real size. It looks the same (checked pixel by pixel) and roughly halves the time a frame takes without a graphics chip. Moving parts stay live, so nothing in the worlds changed.
- **The light and haze stays on by default.** With its still layers copied, it now costs about 1.3-2 ms a frame without a graphics chip (it was 4-5 ms), so the slow-device switch-off should trip much less often.
- **Memory is capped** at 16 pictures (a world needs up to 8) and about 80 MB, and only the part of each picture that's on screen is kept.

## Open questions for the owner

1. **Price:** free on GitHub for sure; an itch.io page (free or pay what you want) is optional. Needed before release.
2. **Names to confirm:** the Croc Emperor, the Smile Squad, Grin Isle Holidays, the weapons, and the boss names in `VILLAINS.md`. All are placeholders.
3. **Trade mark:** registering Marsupial Mayhem is the owner's own step, ideally before release. A trade mark lawyer can advise.
4. ~~The pouch for male characters~~: answered 13 Nov 2026, their joeys ride on their back.
5. **Names from Milestone 1 (placeholders):** the mini-boss Big Buck, the Gumnut Gatling, and the power-ups Gumleaf Shield, Billy Tea Rush and Super Wallop.
6. **Milestone 5 choices** (above): weapon names and prices, and one weapon at a time. (Selling back was added on 14 Nov 2026.)
