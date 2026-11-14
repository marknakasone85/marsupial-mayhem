// The playable marsupials (docs/ROSTER.md): 12 now, plus 2 secret ones that unlock later.
// Every move and trait comes from something the real animal does (facts checked in ROSTER.md).
MG.GROUND_Y = 470;
MG.PLAYER_COLORS = ['#ffd23f', '#9bf6ff', '#ff4d6d', '#9ef01a'];
MG.BUILD_COLORS = { FAST: '#00f5d4', POWER: '#ff4d6d', BALANCED: '#ffd23f' };

// Stats (Sloth Slap's model): speed = walk speed, atk = attack speed, power = damage, hp, weight = how
// little hits push you. basic/big = the attack and big-attack moves (style = how the art moves).
// abilities = trait modules in js/entities/abilities.js; special = js/entities/specials.js.
// joey = where its joey rides: 'pouch' (mums), 'backPouch' (mums whose pouch faces backwards: wombat, devil)
//        or 'back' (the boys, and the numbat, which has no pouch). Chosen by the owner: go by the names.
MG.CHARACTERS = [
  // ---------------------------------------------------------------- POWER
  {
    id: 'boomer', joey: 'back', name: 'BOOMER', species: 'Red kangaroo', build: 'POWER', art: 'kangaroo', scale: 0.84,
    speed: 265, atk: 0.92, power: 1.55, hp: 140, weight: 1.4, jump: 1010, kickPower: 1.3,
    basic: { style: 'punch', combo: true }, big: { style: 'kick' },
    abilities: ['tailCounter'],
    special: 'bound', specialName: 'BOOMER BOUND',
    trait: 'Tail Counter: block a hit and he kicks back by himself.',
    fact: 'The largest living marsupial. Males box, leaning back on the tail to kick with both feet.',
    coats: [null, { fur: '#d08a3c', dark: '#9a5a22' }, { fur: '#8e8fa6', dark: '#5f6078' }, { fur: '#7a4a32', dark: '#4f2c1c' }],
  },
  {
    id: 'stinker', joey: 'back', name: 'STINKER', species: 'Western grey kangaroo', build: 'POWER', art: 'kangaroo', scale: 0.82,
    colors: { fur: '#8a7768', dark: '#5e4f45', belly: '#d8cbbd', muzzle: '#a8978a' },
    speed: 245, atk: 0.85, power: 1.6, hp: 150, weight: 1.5, jump: 960, kickPower: 1.3,
    basic: { style: 'punch', dmg: 7 }, big: { style: 'haymaker', dmg: 17, kbx: 720, kby: -380, reach: 80 },
    abilities: ['tougher'],
    special: 'stink', specialName: 'STINK CLOUD',
    trait: 'Tough as old boots: the longer a fight goes on, the less hits hurt him.',
    fact: 'Big males are nicknamed "stinkers" for their strong, curry-like smell.',
  },
  {
    id: 'tank', joey: 'backPouch', name: 'TANK', species: 'Common wombat', build: 'POWER', art: 'critter', look: 'wombat', scale: 1,
    speed: 235, atk: 0.82, power: 1.7, hp: 150, weight: 2.0, jump: 780, kickPower: 1.1,
    basic: { style: 'headbutt', dmg: 7 }, big: { style: 'bumBlock', dmg: 15, kbx: 840, kby: -320, reach: 84 },
    abilities: ['superArmour', 'sprintBurst'],
    special: 'cubes', specialName: 'CUBE BARRAGE',
    trait: 'Super armour: small hits don\'t stop him. Double-tap a direction to sprint.',
    fact: 'Wombats make cube-shaped poo, block their burrows with a tough rump, and can sprint at about 40 km/h.',
  },
  {
    id: 'chompers', joey: 'backPouch', name: 'CHOMPERS', species: 'Tasmanian devil', build: 'POWER', art: 'critter', look: 'devil', scale: 1,
    speed: 270, atk: 0.9, power: 1.5, hp: 130, weight: 1.3, jump: 880, kickPower: 1.0,
    basic: { style: 'bite', dmg: 6, combo: true }, big: { style: 'crunch', dmg: 15, guardBreak: true, reach: 76 },
    abilities: ['scavenger'],
    special: 'screech', specialName: 'DEVIL SCREECH',
    trait: 'Eats leftover scraps from knocked-out pests for a little health. His crunch breaks blocks.',
    fact: 'The strongest bite for its size of any living mammal. Devils screech loudly when they feed.',
  },
  // ---------------------------------------------------------------- FAST
  {
    id: 'zip', joey: 'pouch', name: 'ZIP', species: 'Sugar glider', build: 'FAST', art: 'critter', look: 'glider', scale: 0.86,
    speed: 390, atk: 1.35, power: 0.8, hp: 85, weight: 0.7, jump: 900, kickPower: 0.8,
    basic: { style: 'swipe' }, big: { style: 'spinKick', dmg: 10 },
    abilities: ['glide'],
    special: 'diveBomb', specialName: 'DIVE BOMB',
    trait: 'Glide: hold jump while falling to float across gaps.',
    fact: 'Sugar gliders glide between trees on flaps of skin, up to about 50 metres.',
  },
  {
    id: 'stripes', joey: 'back', name: 'STRIPES', species: 'Numbat', build: 'FAST', art: 'critter', look: 'numbat', scale: 0.9,
    speed: 380, atk: 1.3, power: 0.85, hp: 90, weight: 0.8, jump: 860, kickPower: 0.85,
    basic: { style: 'swipe' }, big: { style: 'tailFlick', dmg: 8, kbx: 160, kby: -520, stun: 0.9, reach: 80 },
    abilities: ['snackSpeed'],
    special: 'tongue', specialName: 'TONGUE GRAB',
    trait: 'Termite Snack: every pickup gives a burst of speed. Tongue Grab pulls pests and pickups in.',
    fact: 'Numbats eat up to about 20,000 termites a day with a tongue about 10 cm long.',
  },
  {
    id: 'earl', joey: 'back', name: 'EARL', species: 'Greater bilby', build: 'FAST', art: 'critter', look: 'bilby', scale: 0.9,
    speed: 370, atk: 1.25, power: 0.85, hp: 90, weight: 0.8, jump: 900, kickPower: 0.9,
    basic: { style: 'kick' }, big: { style: 'earSlap', dmg: 11, reach: 78 },
    abilities: ['earRadar', 'rabbitBane'],
    special: 'burrow', specialName: 'BURROW DASH',
    trait: 'Ear Radar spots hiding pests. Extra damage to rabbits, his arch-rivals.',
    fact: 'Bilbies have huge ears and dig spiral burrows. In Australia the Easter Bilby stands in for the rabbit.',
  },
  {
    id: 'paddles', joey: 'pouch', name: 'PADDLES', species: 'Water opossum', build: 'FAST', art: 'critter', look: 'yapok', scale: 0.9,
    speed: 360, atk: 1.2, power: 0.9, hp: 95, weight: 0.9, jump: 860, kickPower: 0.9,
    basic: { style: 'swipe' }, big: { style: 'tailSlap', dmg: 11, reach: 86 },
    abilities: ['swimmer'],
    special: 'splash', specialName: 'SPLASH WAVE',
    trait: 'A strong swimmer: fast in water and can stay under (water maps come later).',
    fact: 'The only truly aquatic marsupial, with webbed hind feet and a watertight pouch. From the Americas.',
  },
  // ---------------------------------------------------------------- BALANCED
  {
    id: 'benny', joey: 'back', name: 'BENNY', species: 'Red-necked wallaby', build: 'BALANCED', art: 'kangaroo', scale: 0.7,
    colors: { fur: '#8e8a86', dark: '#625e5a', belly: '#e6e0d8', muzzle: '#b3aca5', neck: '#b9653a' },
    speed: 320, atk: 1.0, power: 1.05, hp: 110, weight: 1.0, jump: 950, kickPower: 1.15,
    basic: { style: 'kick', dmg: 5.5 }, big: { style: 'doubleKick', dmg: 8, hits: 2 },
    abilities: ['doubleJump'],
    special: 'thumpAlarm', specialName: 'THUMP ALARM',
    trait: 'Double jump. A good first character.',
    fact: 'Common in eastern Australia. Small wild colonies also live on the Isle of Man and Lambay Island.',
  },
  {
    id: 'drowsy', joey: 'back', name: 'DROWSY', species: 'Koala', build: 'BALANCED', art: 'critter', look: 'koala', scale: 0.95,
    speed: 300, atk: 1.0, power: 1.1, hp: 115, weight: 1.1, jump: 820, kickPower: 0.9,
    basic: { style: 'swipe' }, big: { style: 'treeHug', dmg: 14, kbx: 300, kby: -620, reach: 70 },
    abilities: ['powerNap', 'climb'],
    special: 'bellow', specialName: 'BELLOW',
    trait: 'Power Nap: stand still and hold block to doze and heal (risky!). Climbs the posts of stands.',
    fact: 'Koalas sleep up to about 20 hours a day on a low-energy gum-leaf diet. Males give a deep, loud bellow.',
  },
  {
    id: 'bins', joey: 'pouch', name: 'BINS', species: 'Common brushtail possum', build: 'BALANCED', art: 'critter', look: 'brushtail', scale: 0.92,
    speed: 330, atk: 1.05, power: 1.0, hp: 105, weight: 0.95, jump: 900, kickPower: 0.95,
    basic: { style: 'swipe', combo: true }, big: { style: 'tailWhip', dmg: 12, reach: 90 },
    abilities: ['wallCling'],
    special: 'binFling', specialName: 'BIN FLING',
    trait: 'Wall cling: hold toward a wall or gate in the air to cling, then jump off it.',
    fact: 'A bold city possum famous for noisy fights in roofs at night. It is a major pest in New Zealand.',
  },
  {
    id: 'deadfred', joey: 'back', name: 'DEAD FRED', species: 'Virginia opossum', build: 'BALANCED', art: 'critter', look: 'opossum', scale: 0.92,
    speed: 310, atk: 1.0, power: 1.05, hp: 110, weight: 1.0, jump: 860, kickPower: 0.95,
    basic: { style: 'bite', combo: true }, big: { style: 'grinChomp', dmg: 14, reach: 72 },
    abilities: ['venomImmune'],
    special: 'playDead', specialName: 'PLAY DEAD',
    trait: 'Venom immunity: stink clouds and poison don\'t hurt him.',
    fact: 'North America\'s only marsupial. It plays dead when threatened, resists many snake venoms and has 50 teeth.',
  },
];

