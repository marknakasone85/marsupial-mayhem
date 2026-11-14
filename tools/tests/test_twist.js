// Milestone 7: worlds 4-7, the twist, new pests, reptiles, bosses, CPU champions, the Hypnotic Grin,
// the secret characters (Ghost, Cousin Cuscus) and Benny's Isle of Man bonus map.
function fresh() { localStorage.clear(); }
function lv(id) { return MG.LEVELS.findIndex(function (L) { return L.id === id; }); }
function arena(id, cid, x) {
  MG.Engine.setScene(new MG.CampaignScene({ charId: cid || 'boomer', level: lv(id) }));
  var sc = scene();
  sc.enemies = []; sc.crates = []; sc.pickups = []; sc.coins = []; sc.npcs = []; sc.boss = null; sc.allies = [];
  sc.gates.forEach(function (g) { g.opened = true; });
  sc.player.x = x || 600; sc.player.facing = 1; if (sc.player.joey) sc.player.joey.cool = 99;
  sc.camX = Math.max(0, (x || 600) - 300); sc.t = 5;
  frames(3);
  return sc;
}
function dummy(sc, type, x, hp, still) {
  var e = sc.addEnemy(type, x); e.hidden = false;
  if (still) e.think = function () { this.vx = 0; };
  if (hp) e.hp = e.maxHp = hp; sc.enemies.push(e); return e;
}
function press(code, n) { key(code, true); frames(1); key(code, false); frames(n === undefined ? 2 : n); }
fresh();

// ---- the maps and the map's branches
var NEW = ['alps-1', 'alps-2', 'alps-3', 'city-1', 'city-2', 'city-3', 'city-4', 'rift-1', 'rift-2', 'rift-3', 'grin-1', 'grin-2', 'grin-3', 'grin-4', 'iom-1'];
check(NEW.every(function (id) { return lv(id) > 10; }) && MG.LEVELS.length === 26, '15 new maps appended (26 in all): Tasmania & the Alps 3, the City 4, the Time Rift 3, Grin Isle 4, and a secret bonus map');
check(['quollChamp', 'foxyRoxy', 'diprotodon', 'thylacoleo', 'procoptodon', 'grandGrinner', 'crocEmperor'].every(function (b) { return MG.LEVELS.some(function (L) { return L.boss && L.boss.type === b; }); }),
  'bosses: the quoll champion, Foxy Roxy, Diprotodon, the marsupial lion, Procoptodon, the Grand Grinner and the Croc Emperor');
check(!MG.LEVELS.slice(lv('alps-1'), lv('alps-3') + 1).some(function (L) { return L.enemies.some(function (e) { return e.type === 'fox'; }); }), 'no foxes in Tasmania (true: they never settled there)');
NEW.forEach(function (id) { MG.Progress.clear(id); }); fresh();
MG.Progress.clear('city-4');
check(MG.Progress.isOpen(lv('rift-1')) && MG.Progress.isOpen(lv('grin-1')) && !MG.Progress.isOpen(lv('grin-2')), 'clearing the City opens both the Time Rift (bonus) and Grin Isle');
check(!MG.Progress.isOpen(lv('iom-1')), 'the Isle of Man is a secret...');
MG.Progress.clear('outback-1');
Object.keys(MG.STORY).forEach(function (id) { MG.Story.markSeen(id); });
MG.Engine.setScene(new MG.WorldMapScene({ players: [{ id: 0, cid: 'benny', local: 'SOLO' }] })); frames(3);
check(MG.Unlocks.has('isleofman') && MG.Progress.isOpen(lv('iom-1')), '...until Benny walks the world map: then it\'s open');
var mapErr = null; try { scene().draw(MG.Engine.ctx); } catch (e) { mapErr = '' + e; }
check(!mapErr, 'the world map draws with every world' + (mapErr ? ': ' + mapErr : ''));

