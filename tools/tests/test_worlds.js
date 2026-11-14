// Milestone 6: the Marsupial World map, story panels, worlds 1-3 (11 maps), new pests and bosses,
// hazards (emus, cassowaries, crocodiles), allies (Smile Squad quokkas, tree-kangaroo, quoll), water.
function fresh() { localStorage.clear(); }
function arena(level, cid, x) {
  MG.Engine.setScene(new MG.CampaignScene({ charId: cid || 'boomer', level: level || 0 }));
  var sc = scene();
  sc.enemies = []; sc.crates = []; sc.pickups = []; sc.coins = []; sc.npcs = []; sc.boss = null;
  sc.gates.forEach(function (g) { g.opened = true; });
  sc.player.x = x || 600; sc.player.facing = 1; if (sc.player.joey) sc.player.joey.cool = 99;
  sc.camX = Math.max(0, (x || 600) - 300); sc.t = 5;
  frames(3);
  return sc;
}
function dummy(sc, type, x, hp) {
  var e = sc.addEnemy(type, x); e.think = function () { this.vx = 0; }; e.hidden = false;
  if (hp) e.hp = e.maxHp = hp; sc.enemies.push(e); return e;
}
function npc(sc, o) { var n = new MG.NPC(o); sc.npcs.push(n); return n; }
function press(code, n) { key(code, true); frames(1); key(code, false); frames(n === undefined ? 2 : n); }
fresh();

// ---- the maps
var ids = MG.LEVELS.map(function (l) { return l.id; });
check(MG.LEVELS.length >= 11 && ids.slice(0, 11).join() === 'outback-1,outback-2,outback-3,outback-4,rainforest-1,rainforest-2,rainforest-3,cane-1,cane-2,cane-3,cane-4' && MG.LEVELS[0].name === 'TOURNAMENT TRAIL', 'worlds 1-3 are maps 1-11; the Tournament Trail is still map 1 (new maps are appended)');
check(new Set(ids).size === ids.length, 'every map has its own id');
var worldCounts = MG.WORLDS.slice(0, 3).map(function (w) { return w.levels.length; }).join(',');
check(worldCounts === '4,3,4' && MG.WORLDS.every(function (w) { return w.levels.every(function (id) { return ids.indexOf(id) >= 0 && MG.MAP_STOPS[id]; }); }), 'Outback 4, Rainforest 3, Cane Fields & Coast 4, each a stop on the world map');
var problems = [];
var DECOR = ['mound', 'sign', 'tree', 'vines', 'waterfall', 'cane', 'mangrove', 'shed', 'redrock', 'snakeSkin', 'footprints', 'quokkaGoanna',
  'snowgum', 'hut', 'cliff', 'buttongrass', 'building', 'bin', 'streetlight', 'laneway', 'billboard', 'fern', 'volcano', 'riftCrack',
  'souvenirShop', 'selfieBoard', 'lighthouse', 'plushies', 'partyBanner', 'stalagmite', 'crystal', 'throne', 'eggs', 'stonewall', 'cottage', 'sheep',
  'termiteMound', 'pandanus', 'bigMangrove', 'crocSign', 'wharf', 'boatWreck'];
