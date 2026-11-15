// Milestone 3: all 12 marsupials. Every attack, big attack and special does something, and every
// trait works. (Boomer's moves are tested in detail in test_boomer.js.)
function arena(cid, x) {
  MG.Engine.setScene(new MG.CampaignScene({ charId: cid, level: 0 }));
  var sc = scene();
  sc.enemies = []; sc.crates = []; sc.pickups = []; sc.boss = null;
  sc.gates.forEach(function (g) { g.opened = true; });
  sc.player.x = x || 600; sc.player.facing = 1;
  sc.t = 5;
  frames(20);
  return sc;
}
function dummy(sc, type, x, hp) {
  var e = sc.addEnemy(type, x);
  e.think = function () { this.vx = 0; };
  e.hidden = false;
  if (hp) e.hp = e.maxHp = hp;
  sc.enemies.push(e);
  return e;
}
function press(code, n) { key(code, true); frames(1); key(code, false); frames(n === undefined ? 20 : n); }
function hurtCount(list) { return list.filter(function (e) { return e.hp < e.maxHp || !e.alive; }).length; }

check(MG.CHARACTERS.length === 12 && MG.SECRETS.length === 2, '12 playable marsupials and 2 secret ones');
var builds = { FAST: 0, POWER: 0, BALANCED: 0 };
MG.CHARACTERS.forEach(function (c) { builds[c.build]++; });
check(builds.FAST === 4 && builds.POWER === 4 && builds.BALANCED === 4, '4 Fast, 4 Power and 4 Balanced');
check(MG.CHARACTERS.every(function (c) { return MG.SPECIALS[c.special] && c.fact && c.trait && c.specialName; }), 'every character has a special, a trait and a fact');
check(MG.CHARACTERS.every(function (c) { return (c.abilities || []).every(function (a) { return MG.ABILITIES[a]; }); }), 'every trait module exists');
var ids = MG.CHARACTERS.map(function (c) { return c.special; });
check(ids.filter(function (s, i) { return ids.indexOf(s) === i; }).length === 12, 'all 12 specials are different');

// ---- players asked (15 Nov 2026): every marsupial punches (attack) and kicks (big attack)
var everyone = MG.CHARACTERS.concat(MG.SECRETS);
check(everyone.every(function (c) { return c.basic.style === 'punch'; }), 'every marsupial (the secret ones too) punches with attack');
check(everyone.every(function (c) { return /^(kick|spinKick|doubleKick)$/.test(c.big.style); }) && MG.charById('zip').big.style === 'spinKick' && MG.charById('benny').big.style === 'doubleKick',
  '...and kicks with the big attack (Zip\'s kick spins, Benny\'s kicks twice)');
check(MG.charById('chompers').big.guardBreak && MG.charById('tank').big.kbx === 840 && MG.charById('cuscus').big.dmg === 18 && MG.charById('stinker').basic.dmg === 7,
  'each keeps its own numbers (Chompers\' kick still breaks blocks)');
var drawn = {}, realChar = MG.Art.character;
MG.Art.character = function (ctx, def, o) { drawn[def.id] = Object.assign({}, o); };
everyone.forEach(function (c) { MG.Fighter.drawState(makeCtx(), { cid: c.id, x: 100, y: 470, f: 1, pose: 'idle', t: 1, walk: 0, vx: 0, kick: 1 }, { groundY: 470 }); });
var kicked = drawn, punched = {}; drawn = {};
everyone.forEach(function (c) { MG.Fighter.drawState(makeCtx(), { cid: c.id, x: 100, y: 470, f: 1, pose: 'idle', t: 1, walk: 0, vx: 0, jab: 1, ja: 1 }, { groundY: 470 }); punched[c.id] = drawn[c.id]; });
MG.Art.character = realChar;
check(everyone.every(function (c) { var o = kicked[c.id]; return c.art === 'kangaroo' ? o.kick === 1 && !o.jab : o.big === 1 && /kick/i.test(o.bigStyle); }),
  'every big attack is drawn as a kick (kangaroos lean back on the tail)');
check(everyone.every(function (c) { var o = punched[c.id]; return c.art === 'kangaroo' ? o.jab === 1 && o.jabArm === 1 : o.basic === 1 && o.basicStyle === 'punch' && o.jabArm === 1; }),
  'every attack is drawn as a punch, with the other paw on the next combo hit');