// ---- the Hypnotic Grin
function grinTest(face, block) {
  var sc = arena('grin-1', 'zip', 600), p = sc.player;
  var q = dummy(sc, 'quokkaMinion', 760, 500);
  q.think = function (dt, world, player, dx, dist) { this.state = 'grin'; this.stateT = 0; this.vx = 0; for (var i = 0; i < world.fighters.length; i++) { var f = world.fighters[i]; var facing = (this.x - f.x) * f.facing > 0; if (facing && f.state !== 'block') f.hypnotise(dt, world); } };
  p.facing = face; p.autoFace = false;
  if (block) key('KeyS', true);
  for (var i = 0; i < 90; i++) { p.facing = face; frames(1); }
  if (block) key('KeyS', false);
  return p;
}
var p = grinTest(1, false);
check(p.dizzyT > 0, 'look at a quokka\'s Hypnotic Grin too long and you\'re HYPNOTISED (dizzy)');
var sc = scene(), target = dummy(sc, 'rabbit', p.x + 40, 50, true);
press('KeyF', 5);
check(target.hp === 50 && p.state !== 'attack', 'dizzy: you can\'t attack for a moment');
check(grinTest(-1, false).dizzyT <= 0, 'turn away and it can\'t get you');
check(grinTest(1, true).dizzyT <= 0, '...or block');

// ---- native animals tricked by the quokkas
sc = arena('alps-1', 'boomer', 500);
var pad = dummy(sc, 'pademelon', 560, 1, true);
press('KeyF', 6);
check(!pad.alive && pad.fleeing && sc.coins.length > 0, 'a hypnotised pademelon knocked out snaps out of it and runs off (no blood), coins and all');
sc = arena('alps-1', 'boomer', 500);
var pad2 = dummy(sc, 'pademelon', 800, 200);
var before = sc.enemies.length; frames(80);
check(sc.enemies.filter(function (e) { return e.type === 'pademelon'; }).length > 1, 'pademelons thump a hind foot to call for help');

// ---- reptiles
sc = arena('grin-1', 'boomer', 500);
var frill = dummy(sc, 'frilledLizard', 570, 200); frill.think = function () { this.vx = 0; this.state = 'frill'; this.facing = -1; };
frames(2); press('KeyF', 40);
check(frill.hp === 200, 'a frilled lizard with its frill up blocks punches from the front');
press('KeyE', 30);
check(frill.hp < 200, '...but not a big attack');
sc = arena('grin-1', 'boomer', 500);
var thorny = dummy(sc, 'thornyDevil', 560, 200, true);
var hp0 = sc.player.hp; press('KeyF', 10);
check(sc.player.hp < hp0 && thorny.hp < 200, 'punching a thorny devil hurts (it\'s covered in thorns)');
sc = arena('grin-1', 'boomer', 500); thorny = dummy(sc, 'thornyDevil', 570, 200, true);
hp0 = sc.player.hp; press('KeyE', 30);
check(sc.player.hp === hp0 && thorny.hp < 200, '...so kick it instead');
sc = arena('grin-2', 'boomer', 500);
var lace = dummy(sc, 'laceMonitor', 800, 200); lace.y = 230; frames(5);
check(lace.clinging && lace.y === 230, 'a lace monitor waits up a tree...');
sc.player.x = 790; for (var i = 0; i < 90 && lace.y < MG.GROUND_Y; i++) frames(1);
check(!lace.clinging && lace.y === MG.GROUND_Y, '...and drops on you');
['boomer', 'deadfred'].forEach(function (cid) {
  var s = arena('grin-2', cid, 600);
  var snake = dummy(s, 'taipan', 680, 200); snake.cool = 0;
  var h0 = s.player.hp; frames(120);
  check(cid === 'deadfred' ? s.player.hp === h0 : s.player.hp < h0, cid === 'deadfred' ? 'Dead Fred shrugs off the taipan\'s venom' : 'an inland taipan darts in and strikes (venom)');
});
sc = arena('grin-2', 'boomer', 600);
var adder = dummy(sc, 'deathAdder', 700, 200); adder.cool = 0;
hp0 = sc.player.hp; frames(60);
check(sc.player.hp === hp0 && adder.pose()[0] === 'lure', 'a death adder lies still, wiggling its tail like a grub...');
sc.player.x = 640; for (i = 0; i < 90 && sc.player.hp === hp0; i++) frames(1);
check(sc.player.hp < hp0, '...and strikes if you come close');
var croc = dummy(sc, 'crocLand', 900, 300);
check(croc.d.native && croc.d.behavior === 'charger', 'crocodiles charge on land now');

