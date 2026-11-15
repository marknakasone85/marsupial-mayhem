// Milestone 1: Boomer's moves, Tail Counter, Boomer Bound, the kick grenade, the gatling,
// power-ups, and how each pest behaves.

// An empty test arena: the first map with everything removed except what a test adds.
function arena(x) {
  MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0 }));
  var sc = scene();
  sc.enemies = []; sc.crates = []; sc.pickups = []; sc.boss = null;
  sc.gates.forEach(function (g) { g.opened = true; });
  sc.player.x = x || 600;
  sc.t = 5; // skip the title card
  frames(30);
  return sc;
}
// A pest that stands still (so hits can be measured).
function dummy(sc, type, x, hp) {
  var e = sc.addEnemy(type, x);
  e.think = function () { this.vx = 0; };
  e.hidden = false;
  if (hp) e.hp = e.maxHp = hp;
  sc.enemies.push(e);
  return e;
}
function press(code, n) { key(code, true); frames(1); key(code, false); frames(n === undefined ? 20 : n); }
function hold(code, n) { key(code, true); frames(n); key(code, false); frames(1); }
var P = MG.charById('boomer').power;

// ---- jabs: jab, jab, then a hook
var sc = arena(600), p = sc.player;
p.facing = 1;
var d = dummy(sc, 'rabbit', 650, 500);
var hp0 = d.hp; press('KeyF', 18); var j1 = hp0 - d.hp;
hp0 = d.hp; press('KeyF', 18); var j2 = hp0 - d.hp;
hp0 = d.hp; press('KeyF', 30); var j3 = hp0 - d.hp;
check(Math.abs(j1 - 6 * P) < 0.5 && Math.abs(j2 - 6 * P) < 0.5, 'jabs hit for ' + j1.toFixed(1) + ' and ' + j2.toFixed(1));
check(Math.abs(j3 - 10 * P) < 0.5, 'the third punch is a harder hook (' + j3.toFixed(1) + ')');
// mashing attack queues punches, so a quick 1-2-3 all land
frames(40); d.x = 650; d.vx = 0; p.x = 600; frames(2);
hp0 = d.hp; press('KeyF', 5); press('KeyF', 5); press('KeyF', 5); press('KeyF', 50);
check(hp0 - d.hp > 20 * P, 'mashing attack lands a quick jab-jab-hook (' + (hp0 - d.hp).toFixed(1) + ')');

// ---- tail kick: big damage and knockback
sc = arena(600); p = sc.player; p.facing = 1;
d = dummy(sc, 'pig', 680, 500);
hp0 = d.hp; key('KeyE', true); frames(1); key('KeyE', false);
var maxVx = 0; for (var i = 0; i < 30; i++) { frames(1); maxVx = Math.max(maxVx, Math.abs(d.vx)); }
check(Math.abs((hp0 - d.hp) - 16 * P) < 0.5, 'tail kick hits for ' + (hp0 - d.hp).toFixed(1));
check(maxVx > 400, 'tail kick sends a pig flying (speed ' + Math.round(maxVx) + ')');

// ---- Tail Counter: block a charging pig and Boomer kicks back by himself
sc = arena(600); p = sc.player; p.facing = 1;
var pig = sc.addEnemy('pig', 900); pig.cool = 0; sc.enemies.push(pig);
key('KeyS', true);
var countered = false, hurt = false;
for (i = 0; i < 240 && !countered; i++) {
  frames(1);
  if (p.move && p.move.counter) countered = true;
  if (p.state === 'hurt') hurt = true;
}
key('KeyS', false);
frames(30);
check(countered && !hurt, 'Tail Counter: a blocked charge is answered with an automatic tail kick');
check(pig.hp < pig.maxHp, 'the counter kick hurts the pig');

// ---- Boomer Bound: needs a full bar, leaps high, lands with a ground pound
sc = arena(300); p = sc.player; p.facing = 1;
p.meter = 40; press('KeyH', 5);
check(!p.move || p.move.kind !== 'special', 'no special without a full blue bar');
var rs = [dummy(sc, 'rabbit', 690), dummy(sc, 'rabbit', 760), dummy(sc, 'rabbit', 920)];
p.meter = 100; key('KeyH', true); frames(1); key('KeyH', false);
var spent = p.meter < 10;
var top = p.y; for (i = 0; i < 120; i++) { frames(1); top = Math.min(top, p.y); }
check(MG.GROUND_Y - top > 250, 'Boomer Bound leaps high (' + Math.round(MG.GROUND_Y - top) + ' px)');
check(spent && rs.filter(function (r) { return r.hp < r.maxHp || !r.alive; }).length >= 2, 'the landing ground pound flattens nearby rabbits');

