// The Marsupial World map (docs/DESIGN.md, "The Marsupial World map") and the story panels.
// A made-up continent based on Australia's regions. Each map is a stop on a path; clearing one
// opens the next. Worlds 4-7 come in Milestone 7 (shown as "coming soon").
MG.WORLDS = [
  { id: 'outback', name: 'THE OUTBACK', levels: ['outback-1', 'outback-2', 'outback-3', 'outback-4'], story: 'invasion' },
  { id: 'rainforest', name: 'THE RAINFOREST', levels: ['rainforest-1', 'rainforest-2', 'rainforest-3'], story: 'rainforest' },
  { id: 'canefields', name: 'CANE FIELDS & COAST', levels: ['cane-1', 'cane-2', 'cane-3', 'cane-4'], story: 'canefields' },
];
MG.WORLDS_SOON = [ // "coming soon" tags, just under the world map art's region names
  { name: 'TASMANIA & THE ALPS', x: 560, y: 440 },
  { name: 'THE CITY', x: 728, y: 378 },
  { name: 'TIME RIFT', x: 330, y: 160 },
  { name: 'GRIN ISLE', x: 92, y: 380 },
];
// Where each map's stop sits on the 960x540 world map, and the platypus's shop.
MG.MAP_STOPS = {
  shop: [255, 360],
  'outback-1': [330, 330], 'outback-2': [395, 288], 'outback-3': [470, 316], 'outback-4': [520, 252],
  'rainforest-1': [590, 196], 'rainforest-2': [648, 140], 'rainforest-3': [716, 104],
  'cane-1': [784, 160], 'cane-2': [806, 222], 'cane-3': [780, 282], 'cane-4': [742, 334],
};

// Story panels: a title, a few lines, and who's in the picture (cast: char, quokka, platypus, pest, ...).
// They play on the world map: the opening the first time, the invasion after the first map, and an
// intro for each new world. No twist here: the quokkas are only ever helpful (for now).
MG.STORY = {
  opening: [
    { theme: 'outback', title: 'THE GREAT POUCH TOURNAMENT', lines: ['Every year the toughest marsupials in Marsupial World', 'meet in the Outback to decide who is CHAMPION.'],
      cast: [{ who: 'char', cid: 'boomer', x: 200 }, { who: 'char', cid: 'tank', x: 340 }, { who: 'char', cid: 'zip', x: 470, f: -1 }, { who: 'char', cid: 'drowsy', x: 590, f: -1 }, { who: 'char', cid: 'chompers', x: 720, f: -1 }] },
    { theme: 'outback', title: 'PROUDLY SPONSORED BY GRIN ISLE HOLIDAYS', lines: ['"Smile, champions! Everyone say GRIN ISLE!"', 'The jolly quokka sponsor hands out medals and takes selfies.'],
      cast: [{ who: 'char', cid: 'stripes', x: 260 }, { who: 'quokka', sponsor: true, x: 480, s: 2, f: -1 }, { who: 'char', cid: 'benny', x: 700, f: -1 }] },
    { theme: 'outback', title: 'EGG-LAYERS CAN\'T ENTER!', lines: ['"Can I enter? I\'ve got venomous ankle spurs!"', '"Sorry, mate. Marsupials only."', '"Fine. Then I\'ll open a SHOP!"'],
      cast: [{ who: 'platypus', x: 300 }, { who: 'quokka', sponsor: true, x: 560, s: 1.6, f: -1 }, { who: 'char', cid: 'boomer', x: 720, f: -1 }] },
    { theme: 'outback', title: 'LET THE TOURNAMENT BEGIN!', lines: ['First event: the Tournament Trail.', 'May the best marsupial win!'],
      cast: [{ who: 'char', cid: 'bins', x: 260 }, { who: 'char', cid: 'earl', x: 400 }, { who: 'char', cid: 'paddles', x: 560, f: -1 }, { who: 'char', cid: 'deadfred', x: 700, f: -1 }] },
  ],
  invasion: [
    { theme: 'outback', title: 'THE INVASION!', lines: ['Rabbits, feral cats and feral pigs stormed the tournament!', 'And there are pests all across Marsupial World.', 'Real fact: two dozen rabbits let go in 1859 grew into plagues that stripped the land bare.'],
      cast: [{ who: 'pest', type: 'rabbit', x: 220 }, { who: 'pest', type: 'pig', x: 360 }, { who: 'pest', type: 'cat', x: 520 }, { who: 'pest', type: 'rabbit', x: 640 }, { who: 'char', cid: 'boomer', x: 790, f: -1 }] },
    { theme: 'outback', title: 'THE SMILE SQUAD TO THE RESCUE!', lines: ['"Don\'t worry, champs! The quokkas\' Smile Squad is here to help!"', '"Chase the pests out of every region. We\'ll be right behind you,', 'with hearts, tips and supply drops!"'],
      cast: [{ who: 'quokka', shirt: true, x: 300, s: 1.5 }, { who: 'quokka', sponsor: true, x: 480, s: 2 }, { who: 'quokka', shirt: true, x: 660, s: 1.5, f: -1 }] },
    { theme: 'outback', title: 'FOR HOME!', lines: ['The champions put the trophy aside and team up.', 'First stop: the rest of the Outback, and the WARREN WARLORD.'],
      cast: [{ who: 'char', cid: 'stinker', x: 250 }, { who: 'char', cid: 'chompers', x: 400 }, { who: 'char', cid: 'zip', x: 540, f: -1 }, { who: 'char', cid: 'tank', x: 690, f: -1 }] },
  ],
  rainforest: [
    { theme: 'rainforest', title: 'WORLD 2: THE RAINFOREST', lines: ['The pests went bush, deep into the rainforest.', 'Watch out for cassowaries, and look up: a tree-kangaroo is on your side.', 'Somewhere in the leaves waits BIG TOM, the biggest feral cat of all.'],
      cast: [{ who: 'cassowary', x: 260 }, { who: 'treeKangaroo', x: 480, y: 330 }, { who: 'pest', type: 'cat', x: 680, f: -1 }] },
  ],
  canefields: [
    { theme: 'canefields', title: 'WORLD 3: CANE FIELDS & COAST', lines: ['Cane toads everywhere! Real fact: they were brought here in 1935 to eat cane beetles.', 'They\'re poisonous, and they spread right across the north.', 'Press JUMP to swim, and stay away from the crocodiles\' eyes...'],
      cast: [{ who: 'pest', type: 'toad', x: 240 }, { who: 'pest', type: 'toad', x: 330 }, { who: 'quoll', x: 520, scared: true, f: -1 }, { who: 'char', cid: 'paddles', x: 700, f: -1 }] },
  ],
  world3done: [
    { theme: 'coast', title: 'THREE WORLDS CLEARED!', lines: ['The Outback, the Rainforest and the Cane Fields are pest-free (for now).', '"Brilliant work, champs! When it\'s all over, you\'re invited', 'to a VICTORY PARTY on Grin Isle! Keep smiling!"'],
      cast: [{ who: 'char', cid: 'boomer', x: 240 }, { who: 'quokka', sponsor: true, x: 480, s: 2 }, { who: 'char', cid: 'paddles', x: 700, f: -1 }] },
  ],
};