// ---- the bosses
['quollChamp', 'foxyRoxy', 'diprotodon', 'thylacoleo', 'procoptodon', 'grandGrinner', 'crocEmperor'].forEach(function (type) {
  var li = MG.LEVELS.findIndex(function (L) { return L.boss && L.boss.type === type; });
  var s = new MG.CampaignScene({ charId: 'stinker', level: li }); MG.Engine.setScene(s);
  s.enemies = [s.boss]; s.allies = []; s.gates.forEach(function (g) { g.opened = true; });
  s.player.x = s.arenaX + 200; s.camX = s.arenaX; if (s.player.joey) s.player.joey.cool = 9999; frames(5);
  var b = s.boss, err = null, moves = {};
  (b.d.phases ? [].concat.apply([], b.d.phases) : b.d.moves).forEach(function (mv) { moves[mv] = 1; });
  Object.keys(moves).forEach(function (mv) {
    try {
      b.state = mv + 'Wind'; b.stateT = 0; b.hurt = 0; b.onGround = true; b.y = MG.GROUND_Y; b.burrowed = false; b.lurking = false;
      for (var j = 0; j < 150; j++) { frames(1); s.player.hp = s.player.maxHp; s.player.invuln = 0; s.player.dizzyT = 0; if (s.player.state === 'ko') s.player.state = 'idle'; }
      s.draw(MG.Engine.ctx);
    } catch (e) { if (!err) err = mv + ': ' + e; }
  });
  check(!err && s.bossAwake, b.d.name + ' does every move (' + Object.keys(moves).join(', ') + ')' + (err ? ' ERROR ' + err : ''));
  if (type === 'grandGrinner') {
    b.takeHit({ dmg: b.maxHp * 0.4, kbx: 0, kby: 0, big: true, dir: 1 }, s);
    check(b.phase === 1, 'the Grand Grinner calls old friends at two-thirds health...');
    b.state = 'summonWind'; b.stateT = 0; b.hurt = 0; frames(140);
    var echoes = s.enemies.filter(function (e) { return e.echo && e.alive; });
    check(echoes.length >= 2, '...echoes of the old bosses come back for a moment (' + echoes.length + ')');
    frames(60 * 7);
    check(!s.enemies.some(function (e) { return e.echo && e.alive; }), '...and fade away again');
    b.takeHit({ dmg: b.maxHp * 0.3, kbx: 0, kby: 0, big: true, dir: 1 }, s);
    check(b.phase === 2 && b.enraged, '...and at one-third health he DROPS THE SMILE');
  }
  b.burrowed = false; b.lurking = false; b.state = 'idle';
  b.takeHit({ dmg: 99999, kbx: 0, kby: 0, big: true, dir: 1 }, s); frames(5);
  s.player.x = s.goalX; frames(10);
  check(!b.alive && s.state === 'won', b.d.name + ' can be beaten' + (b.d.native ? ' (and, being a native animal, just runs off)' : ''));
});

// ---- CPU champions join forces
fresh();
sc = new MG.CampaignScene({ charId: 'zip', level: lv('grin-1') }); MG.Engine.setScene(sc); frames(3);
check(sc.allies.length === 2 && sc.allies.every(function (f) { return f.isAlly && f.team === 'player'; }), 'on Grin Isle, CPU champions fight beside you (' + sc.allies.map(function (f) { return f.def.name; }).join(', ') + ')');
sc.enemies = []; sc.allies.forEach(function (f, k) { f.x = 700 + k * 40; });
var foe = dummy(sc, 'pig', 820, 300, true);
for (i = 0; i < 400 && foe.hp === 300; i++) frames(1);
check(foe.hp < 300, 'they go for the pests by themselves');
sc.allies[0].takeHit({ dmg: 9999, kbx: 0, kby: 0, stun: 0.1 }, sc); sc.allies[0].invuln = 0; sc.allies[0].takeHit({ dmg: 9999, kbx: 0, kby: 0, stun: 0.1 }, sc);
frames(10);
check(sc.state === 'play', 'a knocked-out champion doesn\'t end the map...');
frames(60 * 7);
check(sc.allies[0].state !== 'ko', '...and is back a few seconds later');