// The two secret characters (docs/ROSTER.md): locked "?" tiles until they're found (MG.Unlocks).
//  Ghost: found in the Time Rift (clear its last map). Cousin Cuscus: a hidden crossover with
//  Sloth Slap (find the sloth who fell through the Time Rift, or play Sloth Slap in this same browser).
MG.SECRETS = [
  {
    id: 'ghost', joey: 'back', name: 'GHOST', species: 'Thylacine (Tasmanian tiger)', build: 'FAST', art: 'critter', look: 'thylacine', scale: 0.95, ghostly: true,
    speed: 375, atk: 1.25, power: 0.95, hp: 95, weight: 0.85, jump: 900, kickPower: 0.9,
    basic: { style: 'bite', combo: true }, big: { style: 'wideJaw', dmg: 13, guardBreak: true, reach: 80 },
    abilities: ['phase'],
    special: 'phantomDash', specialName: 'PHANTOM DASH',
    trait: 'Phase: every few seconds a hit passes straight through him. His wide-jaw bite breaks blocks.',
    fact: 'The last known thylacine died in 1936. It could open its jaws extremely wide.',
    hint: 'Found in the Time Rift...',
  },
  {
    id: 'cuscus', joey: 'pouch', name: 'COUSIN CUSCUS', species: 'Spotted cuscus', build: 'POWER', art: 'critter', look: 'cuscus', scale: 1,
    speed: 225, atk: 0.8, power: 1.75, hp: 155, weight: 1.9, jump: 760, kickPower: 1.0,
    basic: { style: 'slap', dmg: 7, combo: true }, big: { style: 'megaSlap', dmg: 18, kbx: 900, kby: -420, reach: 80 },
    abilities: ['takeItEasy'],
    special: 'slapStorm', specialName: 'SLAP STORM',
    trait: 'Takes it easy: slow, but standing still for a moment makes the next slap a SUPER SLAP.',
    fact: 'A slow-moving, sloth-like possum relative from New Guinea and Cape York.',
    hint: 'A cousin from another game...',
  },
];