var NPCS = ['emus', 'cassowary', 'croc', 'quokka', 'treeKangaroo', 'quoll', 'pygmyPossum', 'wallaby', 'sloth'];
MG.LEVELS.forEach(function (L) {
  if (L.boss && L.length < L.boss.x + 580) problems.push(L.id + ' too short for its boss');
  (L.enemies || []).forEach(function (e) { if (!MG.ENEMY_TYPES[e.type]) problems.push(L.id + ' pest ' + e.type); });
  (L.decor || []).forEach(function (d) { if (DECOR.indexOf(d.type) < 0) problems.push(L.id + ' decor ' + d.type); });
  (L.npcs || []).forEach(function (n) { if (NPCS.indexOf(n.kind) < 0) problems.push(L.id + ' npc ' + n.kind); });
  (L.npcs || []).filter(function (n) { return n.kind === 'croc'; }).forEach(function (n) { if (!MG.waterAt(MG.waterZones(L), n.x)) problems.push(L.id + ' croc out of water'); });
  (L.gates || []).forEach(function (g) { if (MG.waterAt(MG.waterZones(L), g.x)) problems.push(L.id + ' gate in water'); });
  (L.pickups || []).concat((L.crates || []).map(function (c) { return { type: c.loot }; })).forEach(function (p) {
    var ok = ['heart', 'grenades', 'gatling', 'gumnuts', 'armor', 'none', undefined].indexOf(p.type) >= 0 || MG.POWER_TYPES.indexOf(p.type) >= 0 || MG.pickupWeapon(p.type);
    if (!ok) problems.push(L.id + ' pickup ' + p.type);
  });
  if (!L.theme || !L.music || !MG.Audio.SONGS[L.music]) problems.push(L.id + ' theme/music');
});
check(!problems.length, 'every map\'s pests, decor, animals, pickups, music and boss arena check out' + (problems.length ? ': ' + problems.join('; ') : ''));
check(['warrenWarlord', 'bigTom', 'toadKing'].every(function (b) { return MG.LEVELS.some(function (L) { return L.boss && L.boss.type === b; }); }), 'world bosses: Warren Warlord, Big Tom, the Cane Toad King');
check(MG.LEVELS.some(function (L) { return L.water; }) && MG.LEVELS.filter(function (L) { return L.theme === 'rainforest'; }).length === 3, 'water zones in world 3, rainforest theme in world 2');
var drawErr = null;
MG.LEVELS.forEach(function (L, i) {
  try { var s = new MG.CampaignScene({ charId: 'paddles', level: i }); MG.Engine.setScene(s); frames(2); s.camX = L.length / 2; s.draw(MG.Engine.ctx); s.camX = L.length - MG.W; s.draw(MG.Engine.ctx); } catch (e) { if (!drawErr) drawErr = L.id + ': ' + e; }
});
check(!drawErr, 'every map loads and draws' + (drawErr ? ' ' + drawErr : ''));

// ---- progress and the world map
fresh();
check(MG.Progress.isOpen(0) && !MG.Progress.isOpen(1), 'a new save: only map 1 is open');
MG.Progress.clear('outback-1');
check(MG.Progress.isOpen(1) && !MG.Progress.isOpen(2), 'clearing a map opens the next');
fresh(); MG.Save.set('best', { 'outback-1': 1200 });
check(MG.Progress.isCleared('outback-1') && MG.Progress.isOpen(1), 'a best score from before the world map counts as cleared');
fresh();
MG.Engine.setScene(new MG.SelectScene({ mode: 'campaign' })); frames(2);
press('Enter', 3);
check(sceneName() === '?' && scene() instanceof MG.StoryScene && scene().id === 'opening', 'PLAY > pick a marsupial > the opening story plays first');
var pages = MG.STORY.opening.length;
for (var pg = 0; pg < pages; pg++) { frames(25); press('Space', 2); }
check(scene() instanceof MG.WorldMapScene, '...then the Marsupial World map');
var map = scene();
check(map.stops[map.cur] === 'outback-1', 'the champion starts at the first map');
press('ArrowRight', 2);
check(map.cur === 1 && /first/.test(map.msg), 'map 2 is locked until map 1 is cleared');
press('ArrowLeft', 2); frames(60);
check(map.stops[map.cur] === 'shop', 'walk left to the platypus\'s shop');
press('Enter', 2);
check(scene() instanceof MG.ShopScene && scene().opts.toMap, '...which opens the shop');
press('Escape', 2);
check(scene() instanceof MG.WorldMapScene && scene().stops[scene().cur] === 'shop', 'and the shop goes back to the map');
press('ArrowRight', 2); frames(60); press('Enter', 2);
check(sceneName() === 'Campaign' && scene().levelIndex === 0, 'picking a stop starts that map');
var sc = scene(); sc.boss = null; sc.player.x = sc.goalX; frames(70);
check(sc.state === 'won' && MG.Progress.isCleared('outback-1') && menuItem(sc.menu, 'World Map'), 'clearing it is saved, and STAGE CLEAR has World Map');
menuItem(sc.menu, 'World Map').act(); frames(2);
check(scene() instanceof MG.StoryScene && scene().id === 'invasion', 'back on the map: the invasion story (once)');
press('Escape', 3);
check(scene() instanceof MG.WorldMapScene && MG.Story.pending() === null && MG.Progress.isOpen(1), 'Esc skips it; map 2 is open now');
map = scene(); press('ArrowRight', 2); frames(60);
check(map.stops[map.cur] === 'outback-2', 'walk on to map 2');
var drawn = null; try { map.draw(MG.Engine.ctx); } catch (e) { drawn = '' + e; }
check(!drawn, 'the world map draws' + (drawn ? ': ' + drawn : ''));
MG.Progress.clear('outback-4');
check(MG.Story.pending() === 'rainforest', 'clearing the Outback brings the Rainforest story');
MG.Story.markSeen('rainforest'); MG.Progress.clear('rainforest-3');
check(MG.Story.pending() === 'canefields', '...and the Rainforest brings the Cane Fields story');
press('Escape', 2);
check(sceneName() === 'Menu', 'Esc on the map goes back to the title screen');
var storyErr = null;
Object.keys(MG.STORY).forEach(function (id) { MG.STORY[id].forEach(function (p, i) { try { MG.Story.drawPanel(MG.Engine.ctx, id, i, 1); } catch (e) { if (!storyErr) storyErr = id + ' ' + i + ': ' + e; } }); });
check(!storyErr, 'every story panel draws' + (storyErr ? ' ' + storyErr : ''));
MG.Story.markSeen('canefields');
MG.Engine.setScene(new MG.SelectScene({ mode: 'coop' })); frames(2);
press('KeyF', 2); press('Comma', 3);
check(scene() instanceof MG.WorldMapScene && scene().players.length === 2, '2 players walk the map together');