// ---- the story: the twist plays before Grin Isle, the ending after the last map
fresh(); MG.Story.markSeen('opening'); MG.Progress.clear('city-4'); ['tasmania', 'quoll', 'city', 'rift', 'world3done', 'invasion', 'rainforest', 'canefields'].forEach(MG.Story.markSeen.bind(MG.Story));
var map = new MG.WorldMapScene({ players: [{ id: 0, cid: 'boomer', local: 'SOLO' }], at: lv('grin-1') }); MG.Engine.setScene(map); frames(3);
check(map.stops[map.cur] === 'grin-1', 'walk to Grin Isle');
map.choose(); frames(2);
check(scene() instanceof MG.StoryScene && scene().id === 'betrayal', 'the victory party... the betrayal story plays first');
for (var pg = 0; pg < MG.STORY.betrayal.length; pg++) { frames(25); press('Space', 2); }
check(sceneName() === 'Campaign' && scene().L.id === 'grin-1', '...then the map starts');
MG.Progress.clear('grin-4');
check(MG.Story.pending() === 'ending', 'beating the Croc Emperor brings the ending');
var sErr = null;
['tasmania', 'quoll', 'city', 'rift', 'ghost', 'betrayal', 'lair', 'isleofman', 'ending'].forEach(function (id) { (MG.STORY[id] || [null]).forEach(function (pp, k) { try { if (!pp) throw new Error('missing'); MG.Story.drawPanel(MG.Engine.ctx, id, k, 1); } catch (e) { if (!sErr) sErr = id + ': ' + e; } }); });
check(!sErr, 'every new story panel draws' + (sErr ? ' ' + sErr : ''));

