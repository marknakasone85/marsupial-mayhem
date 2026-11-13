// Campaign maps. Never delete or replace a map: new ones are appended.
// Each map: world, name, theme, music, length, platforms, grass (cat hiding spots), enemies, crates,
// pickups, gates (checkpoints that open once every pest before them is gone), boss, decor,
// coins (lying around: { x, y, v }; y is the coin's middle, v 1 or 5).
// Hearts after each gate and before the boss, and two power-ups, are placed automatically.
// A map's length must be at least boss.x + 580 (the boss arena starts at boss.x - 380).
MG.LEVELS = [
  {
    id: 'outback-1', world: 'THE OUTBACK', name: 'TOURNAMENT TRAIL', theme: 'outback', music: 'outback',
    tip: 'Clear the pests to open each gate.  Press E to drop a grenade, then KICK it!',
    tipTouch: 'Clear the pests to open each gate.  Tap BOOM to drop a grenade, then HIT to kick it!',
    length: 4800,
    platforms: [
      { x: 1000, y: 362, w: 180 },
      { x: 2240, y: 352, w: 170 },
      { x: 2470, y: 262, w: 160 },
      { x: 2700, y: 362, w: 160 },
    ],
    grass: [{ x: 1330, w: 280 }, { x: 2600, w: 230 }, { x: 3560, w: 180 }],
    enemies: [
      // zone 1: the start of the tournament trail
      { type: 'rabbit', x: 640 }, { type: 'rabbit', x: 690 }, { type: 'rabbit', x: 740 },
      { type: 'rabbit', x: 1150 }, { type: 'rabbit', x: 1200 },
      { type: 'cat', x: 1470 },
      { type: 'pig', x: 1740 },
      // zone 2: the tank stands
      { type: 'rabbit', x: 2120 }, { type: 'rabbit', x: 2170 }, { type: 'rabbit', x: 2220 },
      { type: 'cat', x: 2700 },
      { type: 'rabbit', x: 2900 }, { type: 'rabbit', x: 2950 }, { type: 'rabbit', x: 3000 }, { type: 'rabbit', x: 3050 },
      { type: 'pig', x: 3180 },
      // zone 3: the way to the arena
      { type: 'rabbit', x: 3460 }, { type: 'rabbit', x: 3510 },
      { type: 'cat', x: 3650 },
    ],
    crates: [
      { x: 880, loot: 'grenades', label: 'THIS WAY UP' },
      { x: 1640, loot: 'gumnuts' },
      { x: 2360, loot: 'grenades', label: 'GRIN ISLE' },
      { x: 3250, loot: 'heart' },
      { x: 3780, loot: 'grenades' },
      { x: 2050, loot: 'armor' },
    ],
    pickups: [{ type: 'gatling', x: 2550, y: 262 }, { type: 'w:snag', x: 1120, y: 362 }],
    coins: [
      { x: 1030, y: 340 }, { x: 1060, y: 340 }, { x: 2290, y: 330 }, { x: 2320, y: 330 }, { x: 2350, y: 330 },
      { x: 2520, y: 236, v: 5 }, { x: 2760, y: 340 }, { x: 2790, y: 340 }, { x: 3960, y: 440 }, { x: 3990, y: 440 },
    ],
    gates: [{ x: 1900 }, { x: 3330 }],
    boss: { type: 'bigBuck', x: 4200 },
    decor: [
      { type: 'sign', x: 330, text: 'TOURNAMENT  →' },
      { type: 'mound', x: 520, h: 70 }, { type: 'mound', x: 1280, h: 100 }, { type: 'mound', x: 2080, h: 80 },
      { type: 'mound', x: 2960, h: 120 }, { type: 'mound', x: 3900, h: 90 },
      { type: 'sign', x: 3740, text: 'ARENA  →' },
    ],
  },
];
