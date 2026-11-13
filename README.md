# Marsupial Mayhem™

## ▶ [Play it now in your browser](https://marknakasone85.github.io/marsupial-mayhem/)

A comical cartoon brawler starring marsupials. Kangaroos, wombats, koalas, possums and friends battle it out in the Great Pouch Tournament, until uninvited pests crash the party.

**Early days:** the first map is playable. Boomer the red kangaroo boxes, tail-kicks and grenade-punts his way along the Tournament Trail, past rabbits, feral cats and feral pigs, to a showdown with Big Buck. Press PLAY on the title screen, or 2 PLAYERS for two on one keyboard. More marsupials and maps are on the way.

## Play it

- **Online:** https://marknakasone85.github.io/marsupial-mayhem/ (on phones and tablets too).
- **On this computer:** double-click `index.html`. It works offline.
- **With family on home Wi-Fi:** see below.

## Playing together on home Wi-Fi

2 to 4 players, each on their own computer, phone or tablet, all on the same home Wi-Fi.

1. On the computer with the game folder, double-click `share-on-network.command`. A window opens and shows the address for everyone else, like `http://<wifi-network-address>:8020`.
   - The first time, macOS may ask whether Python can accept incoming network connections. Click **Allow**, or nobody else can connect.
2. **The host** (on that same computer) opens `http://localhost:8020`, chooses **WI-FI**, then **HOST A GAME**. The screen shows a 4-digit **join code**.
3. **Everyone else** opens the address from the window, chooses **WI-FI**, then **JOIN A GAME**, types the code and presses **I'm ready!**
   - **Phones:** hold them sideways. Use Safari on an iPhone (Chrome on an iPhone first needs "Local Network" allowed in the iPhone's Settings).
4. The host presses **START**. Friends can also join a game that has already started: they drop in next to the team.

Good to know:
- If a phone loses the Wi-Fi for a moment, it rejoins by itself as the same player.
- Only one window can host. Hosting in a second window stops the first one (it says so).
- The host's pause menu has **Back to Lobby** (same code, same players) and **End Wi-Fi Game**.
- Only the game files are shared, read-only, and sharing switches itself off after 3 hours. Use it only on your own home Wi-Fi, not on public Wi-Fi.
- The online page has no WI-FI button: Wi-Fi games need the game folder and `share-on-network.command`.

## Controls

| | Player 1 | Player 2 | Gamepad |
|---|---|---|---|
| Move | A / D | ← / → | D-pad / stick |
| Jump | W | ↑ | A |
| Block (hold) | S | ↓ | Down / LB |
| Attack | F | , (comma) | X |
| Big attack | G | . (period) | Y |
| Special | H | / (slash) | B |
| Shoot (hold) | R | ; (semicolon) | RB / RT |
| Grenade | E | ' (quote) | LT |
| Pause | Esc / P | Esc / P | Start |

Playing alone? Arrows with J (attack), K (big), L (special), ; (shoot) and ' (grenade) work too. On phones and tablets, touch buttons appear during play (BOOM is the grenade). The title screen's CONTROLS button and the pause menu show this table too.

**Tips:** press attack three times for a jab-jab-hook. Hold block when something charges at you, and Boomer's Tail Counter kicks back by himself. The grenade is the fun part: press the grenade key to pull the pin and drop it, then kick it with attack (short), big attack (a long lob) or the grenade key again. The special needs a full blue bar. Watch out: rabbits eat any power-up they reach first!

## Privacy

The game collects no personal information. It has no accounts, ads, analytics or tracking, and it loads nothing from other websites.
- Settings and progress are saved only in your own web browser (local storage) and never leave your device.
- Wi-Fi games stay on your home network. Button presses and game updates go between the players' devices through the host computer, are kept in memory only, and are gone when sharing stops.
- The online version is hosted by GitHub Pages. Like any website host, GitHub sees ordinary visit information (such as IP addresses); see GitHub's privacy statement. The game itself adds nothing to that.

## Content

Cartoon action: kicks, bites, bonks, silly sound effects and cartoon weapons. **Cartoon blood is on by default.** For younger players, **BLOOD: OFF** on the title screen turns it into confetti.

The animals are real species drawn as cartoons, and the animal facts in the game are true. All characters, places and stories are made up. The game is not affiliated with or endorsed by any company, show, game, government or wildlife organisation.

## For developers

Plain HTML5 canvas and JavaScript with no build step and no dependencies: every picture and sound is made in code. The plan is in `docs/` (start with `docs/README.md`; it has story spoilers). Run the tests with `tools/run-tests.sh` (macOS).

## Trademark and copyright

Marsupial Mayhem™ is a trademark of Mark A. Nakasone.

Copyright © 2026 Mark A. Nakasone. All rights reserved. The code is public so people can see how the game is made and play it, but it is not open source: please don't copy, publish or sell the game, its characters or its artwork without permission.