// the critter rig: the kick sends the front foot out and up; a punch sends a paw straight out
function critterParts(look, o) {
  var k = MG.Art.LOOKS[look], real = MG.Art.oval, feet = [], paws = [];
  MG.Art.oval = function (ctx, x, y, rx, ry) {
    if (Math.abs(rx - k.footLen * 0.55) < 0.01 && ry === 4.5) feet.push([x, y]);
    if (Math.abs(rx - k.armW * 0.55) < 0.01 && Math.abs(ry - k.armW * 0.5) < 0.01) paws.push(x);
    return real.apply(this, arguments);
  };
  MG.Art.critter(makeCtx(), Object.assign({ x: 0, y: 0, look: look, t: 1, facing: 1 }, o));
  MG.Art.oval = real;
  return { feet: feet, paws: paws };
}
var rigOk = ['wombat', 'devil', 'koala', 'bilby', 'cuscus'].every(function (look) {
  var still = critterParts(look, {}), kick = critterParts(look, { big: 1, bigStyle: 'kick' });
  var p0 = critterParts(look, { basic: 1, basicStyle: 'punch', jabArm: 0 }), p1 = critterParts(look, { basic: 1, basicStyle: 'punch', jabArm: 1 });
  return still.feet.length === 2 && kick.feet[1][0] > still.feet[1][0] + 20 && kick.feet[1][1] < still.feet[1][1] - 15 && Math.abs(kick.feet[0][1] - still.feet[0][1]) < 3
    && p0.paws[1] > still.paws[1] + 12 && Math.abs(p0.paws[0] - still.paws[0]) < 1 && p1.paws[0] > still.paws[0] + 12 && Math.abs(p1.paws[1] - still.paws[1]) < 1;
});
check(rigOk, 'the critters\' kick thrusts the front foot out and up (the back foot stays planted); punches send one paw straight out');

// ---- every character: attack and big attack hit, and every pose draws
MG.CHARACTERS.forEach(function (c) {
  var sc = arena(c.id), p = sc.player, d = dummy(sc, 'pig', 600 + 50, 800);
  var hp0 = d.hp; press('KeyF', 25); var basic = hp0 - d.hp;
  d.x = 650; d.vx = 0; frames(30);
  hp0 = d.hp; press('KeyE', 45); var big = hp0 - d.hp;
  var err = null;
  try {
    ['idle', 'walk', 'jump', 'block', 'hurt', 'ko', 'win'].forEach(function (pose) {
      var s = p.renderState(); s.pose = pose; MG.Fighter.drawState(MG.Engine.ctx, s, sc);
    });
    p.meter = 100; press('KeyH', 3); for (var i = 0; i < 40; i++) { frames(1); sc.draw(MG.Engine.ctx); }
  } catch (e) { err = '' + e; }
  check(basic > 0 && big > basic && !err, c.name + ': attack ' + basic.toFixed(1) + ', big attack ' + big.toFixed(1) + (err ? ' DRAW ERROR ' + err : ', every pose draws'));
});

// ---- the specials
function special(cid, setup, n) {
  var sc = arena(cid, 400), p = sc.player;
  var extra = setup ? setup(sc, p) : null;
  p.meter = 100; key('KeyH', true); frames(1); key('KeyH', false);
  frames(n || 90);
  return { sc: sc, p: p, extra: extra };
}
var r;
r = special('stinker', function (sc) { return [dummy(sc, 'rabbit', 460, 60), dummy(sc, 'rabbit', 500, 60)]; }, 20);
var cloud = r.sc.projectiles.find(function (q) { return q.kind === 'stink'; });
var bunny = r.sc.addEnemy('rabbit', 520); bunny.hidden = false; r.sc.enemies.push(bunny);
frames(150);
check(!!cloud && hurtCount(r.extra) === 2 && bunny.fleeT !== undefined, 'STINKER: Stink Cloud hurts pests over time and they run from it');

r = special('tank', null, 140);
var walls = r.sc.walls();
check(walls.length >= 2, 'TANK: Cube Barrage leaves ' + walls.length + ' cube walls');
var runner = r.sc.addEnemy('pig', walls[walls.length - 1].x + 160); runner.hidden = false; runner.state = 'charge'; runner.chargeDir = -1; runner.cool = 9; r.sc.enemies.push(runner);
frames(60);
check(runner.x > walls[walls.length - 1].x, 'a charging pig can\'t get past a cube wall');

