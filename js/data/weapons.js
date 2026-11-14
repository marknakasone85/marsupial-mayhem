// Weapons, armor and upgrades: sold at the platypus's shop, and found in maps (docs/DESIGN.md,
// "Weapons, shop and upgrades"). A mix of real-style weapons with marsupial twists, plus specials.
// The tables have no prototype: Wi-Fi friends send weapon and armor names, so '__proto__' or
// 'constructor' must never look like an item.
(function () {
  const U = MG.U;
  const table = (o) => Object.assign(Object.create(null), o);

  // Fires one shot from the fighter's paws. o = MG.Projectile hit options.
  function shot(f, world, kind, speed, vy, o, dy = 0) {
    const y = f.y - f.h * 0.36 + dy;
    world.spawn(new MG.Projectile(kind, f.x + f.facing * 26, y, f.facing * speed, vy, f.team, Object.assign({ props: true, owner: f }, o)));
  }

  // A weapon bought in the shop gets stronger with each level (1-3).
  MG.WEAPON_LEVELS = [null, { dmg: 1, mag: 1, reload: 1 }, { dmg: 1.25, mag: 1.35, reload: 0.9 }, { dmg: 1.5, mag: 1.7, reload: 0.75 }];
  MG.MAX_WEAPON_LEVEL = 3;
  MG.weaponMag = (id, level) => Math.round(MG.WEAPONS[id].mag * MG.WEAPON_LEVELS[U.clamp(level || 1, 1, 3)].mag);
  // Upgrading costs half the price for level 2 and the full price again for level 3.
  MG.upgradePrice = (id, toLevel) => Math.round(MG.WEAPONS[id].price * (toLevel === 2 ? 0.5 : 1));

  // Every weapon fires while SHOOT is held, one shot every `rate` seconds, up to `mag` shots.
  // One you own refills by itself (a full load in `reload` seconds) once you stop shooting.
  // One found in a map has `pickupAmmo` shots and no refill; then your own weapon comes back.
  //  fire(f, world, k): spawns the shots; k = damage multiplier (weapon level, super power-up)
  //  bars: [power, speed, range] out of 5, for the shop
  MG.WEAPONS = table({
    shanghai: {
      name: 'SHANGHAI SLINGSHOT', short: 'SLINGSHOT', price: 40, bars: [2, 3, 3],
      desc: 'A pebble slingshot ("shanghai" is old Aussie slang for one). Steady shots that knock pests back.',
      rate: 0.4, mag: 6, reload: 2.2, pickupAmmo: 18, sound: 'twang',
      fire(f, w, k) { shot(f, w, 'pebble', 820, -70, { dmg: 8 * k, stun: 0.3, kbx: 260, kby: -120, gravity: 360, life: 1.2 }); },
    },
    snag: {
      name: 'SNAG SHOOTER', short: 'SNAGS', price: 80, bars: [3, 2, 2],
      desc: 'Fires barbecue sausages ("snags") that bounce along the ground and bowl pests over.',
      rate: 0.5, mag: 5, reload: 2.5, pickupAmmo: 15, sound: 'plop',
      fire(f, w, k) { shot(f, w, 'snag', 560, -330, { dmg: 11 * k, stun: 0.45, kbx: 420, kby: -260, gravity: 1100, bounce: 0.55, friction: 0.6, life: 1.5, ground: true }); },
    },
    thongs: {
      name: 'THONG FLINGER', short: 'THONGS', price: 110, bars: [2, 3, 2],
      desc: 'Flings three rubber thongs (Aussie flip-flops) at once in a spread. Great for a crowd up close.',
      rate: 0.6, mag: 6, reload: 2.4, pickupAmmo: 15, sound: 'plop',
      fire(f, w, k) {
        for (const vy of [-260, -90, 80]) shot(f, w, 'thong', 640, vy, { dmg: 6 * k, stun: 0.3, kbx: 300, kby: -200, gravity: 700, life: 0.75 });
      },
    },
    gatling: {
      name: 'GUMNUT GATLING', short: 'GATLING', price: 140, bars: [1, 5, 3],
      desc: 'Three spinning barrels of hard gumnuts. Hold SHOOT for a storm of them.',
      rate: 0.06, mag: 40, reload: 3, pickupAmmo: 100, sound: 'gatling', spins: true,
      fire(f, w, k) { shot(f, w, 'gumnut', 950, U.rand(-30, 30), { dmg: 3.5 * k, stun: 0.12, kbx: 130, kby: -60, life: 0.7, gravity: 220 }, U.rand(-3, 3)); f.vx -= f.facing * 18; },
    },
    bowler: {
      name: 'CRICKET-BALL BOWLER', short: 'BOWLER', price: 200, bars: [4, 2, 5],
      desc: 'A bowling machine for one. A rock-hard ball that goes straight through three pests.',
      rate: 0.85, mag: 4, reload: 3, pickupAmmo: 10, sound: 'thwack',
      fire(f, w, k) { shot(f, w, 'cricket', 1150, -40, { dmg: 20 * k, stun: 0.6, kbx: 560, kby: -300, gravity: 150, life: 1.1, pierce: 3, big: true }); },
    },
    hose: {
      name: 'FULL-BLAST GARDEN HOSE', short: 'HOSE', price: 250, bars: [1, 5, 2],
      desc: 'A garden hose on full blast. It hardly hurts, but it shoves pests right back and knocks them off their feet.',
      rate: 0.05, mag: 50, reload: 3, pickupAmmo: 100, sound: 'whoosh',
      fire(f, w, k) { shot(f, w, 'water', 700 + U.rand(-40, 40), U.rand(-70, 10), { dmg: 0.9 * k, stun: 0.22, kbx: 330, kby: -150, gravity: 650, life: 0.5, wet: true }, U.rand(-3, 3)); },
    },
    flamer: {
      name: 'EUCALYPTUS FLAMETHROWER', short: 'FLAMER', price: 300, bars: [4, 4, 1],
      desc: 'Sprays burning eucalyptus oil. Short range, but it roasts a whole crowd at once.',
      rate: 0.05, mag: 60, reload: 3.5, pickupAmmo: 120, sound: 'whoosh',
      fire(f, w, k) { shot(f, w, 'flame', 470 + U.rand(-40, 40), U.rand(-60, 30), { dmg: 1.6 * k, stun: 0.15, kbx: 60, kby: -30, gravity: -260, life: 0.42, radius: 20, pierce: true, fire: true }, U.rand(-4, 4)); },
    },
    dropbear: {
      name: 'DROP-BEAR LAUNCHER', short: 'DROP BEARS', price: 420, bars: [5, 1, 3],
      desc: 'Lobs a drop bear (a made-up Aussie legend) that lands on pests and mauls everything nearby.',
      rate: 1.1, mag: 3, reload: 4, pickupAmmo: 6, sound: 'plop',
      fire(f, w, k) {
        shot(f, w, 'dropbear', 540, -560, {
          dmg: 10 * k, stun: 0.4, kbx: 200, kby: -200, gravity: 1300, life: 2,
          burst: { kind: 'maul', dmg: 5.5 * k, stun: 0.35, kbx: 120, kby: -150, radius: 85, tick: 0.25, life: 1.1, still: true, pierce: true },
        });
      },
    },
    magpie: {
      name: 'MAGPIE SWOOPER', short: 'MAGPIES', price: 600, bars: [3, 3, 5],
      desc: 'Lets loose a magpie that swoops the nearest pests, pecking up to three. (Real magpies swoop in spring!)',
      rate: 0.7, mag: 4, reload: 4, pickupAmmo: 8, sound: 'squawk',
      fire(f, w, k) { shot(f, w, 'magpie', 420, -260, { dmg: 9 * k, stun: 0.35, kbx: 180, kby: -160, life: 2.6, pierce: 3, home: 1, fly: true }, -10); },
    },
  });
  MG.WEAPON_IDS = Object.keys(MG.WEAPONS);

  // Armor: a blue bar that takes the hits before your health does. Full again at the start of
  // every map and at checkpoints. You wear one set (you can own several and switch).
  MG.ARMORS = table({
    bark: { name: 'BARK VEST', price: 60, armor: 25, desc: 'A vest of stringybark. Better than nothing!' },
    billy: { name: 'BILLYCAN PLATING', price: 180, armor: 60, desc: 'Old billycans hammered flat into a chest plate. CLANK!' },
    iron: { name: 'CORRUGATED-IRON SUIT', price: 380, armor: 110, desc: 'Built like an outback shed. Pests bounce right off.' },
    roobar: { name: 'ROO-BAR ARMOUR', price: 650, armor: 170, desc: 'A truck\'s bull bar (Aussies call it a roo bar) bolted on the front. The toughest there is!' },
  });
  MG.ARMOR_IDS = Object.keys(MG.ARMORS);
  MG.ARMOR_PICKUP = 20;   // a bark patch found in a map: +20 armor (up to at least 30)

  // Upgrades that last for good. cat: the shop's section; key: the short name in a loadout
  // (it travels to the Wi-Fi host); per: how much each level adds.
  MG.UPGRADES = table({
    heart: { name: 'BIGGER HEART', cat: 'health', key: 'hp', prices: [100, 220, 400], desc: '+20 health for every marsupial you play, for good.', per: 20 },
    tonic: { name: 'GUM-LEAF TONIC', cat: 'health', key: 'rg', prices: [120, 260], desc: 'Heals you slowly once you haven\'t been hit for 4 seconds. Level 2 heals twice as fast.', per: 1.5 },
    belt: { name: 'GRENADE BELT', cat: 'grenades', key: 'gb', prices: [70, 150], desc: 'Start every map with an extra grenade.', per: 1 },
    bang: { name: 'BIGGER BANG', cat: 'grenades', key: 'bb', prices: [90, 200], desc: 'Your grenades blow up bigger and send pests flying further.', per: 0.25 },
    snacks: { name: 'JOEY SNACKS', cat: 'extras', key: 'js', prices: [80, 180], desc: 'Your joey is ready to help again sooner: 20% faster for each level.', per: 0.2 },
    magnet: { name: 'COIN MAGNET', cat: 'extras', key: 'mg', prices: [120], desc: 'Coins lying around fly to you from more than twice as far away.', per: 1.2 },
  });
  MG.UPGRADE_IDS = Object.keys(MG.UPGRADES);
  // The shop's sections, in order (weapons and armour are their own kinds of item).
  MG.SHOP_CATS = [
    { id: 'weapons', name: 'WEAPONS' }, { id: 'armour', name: 'ARMOUR' }, { id: 'health', name: 'HEALTH' },
    { id: 'grenades', name: 'GRENADES' }, { id: 'extras', name: 'EXTRAS' },
  ];
  // Selling back to the platypus gives half of what you paid.
  MG.SELL_BACK = 0.5;

  // Coins dropped by each pest (the boss drops a pile).
  MG.COINS = { rabbit: 2, cat: 5, pig: 8, bigBuck: 40, crate: 3 };
  // Pests not in the list pay by how tough they are; world bosses drop a big pile.
  MG.coinsFor = (e) => {
    if (Object.prototype.hasOwnProperty.call(MG.COINS, e.type)) return MG.COINS[e.type];
    if (e.echo) return 0;
    return e.isBoss ? Math.min(100, Math.round(e.d.score / 150)) : Math.max(2, Math.round(e.d.score / 60));
  };
})();