// ---- emus
fresh();
sc = arena(1, 'boomer', 900);
var em = npc(sc, { kind: 'emus', x: 1100 });
frames(100);
var herd = sc.npcs.filter(function (n) { return n.kind === 'emu'; });
check(herd.length >= 5, 'an emu stampede starts when the players get close (' + herd.length + ' emus)');
var hp0 = sc.player.hp; for (var i = 0; i < 200 && sc.player.hp === hp0; i++) frames(1);
check(sc.player.hp < hp0, 'emus trample anyone on the ground');
sc = arena(1, 'boomer', 900); sc.platforms = [{ x: 860, y: 300, w: 200 }]; sc.player.y = 300; frames(5);
npc(sc, { kind: 'emus', x: 1100 }); hp0 = sc.player.hp; frames(300);
check(sc.player.hp === hp0, '...but not someone up on a stand');

// ---- cassowary
sc = arena(4, 'zip', 600);
var cas = npc(sc, { kind: 'cassowary', x: 690 });
hp0 = sc.player.hp; for (i = 0; i < 240 && sc.player.hp === hp0; i++) frames(1);
check(sc.player.hp < hp0, 'a cassowary kicks anyone who gets too close');
check(sc.targets('player').indexOf(cas) < 0, 'it can\'t be hit (it\'s a hazard to dodge, not a pest)');

// ---- water and crocodiles
sc = arena(8, 'boomer', 1500);
var zone = MG.waterZones(sc.L)[0];
sc.player.x = zone.x + 100; frames(20);
check(sc.player.swimming, 'in the water you swim');
var vy0 = sc.player.vy; press('KeyW', 6);
check(sc.player.vy < -100 || sc.player.y < MG.GROUND_Y - 30, 'jump swims you up');
function swimSpeed(cid) {
  var s = arena(8, cid, 1500), f = s.player, z = MG.waterZones(s.L)[1];
  f.x = z.x + 60; frames(30);
  var x0 = f.x; key('KeyD', true); frames(40); key('KeyD', false);
  return f.x - x0;
}
var boomerSwim = swimSpeed('boomer'), paddlesSwim = swimSpeed('paddles');
check(paddlesSwim > boomerSwim * 1.6, 'Paddles, the water opossum, swims much faster (' + Math.round(paddlesSwim) + ' vs ' + Math.round(boomerSwim) + ')');
sc = arena(8, 'tank', 1500); zone = MG.waterZones(sc.L)[1];
var croc = npc(sc, { kind: 'croc', x: zone.x + 300 });
var toadInWater = dummy(sc, 'toad', zone.x + 280, 200);
sc.player.x = zone.x - 200; frames(120);
check(croc.state === 'idle' && toadInWater.hp === 200, 'a croc\'s eyes watch you, but it leaves the pests alone...');
check(croc.facing === -1, '...its eyes follow you');
sc.player.x = zone.x + 230; hp0 = sc.player.hp;
for (i = 0; i < 300 && sc.player.hp === hp0; i++) frames(1);
check(sc.player.hp < hp0, 'swim near it and it SNAPS');

// ---- Smile Squad quokkas
sc = arena(1, 'bins', 600);
var q = npc(sc, { kind: 'quokka', x: 700, gives: 'heart' });
sc.player.hp = 30; frames(40);
check(sc.pickups.some(function (p) { return p.type === 'heart'; }) || sc.player.hp > 30, 'a Smile Squad quokka hands you a heart');
sc = arena(1, 'bins', 600); sc.gates.forEach(function (g) { g.opened = false; });
dummy(sc, 'pig', 1500, 999); // keeps the first gate shut
var late = npc(sc, { kind: 'quokka', x: 900, late: 0 });
frames(30);
check(late.hidden, 'a "late" quokka isn\'t there during the fight...');
sc.gates[0].opened = true; frames(200);
check(!late.hidden && sc.pickups.some(function (p) { return p.type === 'heart'; }), '...and turns up just after it\'s over ("Did I miss all the action?")');
var supply = npc(sc, { kind: 'quokka', x: sc.player.x + 60, gives: 'supply' }); var before = sc.pickups.length; frames(10);
check(sc.pickups.length > before, 'some bring a supply drop');