r = special('chompers', function (sc) { return [dummy(sc, 'pig', 470, 300), dummy(sc, 'pig', 330, 300)]; }, 100);
check(hurtCount(r.extra) === 2 && r.extra[0].hp < r.extra[1].hp, 'CHOMPERS: Devil Screech stuns everyone close, then the bites land on one');

r = special('zip', function (sc) { return dummy(sc, 'pig', 640, 300); }, 120);
check(r.extra.hp < r.extra.maxHp, 'ZIP: Dive Bomb crashes down on a pest');

r = special('stripes', function (sc) { var d = dummy(sc, 'pig', 680, 300); sc.pickups.push(new MG.Pickup('heart', 520, MG.GROUND_Y)); return d; }, 4);
frames(30);
check(r.sc.pickups.length === 0, 'STRIPES: Tongue Grab slurps up a pickup on the way');
r = special('stripes', function (sc) { return dummy(sc, 'pig', 680, 300); }, 40);
check(r.extra.x < 640 && r.extra.hp < r.extra.maxHp, 'STRIPES: Tongue Grab yanks a pest over (x 680 -> ' + Math.round(r.extra.x) + ')');

r = special('earl', function (sc) { return dummy(sc, 'pig', 640, 300); }, 16);
var hidden = r.p.burrowed, missed = r.p.takeHit({ dmg: 10, kbx: 0, kby: 0, stun: 0.2 }, r.sc);
frames(80);
check(hidden && missed === 'miss' && r.extra.hp < r.extra.maxHp, 'EARL: Burrow Dash goes underground (can\'t be hit) and pops up under a pest');

r = special('paddles', function (sc) { return dummy(sc, 'pig', 600, 300); }, 50);
check(r.extra.hp < r.extra.maxHp && r.extra.x > 640, 'PADDLES: Splash Wave knocks a pest away');

r = special('benny', function (sc) { return dummy(sc, 'pig', 900, 300); }, 8);
frames(20);
var wallabies = r.sc.projectiles.filter(function (q) { return q.kind === 'wallaby'; }).length;
frames(120);
check(wallabies === 4 && r.extra.hp < r.extra.maxHp, 'BENNY: Thump Alarm sends 4 wallabies stampeding across the screen');

r = special('drowsy', function (sc) { return [dummy(sc, 'pig', 600, 300), dummy(sc, 'pig', 220, 300)]; }, 60);
check(hurtCount(r.extra) === 2, 'DROWSY: Bellow hits everything around');

r = special('bins', function (sc) { return dummy(sc, 'pig', 720, 300); }, 80);
check(r.extra.hp < r.extra.maxHp, 'BINS: Bin Fling hits a pest with a wheelie bin');

r = special('deadfred', function (sc) { var d = dummy(sc, 'pig', 470, 300); d.think = function () {}; return d; }, 20);
var playing = r.p.playingDead, nobody = r.sc.nearestFighter(r.p.x).x < -1000;
var dodge = r.p.takeHit({ dmg: 30, kbx: 0, kby: 0, stun: 0.2 }, r.sc);
frames(120);
check(playing && nobody && dodge === 'miss', 'DEAD FRED: Play Dead - nothing can hurt him and pests lose interest');
check(r.extra.hp < r.extra.maxHp, 'DEAD FRED: ...then a surprise chomp');

// ---- the traits
var sc = arena('benny', 600), p = sc.player;
key('KeyW', true); frames(18); var y1 = p.y; key('KeyW', false); frames(1); key('KeyW', true); frames(1); key('KeyW', false);
var top = p.y; for (var i = 0; i < 30; i++) { frames(1); top = Math.min(top, p.y); }
check(top < y1 - 40, 'BENNY: double jump');
frames(60);

sc = arena('zip', 600); p = sc.player;
p.y = 200; p.vy = 0; p.onGround = false; key('KeyW', true); frames(40); var glided = p.y; key('KeyW', false);
sc = arena('zip', 600); p = sc.player; p.y = 200; p.vy = 0; p.onGround = false; frames(40);
check(glided < p.y - 60, 'ZIP: holding jump while falling glides (' + Math.round(glided) + ' vs ' + Math.round(p.y) + ')');

sc = arena('tank', 600); p = sc.player;
p.takeHit({ dmg: 6, kbx: 200, kby: -100, stun: 0.4, from: { x: 700 } }, sc);
check(p.state !== 'hurt', 'TANK: super armour - a small hit doesn\'t stop him');
frames(30);
key('KeyD', true); frames(2); key('KeyD', false); frames(3); key('KeyD', true); frames(2);
check(p.sprintT > 0, 'TANK: double-tap a direction for a wombat sprint');
frames(20); key('KeyD', false); frames(30);

