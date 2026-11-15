// Milestone 4: the pouch. Joeys (helping by themselves, the JOEY button, the rescue, levels)
// and the pouch slot (saves what you don't need; POUCH uses it), in the campaign, duels and Wi-Fi.
function arena(cid, x) {
  MG.Engine.setScene(new MG.CampaignScene({ charId: cid, level: 0 }));
  var sc = scene();
  sc.enemies = []; sc.crates = []; sc.pickups = []; sc.boss = null;
  sc.gates.forEach(function (g) { g.opened = true; });
  sc.player.x = x || 600; sc.player.facing = 1;
  sc.t = 5;
  frames(5);
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
localStorage.clear();

// ---- who carries their joey where (the owner: go by the names)
var mums = MG.CHARACTERS.filter(function (c) { return c.joey !== 'back'; }).map(function (c) { return c.id; }).sort().join();
check(mums === 'bins,chompers,paddles,tank,zip', 'mums with a pouch: Tank, Chompers, Zip, Paddles, Bins');
check(MG.charById('tank').joey === 'backPouch' && MG.charById('chompers').joey === 'backPouch', 'wombat and devil pouches face backwards');
check(['boomer', 'stinker', 'benny', 'earl', 'deadfred', 'drowsy', 'stripes'].every(function (id) { return MG.charById(id).joey === 'back'; }), 'the boys (and Stripes the numbat) carry their joey on the back');

// ---- the joey helps by itself: nips a pest that's close
var sc = arena('boomer'), p = sc.player;
var pig = dummy(sc, 'pig', 720, 300);
for (var i = 0; i < 60 * 4 && pig.hp === pig.maxHp; i++) frames(1);
check(pig.hp < pig.maxHp, 'the joey hops out and nips a pest that comes close');
for (i = 0; i < 60 * 4 && p.joey.state !== 'home'; i++) frames(1);
check(p.joey.state === 'home' && !p.joey.ready, '...then hops back and rests (cooldown)');

// ---- and fetches a pickup
sc = arena('zip'); p = sc.player; p.hp = 40;
var heart = new MG.Pickup('heart', 760, MG.GROUND_Y); sc.pickups.push(heart);
for (i = 0; i < 60 * 6 && !heart.taken; i++) frames(1);
check(heart.taken && p.hp > 40 && Math.abs(p.x - 600) < 5, 'the joey fetches a pickup and brings it over (Zip stays put)');

// ---- the JOEY button: a Joey Rush, sharing the same cooldown
sc = arena('tank'); p = sc.player;
pig = dummy(sc, 'pig', 900, 300);
p.joey.cool = 0;
press('KeyQ', 1);
check(p.joey.state === 'out' && p.joey.job === 'rush', 'Q sends the joey on a Joey Rush');
for (i = 0; i < 60 * 3 && pig.hp === pig.maxHp; i++) frames(1);
var rushDmg = pig.maxHp - pig.hp;
check(rushDmg >= 9, 'the Joey Rush hits a pest 300 px away (' + rushDmg.toFixed(1) + ')');
press('KeyQ', 1);
check(p.joey.job === 'rush' && p.joey.state !== 'out' || !p.joey.ready, 'pressing again straight away does nothing (the joey needs a rest)');

// ---- once per map: the rescue
sc = arena('boomer'); p = sc.player;
p.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(5);
check(p.state !== 'ko' && Math.abs(p.hp - p.maxHp * 0.4) < 1, 'knocked out? JOEY TO THE RESCUE: back up with 40% health');
p.invuln = 0; p.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(5);
check(p.state === 'ko', '...but only once per map');
sc = new MG.CampaignScene({ charId: 'boomer', level: 0 }); MG.Engine.setScene(sc); frames(2);
sc.checkpoint = 2000; sc.player.joey.rescueUsed = true; sc.player.pouch = 'tea';
sc.player.invuln = 0; sc.player.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(150);
menuItem(sc.menu, 'Continue from Checkpoint').act(); frames(2);
check(sc.player.joey.rescueUsed && sc.player.pouch === 'tea', 'continuing from a checkpoint keeps the pouch, and the rescue stays used');

// ---- the joey grows each map
localStorage.clear();
check(MG.joeyLevel('chompers') === 1, 'joeys start at level 1');
sc = arena('chompers'); sc.boss = null; sc.player.x = sc.goalX; frames(5);
check(sc.state === 'won' && MG.joeyLevel('chompers') === 2 && /JOEY GREW/.test((sc.joeyGrew || []).join()), 'clearing a map: CHOMPERS\'S JOEY GREW! (level 2)');
for (i = 0; i < 6; i++) MG.growJoey('chompers');
check(MG.joeyLevel('chompers') === MG.JOEY_MAX_LEVEL, 'joeys top out at level ' + MG.JOEY_MAX_LEVEL);
sc = arena('chompers');
check(sc.player.joey.level === MG.JOEY_MAX_LEVEL, 'a grown joey keeps its level next time (saved in the browser)');
pig = dummy(sc, 'pig', 900, 500); sc.player.joey.cool = 0; press('KeyQ', 1);
for (i = 0; i < 60 * 3 && pig.hp === pig.maxHp; i++) frames(1);
check(pig.maxHp - pig.hp > rushDmg * 1.5, 'a level-5 joey hits much harder (' + (pig.maxHp - pig.hp).toFixed(1) + ')');

// ---- duels: fair joeys, no rescue
MG.Engine.setScene(new MG.DuelScene({ stage: 0, players: [{ id: 0, cid: 'chompers', local: 'P1' }, { id: 1, cid: 'zip', local: 'P2' }] }));
var d = scene(), da = d.slots[0].f, db = d.slots[1].f;
check(da.joey.level === 1 && db.joey.level === 1 && !da.pouch, 'duels: every joey is level 1 and pouches start empty');
frames(150);
db.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, d); frames(2);
check(db.state === 'ko' && d.state === 'roundEnd', 'duels: no joey rescue');

