// The playable marsupials (docs/ROSTER.md). Milestone 1 has Boomer; the rest come in Milestone 3.
MG.GROUND_Y = 470;
MG.PLAYER_COLORS = ['#ffd23f', '#9bf6ff', '#ff4d6d', '#9ef01a'];

MG.CHARACTERS = [
  {
    id: 'boomer', name: 'BOOMER', species: 'Red kangaroo', build: 'POWER', art: 'kangaroo', scale: 0.84,
    // stats (Sloth Slap's model): speed = walk speed, atk = attack speed, power = damage, hp, weight = how far hits push
    speed: 265, atk: 0.92, power: 1.55, hp: 140, weight: 1.4,
    jump: 1010,          // huge bounding jumps
    kickPower: 1.3,      // kangaroos kick grenades furthest
    special: 'bound', specialName: 'BOOMER BOUND',
    trait: 'Tail Counter: block a hit and he kicks back by himself.',
    fact: 'The largest living marsupial. Males box, leaning back on the tail to kick with both feet.',
    // when several players are Boomer, players 2-4 get their own coats so you can tell them apart
    coats: [null, { fur: '#d08a3c', dark: '#9a5a22' }, { fur: '#8e8fa6', dark: '#5f6078' }, { fur: '#7a4a32', dark: '#4f2c1c' }],
  },
];

MG.charById = (id) => MG.CHARACTERS.find((c) => c.id === id) || MG.CHARACTERS[0];