sc = arena('stinker', 600); p = sc.player;
var fresh = p.hp; p.takeHit({ dmg: 20, kbx: 0, kby: 0, stun: 0.1 }, sc); var early = fresh - p.hp;
p.fightT = 90; p.state = 'idle'; p.invuln = 0; fresh = p.hp; p.takeHit({ dmg: 20, kbx: 0, kby: 0, stun: 0.1 }, sc);
check(fresh - p.hp < early * 0.8, 'STINKER: tougher the longer the fight goes on');

sc = arena('chompers', 600); p = sc.player;
var victim = sc.addEnemy('rabbit', 700); victim.hidden = false; sc.enemies.push(victim);
var scraps = 0;
for (i = 0; i < 20; i++) { sc.onEnemyKilled(victim); }
scraps = sc.pickups.filter(function (k) { return k.type === 'scrap'; });
p.hp = 50; scraps[0].x = p.x; frames(5);
check(scraps.length > 3 && p.hp > 50, 'CHOMPERS: knocked-out pests leave scraps, and he eats them');
var biter = new MG.Fighter(MG.charById('chompers'), 300, { team: 'a' }), blocker = new MG.Fighter(MG.charById('boomer'), 340, { team: 'b', facing: -1 });
blocker.state = 'block';
check(blocker.takeHit({ dmg: 15, kbx: 300, kby: -100, stun: 0.4, guardBreak: true, from: biter }, sc) === 'hit', 'CHOMPERS: the crunch breaks a block');
sc = arena('boomer', 600); sc.slots[0].f.x = 600;
var s2 = sc.addSlot({ id: 1, cid: 'chompers', local: 'P2' }, 820);
var leftover = new MG.Pickup('scrap', 600, MG.GROUND_Y); sc.pickups.push(leftover); frames(5);
check(!leftover.taken, '...and nobody else eats them');

sc = arena('stripes', 600); p = sc.player;
sc.pickups.push(new MG.Pickup('heart', 610, MG.GROUND_Y)); frames(5);
check(p.powers.snack > 0, 'STRIPES: a pickup is a Termite Snack (speed burst)');

sc = arena('earl', 600); p = sc.player;
check(sc.radar, 'EARL: Ear Radar is on while he\'s playing');
var rab = dummy(sc, 'rabbit', 650, 500), cat = dummy(sc, 'cat', 650, 500);
cat.x = 2000; press('KeyF', 25); var onRabbit = rab.maxHp - rab.hp;
rab.x = 2000; cat.x = 650; press('KeyF', 25); var onCat = cat.maxHp - cat.hp;
check(onRabbit > onCat * 1.3, 'EARL: extra damage to rabbits (' + onRabbit.toFixed(1) + ' vs ' + onCat.toFixed(1) + ')');

sc = arena('drowsy', 600); p = sc.player; p.hp = 60;
key('KeyS', true); frames(60 * 3);
var napped = p.napping, healed = p.hp > 65;
var before = p.hp; p.takeHit({ dmg: 10, kbx: 0, kby: 0, stun: 0.2, from: { x: 700 } }, sc);
key('KeyS', false); frames(5);
check(napped && healed && before - p.hp > 15, 'DROWSY: Power Nap heals, but a hit while asleep hurts double');
sc = arena('drowsy', 1015); p = sc.player; frames(5);
key('KeyW', true); frames(90); key('KeyW', false); frames(30);
check(p.y <= 362 + 1 && p.onGround, 'DROWSY: climbs the post of a wooden stand onto it');

sc = arena('bins', 600); p = sc.player;
p.x = 40; sc.camX = 0; p.y = 300; p.vy = 0; p.onGround = false;
key('KeyA', true); frames(12); var clinging = p.cling === -1 && p.vy <= 70;
key('KeyW', true); frames(2); key('KeyW', false); key('KeyA', false); frames(4);
check(clinging && p.vx > 200, 'BINS: wall cling, then a wall jump');

sc = arena('deadfred', 600); p = sc.player;
check(p.takeHit({ dmg: 20, kbx: 0, kby: 0, stun: 0.1, poison: true }, sc) === 'miss' && p.hp === p.maxHp, 'DEAD FRED: poison doesn\'t hurt him');
done('roster');