// ---- the pouch saves what you don't need right now
sc = arena('bins'); p = sc.player; p.joey.cool = 99;
sc.pickups.push(new MG.Pickup('heart', p.x, MG.GROUND_Y)); frames(3);
check(p.pouch === 'heart' && p.hp === p.maxHp, 'a heart at full health goes in the pouch');
p.hp = 50; press('KeyT', 2);
check(p.pouch === null && p.hp === 90, 'T uses it: +40 HP');
p.powerUp('tea');
sc.pickups.push(new MG.Pickup('shield', p.x, MG.GROUND_Y)); frames(3);
check(p.pouch === 'shield' && !p.powers.shield, 'a power-up while another is running goes in the pouch');
sc.pickups.push(new MG.Pickup('super', p.x, MG.GROUND_Y)); frames(3);
check(p.pouch === 'shield' && p.powers.super, 'with the pouch full, a pickup works straight away');
sc.pickups.push(new MG.Pickup('grenades', p.x, MG.GROUND_Y)); frames(3);
check(p.pouch === 'shield' && p.grenades === MG.START_GRENADES + 2, 'grenades are never saved in the pouch');
press('KeyT', 2);
check(p.powers.shield > 0 && !p.pouch, 'T uses a saved power-up');
p.pouch = null; press('KeyT', 2);
check(!p.pouch, 'an empty pouch just says so');
var d2 = new MG.DuelScene({ stage: 0, players: [{ id: 0, cid: 'bins', local: 'P1' }, { id: 1, cid: 'tank', local: 'P2' }] });
MG.Engine.setScene(d2); frames(150);
var f1 = d2.slots[0].f; f1.powerUp('tea'); d2.pickups.push(new MG.Pickup('super', f1.x, MG.GROUND_Y)); frames(3);
check(f1.pouch === 'super', 'duels: supply drops can fill the pouch too');