// ---- secret characters
fresh();
var sel = new MG.SelectScene({ mode: 'campaign' }); MG.Engine.setScene(sel); frames(2);
sel.cur[0] = MG.CHARACTERS.length; press('Enter', 2);
check(sceneName() === 'Select' && !sel.locked[0], 'Ghost is locked at first');
sc = new MG.CampaignScene({ charId: 'boomer', level: lv('rift-3') }); MG.Engine.setScene(sc);
sc.boss = null; sc.enemies = []; sc.player.x = sc.goalX; frames(10);
check(sc.state === 'won' && MG.Unlocks.has('ghost') && sc.joeyGrew.some(function (t) { return /GHOST IS UNLOCKED/.test(t); }), 'clearing the Time Rift\'s last map unlocks GHOST the thylacine');
sel = new MG.SelectScene({ mode: 'campaign' }); MG.Engine.setScene(sel); frames(2);
sel.cur[0] = MG.CHARACTERS.length; press('Enter', 4);
check(scene() instanceof MG.WorldMapScene || scene() instanceof MG.StoryScene, 'now Ghost can be picked');
check(!MG.Unlocks.has('cuscus'), 'Cousin Cuscus is still a secret...');
sc = arena('rift-2', 'boomer', 1900);
var sloth = new MG.NPC({ kind: 'sloth', x: 2000, y: 262 }); sc.npcs.push(sloth); frames(10);
check(MG.Unlocks.has('cuscus'), '...until you find the sloth who fell through the Time Rift from Sloth Slap');
fresh(); localStorage.setItem('slothslap.best', '{"a":1}');
check(MG.Unlocks.has('cuscus'), 'Sloth Slap saves in the same browser unlock the cousin too (a crossover)');
fresh();
// every move of both secrets
var secErr = null;
MG.SECRETS.forEach(function (def) {
  try {
    var s = arena('outback-2', def.id, 500), f = s.player;
    var d1 = dummy(s, 'pig', 560, 9999, true);
    press('KeyF', 30); press('KeyE', 40); f.meter = 100; press('KeyH', 90);
    if (!(d1.hp < 9999)) secErr = def.id + ' did no damage';
    ['idle', 'walk', 'jump', 'block', 'hurt', 'ko', 'win'].forEach(function (pose) { MG.Art.character(MG.Engine.ctx, def, { x: 100, y: 400, facing: 1, scale: def.scale, t: 1, pose: pose }); });
    MG.Art.portrait(MG.Engine.ctx, def, 100, 100, 24, 1);
    f.draw(MG.Engine.ctx, s);
  } catch (e) { if (!secErr) secErr = def.id + ': ' + e; }
});
check(!secErr, 'Ghost and Cousin Cuscus: every attack, big attack and special hit, and every pose draws' + (secErr ? ' ' + secErr : ''));
sc = arena('outback-2', 'ghost', 500);
hp0 = sc.player.hp; sc.player.takeHit({ dmg: 20, kbx: 0, kby: 0, stun: 0.1 }, sc);
check(sc.player.hp === hp0, 'Ghost\'s trait: a hit passes straight through him (PHASED!)');
sc.player.invuln = 0; sc.player.takeHit({ dmg: 20, kbx: 0, kby: 0, stun: 0.1 }, sc);
check(sc.player.hp < hp0, '...but only every few seconds');
sc = arena('outback-2', 'cuscus', 500);
var pigA = dummy(sc, 'pig', 560, 9999, true); press('KeyF', 30); var normal = 9999 - pigA.hp;
sc = arena('outback-2', 'cuscus', 500);
var pigB = dummy(sc, 'pig', 560, 9999, true); frames(90); press('KeyF', 30); var boosted = 9999 - pigB.hp;
check(boosted > normal * 1.3, 'Cousin Cuscus: stand still for a moment and the next slap is a SUPER SLAP (' + normal.toFixed(1) + ' -> ' + boosted.toFixed(1) + ')');

// ---- Wi-Fi: enemy poses and CPU champions reach friends; a friend's secret character is accepted
var sent = [], realSend = MG.Net.send;
MG.Net.send = function (m, to) { sent.push({ m: m, to: to }); return true; };
MG.Net.role = 'host'; MG.Net.id = 0; MG.Net.status = 'connected'; MG.Net.code = '1234'; MG.Net.token = 'h'; MG.Net.lastHeard = performance.now();
MG.Engine.setScene(new MG.CampaignScene({ level: lv('grin-1'), net: true, players: [{ id: 0, cid: 'boomer', local: 'SOLO' }, { id: 1, cid: 'ghost', local: null }] }));
sc = scene(); frames(3);
var gq = dummy(sc, 'quokkaMinion', sc.player.x + 200, 300); gq.state = 'grin';
var snap = JSON.parse(JSON.stringify(MG.Sync.snapshot(sc)));
check(snap.al && snap.al.length === 2 && snap.en.some(function (e) { return e[11] === 'grin'; }), 'Wi-Fi updates carry the CPU champions and the Hypnotic Grin');
MG.Net.id = 1;
var guest = new MG.RemoteScene({ level: lv('grin-1') }), gErr = null;
try { guest.onNet(snap); guest.update(1 / 30); guest.draw(MG.Engine.ctx); } catch (e) { gErr = '' + e; }
check(!gErr, 'a friend\'s screen draws them' + (gErr ? ': ' + gErr : ''));
check(sc.slots[1].cid === 'ghost' && MG.validCid('ghost') && !MG.validCid('__proto__'), 'a friend can play a secret character they unlocked on their own device');
MG.Net.send = realSend; MG.Net.role = null; MG.Net.status = 'off'; MG.Net.token = null; MG.Net.onMessage = null; MG.Net.id = 0;
done('twist');