// ---- tree-kangaroo and quoll
sc = arena(4, 'drowsy', 600);
var tk = npc(sc, { kind: 'treeKangaroo', x: 650, y: 300 });
var pig = dummy(sc, 'pig', 900, 200);
for (i = 0; i < 300 && pig.hp === 200; i++) frames(1);
check(pig.hp < 200, 'Matschie\'s tree-kangaroo throws fruit at pests');
sc = arena(7, 'drowsy', 600);
var ql = npc(sc, { kind: 'quoll', x: 560 });
var rab = dummy(sc, 'rabbit', 760, 200);
for (i = 0; i < 300 && rab.hp === 200; i++) frames(1);
check(rab.hp < 200, 'the northern quoll bites pests');
var toad = dummy(sc, 'toad', ql.x + 90, 200); frames(20);
check(ql.mode === 2 && Math.abs(ql.x - toad.x) > 90, '...but runs from cane toads (they\'re poison to quolls)');

// ---- cane toads
sc = arena(7, 'boomer', 600);
toad = dummy(sc, 'toad', 600, 200); toad.think = function () { this.vx = 0; this.contact(sc, sc.player); };
hp0 = sc.player.hp; frames(30);
check(sc.player.hp < hp0 && sc.player.state !== 'hurt', 'touching a cane toad poisons you (it stings, no knockdown)');
sc = arena(7, 'deadfred', 600);
toad = dummy(sc, 'toad', 600, 200); toad.think = function () { this.vx = 0; this.contact(sc, sc.player); };
hp0 = sc.player.hp; frames(30);
check(sc.player.hp === hp0, 'Dead Fred is immune to the poison');
sc = arena(7, 'boomer', 500); toad = dummy(sc, 'toad', 560, 1); press('KeyF', 6);
check(!toad.alive && sc.projectiles.some(function (p) { return p.kind === 'stink' && p.hit.poison; }), 'a knocked-out toad leaves a little poison puff');

// ---- the world bosses
['warrenWarlord', 'bigTom', 'toadKing'].forEach(function (type) {
  var li = MG.LEVELS.findIndex(function (L) { return L.boss && L.boss.type === type; });
  var s = new MG.CampaignScene({ charId: 'stinker', level: li }); MG.Engine.setScene(s);
  s.enemies = [s.boss]; s.gates.forEach(function (g) { g.opened = true; });
  s.player.x = s.arenaX + 200; s.camX = s.arenaX; frames(5);
  check(s.bossAwake, s.boss.d.name + ' wakes up in the arena');
  var b = s.boss, err = null, moves = {};
  b.d.moves.forEach(function (mv) { moves[mv] = 1; });
  Object.keys(moves).forEach(function (mv) {
    try {
      b.state = mv + 'Wind'; b.stateT = 0; b.hurt = 0; b.onGround = true; b.y = MG.GROUND_Y;
      for (var j = 0; j < 150; j++) { frames(1); s.player.hp = s.player.maxHp; s.player.invuln = 0; if (s.player.state === 'ko') s.player.state = 'idle'; }
      s.draw(MG.Engine.ctx);
    } catch (e) { if (!err) err = mv + ': ' + e; }
  });
  check(!err, b.d.name + ' does every move (' + Object.keys(moves).join(', ') + ')' + (err ? ' ERROR ' + err : ''));
  b.burrowed = false; b.lurking = false; b.state = 'idle';
  b.takeHit({ dmg: 99999, kbx: 0, kby: 0, big: true, dir: 1 }, s); frames(5);
  s.player.x = s.goalX; frames(10);
  check(!b.alive && s.state === 'won', b.d.name + ' can be beaten, and the map is cleared');
});
var s2 = new MG.CampaignScene({ charId: 'boomer', level: 3 }); MG.Engine.setScene(s2);
s2.boss.burrowed = true;
check(s2.boss.takeHit({ dmg: 50, kbx: 0, kby: 0 }, s2) === 'miss', 'the Warren Warlord can\'t be hit while he\'s underground');
check(s2.spawnMinions('toad', 2) === 2 && s2.enemies.filter(function (e) { return e.type === 'toad'; }).length === 2, 'bosses call in their own minions');

