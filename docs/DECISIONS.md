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

## Open questions for the owner

1. **Price:** free on GitHub for sure; an itch.io page (free or pay what you want) is optional. Needed before release.
2. **Names to confirm:** the Croc Emperor, the Smile Squad, Grin Isle Holidays, the weapons, and the boss names in `VILLAINS.md`. All are placeholders.
3. **Trade mark:** registering Marsupial Mayhem is the owner's own step, ideally before release. A trade mark lawyer can advise.
4. ~~The pouch for male characters~~: answered 13 Nov 2026, their joeys ride on their back.
5. **Names from Milestone 1 (placeholders):** the mini-boss Big Buck, the Gumnut Gatling, and the power-ups Gumleaf Shield, Billy Tea Rush and Super Wallop.
6. **Milestone 5 choices** (above): weapon names and prices, and one weapon at a time. (Selling back was added on 14 Nov 2026.)