// ---- huge bounding jumps, smaller hop if you let go early
sc = arena(600); p = sc.player;
key('KeyW', true); top = p.y; for (i = 0; i < 40; i++) { frames(1); top = Math.min(top, p.y); } key('KeyW', false); frames(40);
var bigJump = MG.GROUND_Y - top;
press('KeyW', 0); top = p.y; for (i = 0; i < 40; i++) { frames(1); top = Math.min(top, p.y); } frames(30);
check(bigJump > 230, 'holding jump: a huge bound (' + Math.round(bigJump) + ' px)');
check(MG.GROUND_Y - top < bigJump - 60, 'tapping jump: a smaller hop (' + Math.round(MG.GROUND_Y - top) + ' px)');

// ---- the kick grenade: pull the pin and drop it, then kick it
sc = arena(600); p = sc.player; p.facing = 1;
check(p.grenades === MG.START_GRENADES, 'Boomer starts with ' + MG.START_GRENADES + ' grenades');
press('KeyG', 25);
check(p.grenades === MG.START_GRENADES - 1 && sc.grenades.length === 1, 'G pulls the pin and drops a grenade');
var g = sc.grenades[0], gx0 = g.x;
check(Math.abs(g.x - p.x) < 70 && g.fuse > 2, 'it lands at Boomer\'s feet with a few seconds on the fuse');
press('KeyE', 5);
check(g.vx > 900, 'big attack kicks it long (kangaroos kick furthest: speed ' + Math.round(g.vx) + ')');
for (i = 0; i < 200 && !g.dead; i++) frames(1);
check(g.dead && g.x - gx0 > 300, 'the kicked grenade flies ' + Math.round(g.x - gx0) + ' px and explodes');
// a kicked grenade that hits a pest in the air goes off right away and knocks it out
sc = arena(600); p = sc.player; p.facing = 1;
var target = dummy(sc, 'pig', 820);
press('KeyG', 25); g = sc.grenades[0]; press('KeyF', 1);
for (i = 0; i < 60 && !g.dead; i++) frames(1);
check(g.dead && g.fuse > 1 && target.hp < target.maxHp, 'a kicked grenade blows up on the pest it hits');
// the blast never hurts players
sc = arena(600); p = sc.player; p.facing = 1;
var hpBefore = p.hp;
press('KeyG', 25);
for (i = 0; i < 260 && sc.grenades.length; i++) frames(1);
check(sc.grenades.length === 0 && p.hp === hpBefore, 'standing on your own grenade only bounces you');
p.grenades = 0; press('KeyG', 25);
check(sc.grenades.length === 0, 'no grenades left: G does nothing (and says so)');
// any player can kick any grenade, and crates break in the blast
sc = arena(600); p = sc.player; p.facing = 1;
var crate = new MG.Crate(1010, 'grenades'); sc.crates.push(crate);
press('KeyG', 25); press('KeyF', 1);
for (i = 0; i < 240 && sc.grenades.length; i++) frames(1);
check(!crate.alive && sc.pickups.some(function (k) { return k.type === 'grenades'; }), 'grenade blasts smash crates (which drop more grenades)');

// ---- the gumnut gatling: a weapon pickup, hold R to fire
sc = arena(600); p = sc.player; p.facing = 1;
hold('KeyR', 20);
check(sc.projectiles.length === 0, 'no weapon: R just clicks');
sc.pickups.push(new MG.Pickup('gatling', 620, MG.GROUND_Y)); frames(5);
check(p.weapon && p.weapon.ammo === 100, 'picking up the GUMNUT GATLING gives 100 gumnuts');
var r = dummy(sc, 'rabbit', 850);
key('KeyR', true); var shots = 0; for (i = 0; i < 40; i++) { frames(1); shots = Math.max(shots, sc.projectiles.length); } key('KeyR', false);
check(p.weapon.ammo < 100 - 9 && shots > 3, 'holding R sprays gumnuts (' + (100 - p.weapon.ammo) + ' fired)');
check(!r.alive, 'gumnuts knock out a rabbit');
p.weapon.ammo = 1; hold('KeyR', 10);
check(p.weapon === null, 'out of gumnuts: the gatling is gone');