// Unlocked secrets, saved in this browser.
MG.Unlocks = {
  list() { const u = MG.Save.get('unlocked', {}); return u && typeof u === 'object' ? u : {}; },
  has(id) {
    if (this.list()[id]) return true;
    // the Sloth Slap crossover: Sloth Slap saves in this same browser (same website) unlock the cousin
    if (id === 'cuscus') { try { for (let i = 0; i < localStorage.length; i++) if (/^slothslap\./.test(localStorage.key(i))) return true; } catch (e) { /* no storage */ } }
    return false;
  },
  unlock(id) { const u = this.list(); if (u[id]) return false; u[id] = 1; MG.Save.set('unlocked', u); return true; },
};
// Characters you can pick on this device (the 12, plus unlocked secrets), and any real character id
// (Wi-Fi friends may have unlocked a secret on their own device).
MG.pickable = () => MG.CHARACTERS.concat(MG.SECRETS.filter((c) => MG.Unlocks.has(c.id)));
MG.validCid = (id) => typeof id === 'string' && (MG.CHARACTERS.some((c) => c.id === id) || MG.SECRETS.some((c) => c.id === id));

MG.charById = (id) => MG.CHARACTERS.find((c) => c.id === id) || MG.SECRETS.find((c) => c.id === id) || MG.CHARACTERS[0];
// Coat for player 2-4 when several players pick the same character (kangaroos have their own list).
MG.coatFor = (def, slotId) => {
  if (def.coats) return def.coats[slotId % def.coats.length];
  if (!slotId) return null;
  const tints = [null, { tint: '#ffd27a' }, { tint: '#9bd0ff' }, { tint: '#c49bff' }];
  return tints[slotId % 4];
};
