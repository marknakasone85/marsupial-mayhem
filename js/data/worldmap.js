// The Marsupial World map (docs/DESIGN.md, "The Marsupial World map") and the story panels.
// A made-up continent based on Australia's regions. Each map is a stop on a path; clearing one
// opens the next. Worlds 4-7 come in Milestone 7 (shown as "coming soon").
MG.WORLDS = [
  { id: 'outback', name: 'THE OUTBACK', levels: ['outback-1', 'outback-2', 'outback-3', 'outback-4'], story: 'invasion' },
  { id: 'rainforest', name: 'THE RAINFOREST', levels: ['rainforest-1', 'rainforest-2', 'rainforest-3'], story: 'rainforest' },
  { id: 'canefields', name: 'CANE FIELDS & COAST', levels: ['cane-1', 'cane-2', 'cane-3', 'cane-4'], story: 'canefields' },
  { id: 'tasmania', name: 'TASMANIA & THE ALPS', levels: ['alps-1', 'alps-2', 'alps-3'], story: 'tasmania' },
  { id: 'city', name: 'THE CITY', levels: ['city-1', 'city-2', 'city-3', 'city-4'], story: 'city' },
  { id: 'rift', name: 'TIME RIFT (BONUS)', levels: ['rift-1', 'rift-2', 'rift-3'], story: 'rift', bonus: true },
  { id: 'grinisle', name: 'GRIN ISLE', levels: ['grin-1', 'grin-2', 'grin-3', 'grin-4'] },
  { id: 'isleofman', name: 'SECRET BONUS', levels: ['iom-1'], bonus: true },
];
MG.WORLDS_SOON = []; // every world is open now (Milestone 7)
// Where each map's stop sits on the 960x540 world map, and the platypus's shop.
MG.MAP_STOPS = {
  shop: [255, 360],
  'outback-1': [330, 330], 'outback-2': [395, 288], 'outback-3': [470, 316], 'outback-4': [520, 252],
  'rainforest-1': [590, 196], 'rainforest-2': [648, 140], 'rainforest-3': [716, 104],
  'cane-1': [784, 160], 'cane-2': [806, 222], 'cane-3': [780, 282], 'cane-4': [742, 334],
  'alps-1': [650, 420], 'alps-2': [585, 428], 'alps-3': [694, 486],
  'city-1': [600, 380], 'city-2': [638, 356], 'city-3': [676, 372], 'city-4': [712, 396],
  'rift-1': [272, 206], 'rift-2': [322, 166], 'rift-3': [374, 192],
  'grin-1': [56, 302], 'grin-2': [94, 272], 'grin-3': [130, 304], 'grin-4': [92, 336],
  'iom-1': [150, 95],
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
  tasmania: [
    { theme: 'alps', title: 'WORLD 4: TASMANIA & THE ALPS', lines: ['Snow gums, alpine huts and a wild southern coast.', 'The pests have hypnotised the pademelons! Knock them out and they snap out of it.', 'Real fact: foxes never settled in Tasmania. Rabbits and feral cats did, though.'],
      cast: [{ who: 'pest', type: 'pademelon', x: 260 }, { who: 'pygmyPossum', x: 440 }, { who: 'char', cid: 'chompers', x: 640, f: -1 }] },
  ],
  quoll: [
    { theme: 'tasmania', title: 'THE QUOLL CHAMPION', lines: ['"Sorry, champs! Somebody told me YOU brought the pests to Marsupial World."', '"Who told you that?"  "Er... a very friendly, very smiley quokka."', 'Hmm. Funny, that.'],
      cast: [{ who: 'quoll', champ: true, x: 300, s: 2 }, { who: 'char', cid: 'boomer', x: 560, f: -1 }, { who: 'char', cid: 'stripes', x: 700, f: -1 }] },
  ],
  city: [
    { theme: 'city', title: 'WORLD 5: THE CITY', lines: ['A harbour city of laneways, rooftops and wheelie bins: Bins\'s home turf!', 'Real fact: red foxes were brought over in the 1800s for hunting, and city foxes are real.', 'They answer to FOXY ROXY and her fox gang.'],
      cast: [{ who: 'char', cid: 'bins', x: 260 }, { who: 'pest', type: 'fox', x: 520, f: -1 }, { who: 'pest', type: 'fox', x: 640, f: -1 }] },
  ],
  rift: [
    { theme: 'rift', title: 'A CRACK IN TIME!', lines: ['A strange glowing crack has opened: the TIME RIFT, a bonus world.', 'Through it: the giants of ancient Marsupial World, very confused and very grumpy.', 'Real fact: Diprotodon, the biggest marsupial ever, was about the size of a rhino.'],
      cast: [{ who: 'diprotodon', x: 300 }, { who: 'char', cid: 'tank', x: 640, f: -1 }] },
  ],
  ghost: [
    { theme: 'rift', title: 'A SHY STRIPED LEGEND', lines: ['In the Time Rift, a quiet striped hunter has been watching you.', 'Real fact: the last known thylacine (Tasmanian tiger) died in 1936.', 'Here in the rift, one still roams... GHOST THE THYLACINE JOINS YOU!'],
      cast: [{ who: 'char', cid: 'ghost', x: 480, s: 1.3 }] },
  ],
  betrayal: [
    { theme: 'grinisle', title: 'THE VICTORY PARTY', lines: ['Grin Isle! Bunting, souvenirs, and a party for the champions.', '"Welcome, welcome! Everybody SMILE for one last selfie..."'],
      cast: [{ who: 'quokka', sponsor: true, x: 480, s: 2 }, { who: 'char', cid: 'boomer', x: 250 }, { who: 'char', cid: 'zip', x: 720, f: -1 }] },
    { theme: 'grinisle', title: 'IT\'S A TRAP!', lines: ['The quokkas drop their smiles.', '"You fools! WE shipped the pests in, for our friends the reptiles!"', '"It\'s all part of OPERATION MARSUPIAL WORLD CONQUEST!"'],
      cast: [{ who: 'quokka', angry: true, x: 480, s: 2 }, { who: 'pest', type: 'perentie', x: 230 }, { who: 'pest', type: 'frilledLizard', x: 730, f: -1 }] },
    { theme: 'grinisle', title: 'JOIN FORCES!', lines: ['Rivals no more: every good marsupial in Marsupial World teams up.', 'CPU champions fight beside you from now on. FOR MARSUPIAL WORLD!'],
      cast: [{ who: 'char', cid: 'stinker', x: 200 }, { who: 'char', cid: 'tank', x: 330 }, { who: 'char', cid: 'drowsy', x: 460 }, { who: 'char', cid: 'chompers', x: 600, f: -1 }, { who: 'char', cid: 'benny', x: 740, f: -1 }] },
  ],
  lair: [
    { theme: 'lair', title: 'THE REPTILIANS\' LAIR', lines: ['Under Grin Isle: a cave full of eggs, crystals and very cross reptiles.', 'On a stone throne waits their leader: THE CROC EMPEROR.', 'Real fact: the saltwater crocodile is the largest living reptile.'],
      cast: [{ who: 'pest', type: 'crocLand', x: 480, emperor: true, s: 0.9 }] },
  ],
  isleofman: [
    { theme: 'isleofman', title: 'BENNY\'S SECRET ISLAND', lines: ['"Psst! I know a place far, far away where my cousins live wild."', 'Real fact: a small colony of feral red-necked wallabies lives on the Isle of Man.', 'A bonus map full of coins!'],
      cast: [{ who: 'char', cid: 'benny', x: 360, s: 1.2 }, { who: 'char', cid: 'benny', x: 600, f: -1 }] },
  ],
  ending: [
    { theme: 'grinisle', title: 'MARSUPIAL WORLD IS SAVED!', lines: ['The Croc Emperor is beaten and the pests are on the run.', 'The reptiles go back to sunbaking. The quokkas are banned from the tournament...', '...but allowed back next year, if they behave. (Smile!)'],
      cast: [{ who: 'char', cid: 'boomer', x: 200 }, { who: 'char', cid: 'zip', x: 340 }, { who: 'quokka', x: 480, s: 1.4 }, { who: 'char', cid: 'tank', x: 620, f: -1 }, { who: 'char', cid: 'bins', x: 760, f: -1 }] },
    { theme: 'outback', title: 'THE GREAT POUCH TOURNAMENT RESUMES!', lines: ['And this year, the platypus finally gets to watch.', '"Best seat in the house!"'],
      cast: [{ who: 'platypus', x: 480 }, { who: 'char', cid: 'stinker', x: 260 }, { who: 'char', cid: 'chompers', x: 700, f: -1 }] },
    { theme: 'outback', title: 'THE END', lines: ['Thanks for playing MARSUPIAL MAYHEM!', 'Try a Tournament Duel, replay any map for a better score, and look for the secrets.'],
      cast: [{ who: 'char', cid: 'boomer', x: 260 }, { who: 'char', cid: 'drowsy', x: 480 }, { who: 'char', cid: 'deadfred', x: 700, f: -1 }] },
  ],
  world3done: [
    { theme: 'coast', title: 'THREE WORLDS CLEARED!', lines: ['The Outback, the Rainforest and the Cane Fields are pest-free (for now).', '"Brilliant work, champs! When it\'s all over, you\'re invited', 'to a VICTORY PARTY on Grin Isle! Keep smiling!"'],
      cast: [{ who: 'char', cid: 'boomer', x: 240 }, { who: 'quokka', sponsor: true, x: 480, s: 2 }, { who: 'char', cid: 'paddles', x: 700, f: -1 }] },
  ],
};