// ---- power-ups
sc = arena(600); p = sc.player; p.facing = 1;
d = dummy(sc, 'pig', 650, 500);
p.powerUp('super'); hp0 = d.hp; press('KeyF', 20);
check(Math.abs((hp0 - d.hp) - 12 * P) < 0.6, 'SUPER WALLOP doubles damage');
p.powerUp('shield'); hpBefore = p.hp;
p.takeHit({ dmg: 20, kbx: 100, kby: -100, stun: 0.3, from: d }, sc);
check(p.hp === hpBefore, 'GUMLEAF SHIELD blocks hits');
sc = arena(600); p = sc.player;
hold('KeyD', 40); var plain = p.x;
sc = arena(600); p = sc.player; p.powerUp('tea');
hold('KeyD', 40);
check(p.x - 600 > (plain - 600) * 1.25, 'BILLY TEA RUSH makes Boomer faster');

// ---- rabbits eat power-ups they find
sc = arena(300); p = sc.player;
var orb = new MG.Pickup('shield', 900, MG.GROUND_Y); sc.pickups.push(orb);
var bunny = sc.addEnemy('rabbit', 1000); sc.enemies.push(bunny);
sc.camX = 400;
for (i = 0; i < 240 && !orb.taken; i++) { p.x = 300; frames(1); }
check(orb.taken && !p.powers.shield, 'a rabbit hops over and eats the power-up');

// ---- feral cats hide in long grass, then pounce
sc = arena(500); p = sc.player;
var cat = sc.addEnemy('cat', 900); sc.enemies.push(cat);
frames(60);
check(cat.hidden, 'a cat hides (only its eyes show)');
var catSeen = false;
for (i = 0; i < 90; i++) { p.x = Math.min(760, p.x + 6); frames(1); if (cat.state === 'pounce') catSeen = true; }
check(!cat.hidden && catSeen, 'walk close and it leaps out at you');

// ---- feral pigs snort, then charge
sc = arena(500); p = sc.player;
pig = sc.addEnemy('pig', 850); pig.cool = 0; sc.enemies.push(pig);
var charged = false;
for (i = 0; i < 150; i++) { frames(1); if (pig.state === 'charge') charged = true; }
check(charged, 'a pig snorts "!" then charges');

// ---- punches and kicks feel different (players asked for punch and kick, 15 Nov 2026)
function blows(cid, fn) {
  MG.Engine.setScene(new MG.CampaignScene({ charId: cid, level: 0 }));
  var s = scene();
  s.enemies = []; s.crates = []; s.pickups = []; s.boss = null;
  s.gates.forEach(function (g) { g.opened = true; });
  s.player.x = 600; s.player.facing = 1; s.t = 5;
  frames(30);
  var d = dummy(s, 'pig', 650, 900), log = [];
  var fx = s.fx, realI = fx.impact, realD = fx.dust, realT = fx.hitText, realJ = MG.Audio.jab, realK = MG.Audio.kick, realF = MG.Engine.freeze;
  fx.impact = function (x, y, kind, dir, heavy) { log.push('impact:' + kind + (heavy ? '!' : '')); return realI.apply(this, arguments); };
  fx.dust = function () { log.push('dust'); return realD.apply(this, arguments); };
  fx.hitText = function (x, y, big, kind) { log.push('words:' + kind); return realT.apply(this, arguments); };
  MG.Audio.jab = function (heavy) { log.push(heavy ? 'snap!' : 'snap'); };
  MG.Audio.kick = function () { log.push('thud'); };
  MG.Engine.freeze = function (t) { log.push('freeze:' + t); return realF.apply(this, arguments); };
  fn(s, d);
  fx.impact = realI; fx.dust = realD; fx.hitText = realT; MG.Audio.jab = realJ; MG.Audio.kick = realK; MG.Engine.freeze = realF;
  return log;
}
var lp = blows('boomer', function () { press('KeyF', 12); });
check(lp.indexOf('impact:punch') >= 0 && lp.indexOf('words:punch') >= 0 && lp.indexOf('snap') >= 0 && lp.indexOf('freeze:0.035') >= 0 && lp.indexOf('dust') < 0,
  'a punch: a quick white star, punch words, a crisp snap and the shortest pause: ' + lp.join(' '));