// ---- clues
var L5 = MG.LEVELS.find(function (L) { return L.decor.some(function (d) { return d.type === 'quokkaGoanna'; }); });
var qg = L5.decor.find(function (d) { return d.type === 'quokkaGoanna'; });
sc = new MG.CampaignScene({ charId: 'boomer', level: MG.LEVELS.indexOf(L5) }); MG.Engine.setScene(sc); frames(2);
sc.camX = qg.x - 900; sc.draw(MG.Engine.ctx);
var far = qg.frozen;
sc.camX = qg.x - MG.W / 2; sc.draw(MG.Engine.ctx);
check(!far && qg.frozen, 'a quokka chatting with a goanna in the background... freezes when you look straight at them');
check(MG.LEVELS.slice(1, 11).filter(function (L) { return L.decor.some(function (d) { return d.type === 'snakeSkin' || d.type === 'footprints'; }); }).length >= 8, 'shed snake skins and scaly footprints near the pests (clues)');

// ---- Wi-Fi: friends see the animals, the world map and the story
var sent = [], realSend = MG.Net.send;
MG.Net.send = function (m, to) { sent.push({ m: m, to: to === undefined ? 'all' : to }); return true; };
MG.Net.role = 'host'; MG.Net.id = 0; MG.Net.status = 'connected'; MG.Net.code = '1234'; MG.Net.token = 'h'; MG.Net.lastHeard = performance.now();
fresh(); MG.Story.markSeen('opening');
MG.Engine.setScene(new MG.CampaignScene({ level: 9, net: true, players: [{ id: 0, cid: 'boomer', local: 'SOLO' }, { id: 1, cid: 'zip', local: null }] }));
sc = scene(); frames(3);
var snap = JSON.parse(JSON.stringify(MG.Sync.snapshot(sc)));
check(Array.isArray(snap.np) && snap.np.length >= 2, 'Wi-Fi updates carry the animals (' + snap.np.length + ')');
MG.Net.id = 1;
var guest = new MG.RemoteScene({ level: 9 }), gErr = null;
try { guest.onNet(snap); guest.update(1 / 30); guest.draw(MG.Engine.ctx); } catch (e) { gErr = '' + e; }
check(!gErr && guest.npcs.length >= 2, 'the friend\'s screen draws them' + (gErr ? ': ' + gErr : ''));
MG.Net.id = 0;
sc.boss = null; sc.enemies = []; sc.camX = sc.L.length - MG.W; sc.slots.forEach(function (s, k) { s.f.x = sc.goalX + k * 30; }); frames(80);
sent = [];
menuItem(sc.menu, 'World Map').act(); frames(4);
var hostMap = scene();
var wm = sent.map(function (s) { return s.m; }).filter(function (m) { return m.t === 'wmap'; }).pop();
check(hostMap instanceof MG.WorldMapScene && hostMap.net && wm && wm.pl.length === 2, 'Wi-Fi: the host goes to the world map and tells everyone');
MG.Net.id = 1;
guest.onNet(wm);
var gMap = scene();
check(gMap instanceof MG.WorldMapScene && gMap.guest, 'the friends see the same map');
gErr = null; try { gMap.draw(MG.Engine.ctx); gMap.onNet({ t: 'wmap', story: 'invasion', page: 1 }); gMap.draw(MG.Engine.ctx); } catch (e) { gErr = '' + e; }
check(!gErr, '...and the story panels with the host' + (gErr ? ': ' + gErr : ''));
MG.Engine.setScene(hostMap); MG.Net.id = 0;
hostMap.choose(); frames(2);
var first = JSON.parse(JSON.stringify(MG.Sync.snapshot(scene())));
MG.Engine.setScene(gMap); MG.Net.id = 1; gMap.onNet(first);
check(sceneName() === 'Remote', 'when the host picks a map, the friends\' screens follow');
MG.Net.send = realSend; MG.Net.role = null; MG.Net.status = 'off'; MG.Net.token = null; MG.Net.onMessage = null; MG.Net.id = 0;

// lobby: the host can only pick maps that are open
fresh();
var lob = new MG.LobbyScene({ mode: 'campaign', resume: true, players: [{ id: 0, cid: 'boomer', ready: true }] });
lob.change(1);
check(lob.level === 0, 'Wi-Fi lobby: only open maps can be picked');
MG.Progress.clear('outback-1'); lob.change(1);
check(lob.level === 1, '...map 2 once map 1 is cleared');
done('worlds');
