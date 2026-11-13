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

## Open questions for the owner

1. **Price:** free on GitHub for sure; an itch.io page (free or pay what you want) is optional. Needed before release.
2. **Names to confirm:** the Croc Emperor, the Smile Squad, Grin Isle Holidays, the weapons, and the boss names in `VILLAINS.md`. All are placeholders.
3. **Trade mark:** registering Marsupial Mayhem is the owner's own step, ideally before release. A trade mark lawyer can advise.