var lh = blows('boomer', function (s, d) { [18, 18, 30].forEach(function (n) { d.x = s.player.x + 50; d.vx = 0; press('KeyF', n); }); });
check(lh.indexOf('impact:punch!') >= 0 && lh.indexOf('words:hook') >= 0 && lh.indexOf('snap!') >= 0 && lh.indexOf('freeze:0.055') >= 0,
  'the combo\'s third punch (the hook) lands harder: a bigger star, its own words, a fuller smack: ' + lh.join(' '));
var lk = blows('tank', function () { press('KeyE', 30); });
check(lk.indexOf('impact:kick') >= 0 && lk.indexOf('words:kick') >= 0 && lk.indexOf('thud') >= 0 && lk.indexOf('dust') >= 0 && lk.indexOf('freeze:0.1') >= 0,
  'a kick (Tank\'s too): a golden burst with a shock arc, kick words, a deep thud, dust from the planted foot and a longer pause: ' + lk.join(' '));
var ls = blows('bins', function (s) { s.player.meter = MG.SPECIAL_COST; press('KeyH', 90); });
check(ls.join(' ').indexOf('impact') < 0, 'specials keep their own look (no punch or kick star)');
// the effects themselves: they show for a split second, draw both kinds, and the dust puffs grow
var fx = new MG.FX(), dc = 0;
fx.impact(100, 200, 'punch', 1, false); fx.impact(120, 200, 'kick', -1, false); fx.impact(140, 200, 'punch', 1, true); fx.dust(100, 470, -1, 6);
var cx = new Proxy({}, { get: function (t, k) { if (k in t) return t[k]; if (k === 'fill' || k === 'stroke') return function () { dc++; }; return noop; }, set: function (t, k, v) { t[k] = v; return true; } });
fx.draw(cx);
var puff0 = fx.parts[0].size;
fx.update(0.1);
check(fx.impacts.length === 3 && dc >= 10 && fx.parts.length === 6 && fx.parts[0].size > puff0 && fx.parts.every(function (q) { return q.kind === 'puff' && q.vx < 0; }),
  'the stars and the shock arc draw, and the dust puffs drift back and grow');
fx.update(0.15);
check(fx.impacts.length === 0, '...and the stars are gone in a fifth of a second');
// Wi-Fi friends see and hear them too
var gfx = new MG.FX();
MG.Sync.replay(gfx, { fx: [['impact', [300, 250, 'kick', 1, false]], ['dust', [280, 470, -1, 5]], ['hitText', [300, 220, true, 'kick']]], au: [] });
check(gfx.impacts && gfx.impacts.length === 1 && gfx.parts.length === 5 && gfx.texts.length === 1, 'a Wi-Fi friend replays the kick\'s burst, dust and words');

// ---- hints name the player's own keys (never a fixed letter)
check(MG.UI.fillKeys('Press {grenade} to drop a grenade') === 'Press G to drop a grenade', 'the first map\'s tip says G with the standard keys');
MG.Keys.set('P1', 'grenade', 'KeyZ');
var changed = MG.UI.fillKeys('Press {grenade}');
MG.Keys.reset();
var lastDev = MG.Input.lastDevice;
MG.Input.lastDevice = 'pad'; var padTip = MG.UI.fillKeys('Press {grenade}');
MG.Input.lastDevice = 'arrows'; var arrowTip = MG.UI.fillKeys('{attack} {big} {grenade}');
MG.Input.lastDevice = lastDev;
check(changed === 'Press Z' && padTip === 'Press LT' && arrowTip === 'J K ' + MG.Keys.label('P2', 'grenade'), '...the key chosen in Settings, LT on a gamepad, and the solo arrow keys');
check(MG.LEVELS.every(function (L) { return ![L.tip, L.tipTouch].some(function (t) { return t && /\bPress [A-Z0-9]\b/.test(t); }); }) && /\{grenade\}/.test(MG.LEVELS[0].tip),
  'no map tip names a fixed key');
done('boomer');