// ---- controls everywhere: keys, player 2, gamepad, touch, key strip and the Controls page
check(MG.Controls.P1.joey.indexOf('KeyQ') >= 0 && MG.Controls.P1.pouch.indexOf('KeyT') >= 0, 'player 1: Q = joey, T = pouch');
check(MG.Controls.P2.joey.indexOf('BracketLeft') >= 0 && MG.Controls.P2.pouch.indexOf('BracketRight') >= 0, 'player 2: [ = joey, ] = pouch');
check(MG.Controls.P1.joey.indexOf('Pad0Back') >= 0 && MG.Controls.P1.pouch.indexOf('Pad0RT') >= 0 && MG.Controls.P1.shoot.indexOf('Pad0R') >= 0, 'gamepad: Back = joey, RT = pouch, RB = shoot');
var ids = MG.Touch.buttons.map(function (b) { return b.id; });
check(ids.indexOf('Joey') >= 0 && ids.indexOf('Pouch') >= 0, 'phones: JOEY and POUCH touch buttons');
sc = arena('earl'); p = sc.player; dummy(sc, 'pig', 800, 300); p.joey.cool = 0;
MG.Input.pressed.TouchJoey = true; frames(2);
check(p.joey.job === 'rush', 'the JOEY touch button sends the joey');
var texts = [];
var realText = MG.UI.text;
MG.UI.text = function (c, str) { texts.push(String(str)); return realText.apply(this, arguments); };
MG.UI.keyStrip(MG.Engine.ctx, p, 0, {}); MG.UI.controlsPanel(MG.Engine.ctx);
MG.UI.text = realText;
check(texts.indexOf('joey Lv' + p.joey.level) >= 0 && texts.indexOf('pouch') >= 0, 'the key-hint strip shows the joey (with its level) and the pouch');
check(texts.some(function (t) { return /^Joey/.test(t); }) && texts.some(function (t) { return /^Pouch/.test(t); }), 'Pause > Controls lists Joey and Pouch');

// ---- every joey draws: in the pouch, on the back, out hopping
var err = null;
MG.CHARACTERS.forEach(function (c) {
  try {
    var s = arena(c.id), f = s.player;
    f.draw(MG.Engine.ctx, s);
    f.joey.launch('nip', null); frames(5); f.draw(MG.Engine.ctx, s);
  } catch (e) { if (!err) err = c.id + ': ' + e; }
});
check(!err, 'every character\'s joey draws at home and out hopping' + (err ? ' ' + err : ''));

// ---- Wi-Fi: the buttons are sent, and friends see the joey and the pouch
var realSend = MG.Net.send; MG.Net.send = function () { return true; };
MG.Net.role = 'host'; MG.Net.status = 'connected'; MG.Net.token = 'h'; MG.Net.lastHeard = performance.now();
MG.Engine.setScene(new MG.CampaignScene({ level: 0, net: true, players: [{ id: 0, cid: 'boomer', local: null }, { id: 1, cid: 'zip', local: null }] }));
sc = scene(); frames(5);
var guestF = sc.slots[1].f; guestF.joey.cool = 0; guestF.pouch = 'heart'; guestF.hp = 20;
sc.netInput(1, { n: 1, l: 0, r: 0, d: 0, p: ['joeyP', 'pouchP'] }); frames(2);
check(guestF.joey.job === 'rush' && !guestF.pouch && guestF.hp === 60, 'Wi-Fi: a friend\'s JOEY and POUCH presses work');
var snap = JSON.parse(JSON.stringify(MG.Sync.snapshot(sc)));
var me = snap.pl.find(function (q) { return q.id === 1; });
check(Array.isArray(me.jy) && me.jy[2] === 1, 'Wi-Fi updates include where the joey is');
var guest = new MG.RemoteScene({ level: 0 }); MG.Net.id = 1;
err = null;
try { guest.onNet(snap); guest.update(1 / 30); guest.draw(MG.Engine.ctx); } catch (e) { err = '' + e; }
check(!err, 'the friend\'s screen draws the joey' + (err ? ': ' + err : ''));
MG.Net.send = realSend; MG.Net.role = null; MG.Net.status = 'off'; MG.Net.token = null; MG.Net.onMessage = null;
done('joey');
