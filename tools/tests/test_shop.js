// Milestone 5: weapons, coins, armor, upgrades and the platypus's shop (campaign, duels, Wi-Fi).
function arena(cid, x, players) {
  MG.Engine.setScene(new MG.CampaignScene(players ? { level: 0, players: players } : { charId: cid, level: 0 }));
  var sc = scene();
  sc.enemies = []; sc.crates = []; sc.pickups = []; sc.coins = []; sc.boss = null;
  sc.gates.forEach(function (g) { g.opened = true; });
  sc.slots.forEach(function (s, i) { s.f.x = (x || 600) + i * 60; s.f.facing = 1; if (s.f.joey) s.f.joey.cool = 99; });
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
function press(code, n) { key(code, true); frames(1); key(code, false); frames(n === undefined ? 2 : n); }
function hold(code, n) { key(code, true); frames(n); key(code, false); }
function wallet(pid) { return MG.Gear.get(pid || 'p1'); }
function setWallet(pid, o) { MG.Gear.set(pid, Object.assign(MG.Gear.get(pid), o)); }
localStorage.clear();

// ---- the wallet and the shop's rules
var G = MG.Gear;
check(wallet().coins === 0 && !wallet().weapon && G.ITEMS.length === 12, 'a fresh wallet: no coins, no weapon; the shop has 12 items (7 weapons, 3 armors, 2 upgrades)');
var sling = { kind: 'weapon', id: 'shanghai' }, snag = { kind: 'weapon', id: 'snag' };
check(!G.offer('p1', sling).can && G.act('p1', sling) === null, 'can\'t buy without coins');
G.addCoins('p1', 100);
var r = G.act('p1', sling);
check(r && wallet().coins === 60 && wallet().weapon === 'shanghai' && wallet().weapons.shanghai === 1, 'buying the slingshot (40): 60 coins left, and you use it straight away');
check(JSON.parse(localStorage.getItem('marsupialmayhem.gear')).p1.weapon === 'shanghai', 'saved in this browser');
var o = G.offer('p1', sling);
check(o.action === 'upgrade' && o.price === 20, 'the weapon you use can be upgraded (level 2 costs half its price)');
G.act('p1', sling);
check(wallet().weapons.shanghai === 2 && wallet().coins === 40, 'upgraded to level 2');
check(G.act('p1', snag) === null && wallet().coins === 40, 'not enough for the snag shooter (80)');
G.addCoins('p1', 200);
G.act('p1', snag);
check(wallet().weapon === 'snag' && G.offer('p1', sling).action === 'equip', 'a new weapon is used straight away; the old one can be picked again for free');
G.act('p1', sling);
check(wallet().weapon === 'shanghai' && wallet().coins === 160, 'switching back costs nothing');
G.act('p1', sling); // level 3 (40)
check(G.offer('p1', sling).action === 'maxed' && wallet().weapons.shanghai === 3, 'weapons max out at level 3');
G.addCoins('p1', 2000);
['bark', 'billy'].forEach(function (id) { G.act('p1', { kind: 'armor', id: id }); });
check(wallet().armor === 'billy' && wallet().armors.bark && G.offer('p1', { kind: 'armor', id: 'bark' }).action === 'equip', 'armor: you wear the newest set and can switch back');
G.act('p1', { kind: 'upgrade', id: 'heart' }); G.act('p1', { kind: 'upgrade', id: 'heart' }); G.act('p1', { kind: 'upgrade', id: 'belt' });
check(wallet().heart === 2 && wallet().belt === 1, 'bigger heart level 2, grenade belt level 1');
var lo = G.loadout('p1');
check(lo.w === 'shanghai' && lo.wl === 3 && lo.a === 'billy' && lo.hp === 2 && lo.gb === 1, 'the loadout carries weapon, level, armor and upgrades');
setWallet('p9', { coins: -50, weapons: { fake: 9, snag: 7 }, weapon: 'fake', armor: '__proto__' });
var bad = G.get('p9');
check(bad.coins === 0 && !bad.weapon && !bad.armor && bad.weapons.snag === 3 && !('fake' in bad.weapons), 'an edited save can\'t break the game (only real items, levels in range)');
var cl = G.clean({ w: '__proto__', a: 'constructor', wl: 99, hp: 99, gb: -4 });
check(cl.w === null && cl.a === null && cl.hp === 2 + 1 && cl.gb === 0, 'a Wi-Fi friend\'s gear is checked: no "__proto__" or "constructor" items, levels in range');
check(MG.WEAPONS.__proto__ === undefined && MG.WEAPONS.constructor === undefined && MG.ARMORS.toString === undefined, 'the item tables have no prototype');

// ---- every weapon fires and hits
localStorage.clear();
var errs = [];
MG.WEAPON_IDS.forEach(function (id) {
  var sc = arena('boomer', 500), f = sc.player;
  f.equip(id, 1);
  var pigs = [150, 300, 460].map(function (d) { return dummy(sc, 'pig', 500 + d, 5000); });
  key('KeyR', true); frames(150); key('KeyR', false); frames(60);
  var dmg = pigs.reduce(function (a, p) { return a + p.maxHp - p.hp; }, 0);
  if (!(dmg > 5)) errs.push(id + ' ' + dmg.toFixed(1));
});
check(!errs.length, 'every weapon fires and hits pests (' + MG.WEAPON_IDS.join(', ') + ')' + (errs.length ? ' FAILED: ' + errs.join('; ') : ''));

// a weapon you own refills by itself
var sc = arena('tank', 500), p = sc.player;
p.equip('bowler', 1);
check(p.weapon.own && p.ammo === 4, 'the cricket-ball bowler holds 4 balls');
hold('KeyR', 240);
check(p.ammo === 0, 'shoot them all...');
press('KeyR', 2);
frames(60 * 4);
check(p.ammo === 4, '...and it refills by itself once you stop shooting');
p.equip('bowler', 3);
check(p.weapon.max === MG.weaponMag('bowler', 3) && p.weapon.max > 4, 'level 3 holds more (' + p.weapon.max + ')');

// a weapon found in a map: borrowed until it's used up, then your own comes back
sc = arena('zip', 500); p = sc.player; p.equip('shanghai', 1);
sc.pickups.push(new MG.Pickup('w:bowler', p.x, MG.GROUND_Y)); frames(3);
check(p.weapon.id === 'bowler' && !p.weapon.own && p.ammo === MG.WEAPONS.bowler.pickupAmmo, 'picking up a CRICKET-BALL BOWLER: ' + MG.WEAPONS.bowler.pickupAmmo + ' balls to use');
hold('KeyR', 60 * 12);
check(p.weapon.id === 'shanghai' && p.weapon.own, 'when they\'re gone, your own slingshot comes back');

// level damage, piercing, drop bears, magpies
sc = arena('boomer', 500); p = sc.player; p.equip('shanghai', 1);
var a = dummy(sc, 'pig', 800, 5000); press('KeyR', 60); var d1 = a.maxHp - a.hp;
sc = arena('boomer', 500); p = sc.player; p.equip('shanghai', 3);
a = dummy(sc, 'pig', 800, 5000); press('KeyR', 60); var d3 = a.maxHp - a.hp;
check(d3 > d1 * 1.4, 'level 3 hits harder (' + d1.toFixed(1) + ' -> ' + d3.toFixed(1) + ')');
sc = arena('boomer', 500); p = sc.player; p.equip('bowler', 1);
var row = [700, 760, 820, 880].map(function (x) { return dummy(sc, 'pig', x, 5000); });
press('KeyR', 60);
var hitN = row.filter(function (e) { return e.hp < e.maxHp; }).length;
check(hitN === 3, 'a cricket ball goes through 3 pests (hit ' + hitN + ')');
sc = arena('boomer', 500); p = sc.player; p.equip('dropbear', 1);
var pack = [930, 980, 1030].map(function (x) { return dummy(sc, 'rabbit', x, 500); });
press('KeyR', 90);
check(sc.projectiles.some(function (q) { return q.kind === 'maul'; }) || pack.filter(function (e) { return e.hp < e.maxHp; }).length >= 2, 'a drop bear lands and mauls everything nearby');
frames(80);
check(pack.filter(function (e) { return e.hp < e.maxHp; }).length >= 2, '...hitting several pests at once');
sc = arena('boomer', 500); p = sc.player; p.equip('magpie', 1);
var behind = dummy(sc, 'cat', 380, 500);
press('KeyR', 150);
check(behind.hp < behind.maxHp, 'a magpie swoops round to a pest behind you');

// ---- armor
sc = arena('boomer', 500); p = sc.player;
p.armorMax = 25; p.armor = 25;
p.takeHit({ dmg: 10, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(2);
check(p.hp === p.maxHp && p.armor === 15, 'armor takes the hit before health');
p.invuln = 0; p.state = 'idle';
p.takeHit({ dmg: 30, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(2);
check(p.armor === 0 && p.hp === p.maxHp - 15, 'what armor can\'t take goes to health');
sc.pickups.push(new MG.Pickup('armor', p.x, MG.GROUND_Y)); frames(3);
check(p.armor === MG.ARMOR_PICKUP && p.armorMax >= 30, 'a bark patch found in a map: +' + MG.ARMOR_PICKUP + ' armor');

// ---- your gear comes into every map (and back at checkpoints)
localStorage.clear();
setWallet('p1', { weapons: { flamer: 2 }, weapon: 'flamer', armors: { iron: 1 }, armor: 'iron', heart: 3, belt: 2 });
sc = new MG.CampaignScene({ charId: 'drowsy', level: 0 }); MG.Engine.setScene(sc); frames(2);
p = sc.player;
check(p.weapon && p.weapon.id === 'flamer' && p.weapon.level === 2 && p.weapon.own, 'your bought weapon (flamer, level 2) is in your paws');
check(p.armor === 110 && p.maxHp === MG.charById('drowsy').hp + 60 && p.hp === p.maxHp, 'corrugated-iron suit (110 armor) and bigger heart level 3 (+60 health)');
check(p.grenades === MG.START_GRENADES + 2, 'grenade belt level 2: two extra grenades');
sc.checkpoint = 1200; p.armor = 3; p.invuln = 0; p.joey.rescueUsed = true;
p.takeHit({ dmg: 9999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(150);
menuItem(sc.menu, 'Continue from Checkpoint').act(); frames(2);
check(sc.player.armor === 110 && sc.player.weapon.id === 'flamer', 'continuing from a checkpoint: armor repaired, weapon kept');
localStorage.clear();

// ---- coins
sc = arena('boomer', 500); p = sc.player;
var bun = dummy(sc, 'rabbit', 560, 1);
press('KeyF', 5);
check(!bun.alive && sc.coins.length > 0, 'a knocked-out rabbit drops coins');
frames(120);
check(wallet().coins === MG.COINS.rabbit && !sc.coins.length, 'they fly to whoever knocked it out (+' + MG.COINS.rabbit + ')');
sc = arena('boomer', 500); p = sc.player; p.giveWeapon('gatling', 100);
var pig = dummy(sc, 'pig', 760, 1);
hold('KeyR', 30); frames(150);
check(!pig.alive && wallet().coins === MG.COINS.rabbit + MG.COINS.pig, 'shooting a pest counts too (+' + MG.COINS.pig + ')');
sc = arena('boomer', 500);
sc.coins.push(new MG.Coin(560, 440, 5, null, true), new MG.Coin(1500, 440, 1, null, true));
frames(90);
check(wallet().coins === MG.COINS.rabbit + MG.COINS.pig + 5 && sc.coins.length === 1, 'coins lying around fly to you when you get close (but not from far away)');
var before = wallet().coins;
var cr = new MG.Crate(560); sc.crates.push(cr);
press('KeyF', 30); press('KeyF', 30); frames(120);
check(!cr.alive && wallet().coins >= before + MG.COINS.crate, 'smashed crates drop coins too');
localStorage.clear();
sc = arena('boomer', 500, [{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'zip', local: 'P2' }]);
var p2 = sc.slots[1].f; p2.facing = 1;
var bun2 = dummy(sc, 'rabbit', p2.x + 50, 1);
press('Comma', 140);
check(!bun2.alive && wallet('p2').coins === MG.COINS.rabbit && wallet('p1').coins === 0, '2 players: each has their own coins');
check(sc.hudModel().players[1].coins === MG.COINS.rabbit, 'the HUD shows each player\'s coins');
sc.camX = sc.L.length - MG.W; sc.slots.forEach(function (s, i) { s.f.x = sc.goalX + i * 30; }); frames(5);
check(sc.state === 'won' && /\+0 .*P2 \+2/.test(sc.coinLine) && menuItem(sc.menu, 'Shop'), 'STAGE CLEAR shows the coins each player picked up, and a Shop button');

// ---- the shop screen
localStorage.clear();
G.addCoins('p1', 100);
MG.Engine.setScene(new MG.ShopScene({ fromMenu: true })); frames(2);
check(sceneName() === 'Shop', 'SHOP on the title screen opens the platypus\'s shop');
press('KeyF');
check(wallet().weapon === 'shanghai' && wallet().coins === 60, 'F buys the slingshot');
press('KeyD'); press('KeyF');
check(!wallet().weapons.snag && /Need 20 more/.test(scene().shoppers[0].msg), 'not enough for the snag shooter: "Need 20 more coins"');
press('KeyS'); press('KeyS');
check(scene().shoppers[0].cur === MG.Gear.ITEMS.length, 'down from the bottom row: the BACK button');
press('KeyF');
check(sceneName() === 'Menu', '...which goes back to the title screen');
sc = arena('bins', 500); sc.slots[0].f.x = sc.goalX; frames(70);
menuItem(sc.menu, 'Shop').act(); frames(2);
check(sceneName() === 'Shop' && !scene().opts.fromMenu, 'after a map: Shop');
press('Escape', 3);
check(sceneName() === 'Campaign' && scene().player.weapon && scene().player.weapon.id === 'shanghai', 'PLAY (or Esc) starts the map with your new slingshot');
setWallet('p2', { coins: 100 });
MG.Engine.setScene(new MG.ShopScene({ level: 0, players: [{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'zip', local: 'P2' }] })); frames(2);
press('Comma');
check(wallet('p2').weapon === 'snag' && wallet('p2').coins === 20 && wallet('p1').weapon === 'shanghai', '2 players shop together: P2 buys with , and their own coins');
press('ArrowDown'); press('ArrowDown'); press('Comma', 3);
check(sceneName() === 'Campaign' && scene().slots[1].f.weapon.id === 'snag', 'P2 brings the snag shooter into the map');
// tapping
MG.Engine.setScene(new MG.ShopScene({ fromMenu: true })); frames(2);
G.addCoins('p1', 700);
var cr2 = scene().cardRect(6);
MG.Input.pointer.x = cr2.x + 10; MG.Input.pointer.y = cr2.y + 10; MG.Input.pointer.pressed = true; frames(1);
check(scene().shoppers[0].cur === 6, 'tap an item to look at it');
var br = scene().buyRect(0);
MG.Input.pointer.x = br.x + 10; MG.Input.pointer.y = br.y + 10; MG.Input.pointer.pressed = true; frames(1);
check(wallet().weapon === 'magpie', '...and tap the button under your coins to buy it');
// every state draws
errs = [];
[{ fromMenu: true }, { level: 0, players: [{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'zip', local: 'P2' }] }].forEach(function (opts) {
  var s = new MG.ShopScene(opts);
  for (var i = 0; i <= MG.Gear.ITEMS.length; i++) {
    s.shoppers.forEach(function (sh) { sh.cur = i; });
    try { s.draw(MG.Engine.ctx); } catch (e) { errs.push(i + ': ' + e); }
  }
});
check(!errs.length, 'every shop card and cursor draws' + (errs.length ? ' ' + errs[0] : ''));

// ---- duels stay fair
localStorage.clear();
setWallet('p1', { weapons: { magpie: 3 }, weapon: 'magpie', armors: { iron: 1 }, armor: 'iron', heart: 3, belt: 2 });
MG.Engine.setScene(new MG.DuelScene({ stage: 0, players: [{ id: 0, cid: 'tank', local: 'P1' }, { id: 1, cid: 'zip', local: 'P2' }] }));
var d = scene(), f1 = d.slots[0].f;
check(!f1.weapon && f1.armor === 0 && f1.maxHp === MG.charById('tank').hp && f1.grenades === 0, 'duels ignore bought gear: everyone starts equal');
var realRandom = Math.random;
Math.random = function () { return 0.5; }; d.supplyDrop(); Math.random = realRandom;
var drop = d.pickups[d.pickups.length - 1];
check(MG.pickupWeapon(drop.type), 'supply drops can bring a weapon to borrow (' + drop.type + ')');
d.collect(drop, f1);
check(f1.weapon && !f1.weapon.own && f1.ammo > 0, '...for whoever grabs it');
Math.random = function () { return 0.7; }; d.supplyDrop(); Math.random = realRandom;
drop = d.pickups[d.pickups.length - 1];
d.collect(drop, f1);
check(drop.type === 'armor' && f1.armor === MG.ARMOR_PICKUP, '...or armor');
check(d.hudModel().sides[0].weapon === f1.weapon.id && d.hudModel().sides[0].armorMax > 0, 'the duel HUD shows the weapon and armor');

// ---- Wi-Fi: friends bring their own gear and keep the coins they pick up
localStorage.clear();
var sent = [];
var realSend = MG.Net.send;
MG.Net.send = function (m, to) { sent.push({ m: m, to: to === undefined ? 'all' : to }); return true; };
MG.Net.role = 'host'; MG.Net.id = 0; MG.Net.status = 'connected'; MG.Net.code = '1234'; MG.Net.token = 'host'; MG.Net.lastHeard = performance.now();
G.note(1, { t: 'pick', cid: 'zip', ready: true, lo: { w: 'magpie', wl: 2, a: 'billy', hp: 1, gb: 1 }, coins: 321 });
G.note(2, { t: 'pick', cid: 'tank', ready: true, lo: { w: '__proto__', a: 'toString', hp: 50 } });
MG.Engine.setScene(new MG.CampaignScene({ level: 0, net: true, players: [{ id: 0, cid: 'boomer', local: 'SOLO' }, { id: 1, cid: 'zip', local: null }, { id: 2, cid: 'tank', local: null }] }));
sc = scene(); frames(3);
var gf = sc.slots[1].f, gt = sc.slots[2].f;
check(gf.weapon.id === 'magpie' && gf.weapon.level === 2 && gf.armor === 60 && gf.maxHp === MG.charById('zip').hp + 20 && gf.grenades === MG.START_GRENADES + 1, 'a friend\'s bought gear comes into the host\'s game');
check(!gt.weapon && gt.armor === 0 && gt.maxHp === MG.charById('tank').hp + 60, 'bogus item names from a friend are ignored');
check(sc.hudModel().players[1].coins === 321, 'the host shows a friend\'s own coins');
sc.gainCoins(gf, 7);
var snap = JSON.parse(JSON.stringify(MG.Sync.snapshot(sc)));
var me1 = snap.pl.find(function (q) { return q.id === 1; });
check(snap.gid && me1.co === 7 && me1.wpn === 'magpie' && me1.ar === 60, 'Wi-Fi updates carry each player\'s coins, weapon and armor');
MG.Net.id = 1;
var guest = new MG.RemoteScene({ level: 0 });
guest.onNet(snap);
check(wallet().coins === 7, 'the friend\'s device adds the coins to their own wallet');
guest.onNet(JSON.parse(JSON.stringify(MG.Sync.snapshot(sc))));
check(wallet().coins === 7, '...only once');
sc.gainCoins(gf, 3);
var snap2 = JSON.parse(JSON.stringify(MG.Sync.snapshot(sc))); guest.onNet(snap2);
check(wallet().coins === 10, '...and the next ones as they come (+3)');
var guest2 = new MG.RemoteScene({ level: 0 }); guest2.onNet(snap2);
check(wallet().coins === 10, 'a rejoin doesn\'t count them twice');
var lens = [];
sc.coins = []; for (var c = 0; c < 40; c++) sc.coins.push(new MG.Coin(600 + c * 5, 300, 1));
lens.push(JSON.stringify(MG.Sync.snapshot(sc)).length);
check(lens[0] < 4500, 'an update with lots of coins flying is still small (' + lens[0] + ' bytes)');
var gdraw = null; try { guest.onNet(JSON.parse(JSON.stringify(MG.Sync.snapshot(sc)))); guest.update(1 / 30); guest.draw(MG.Engine.ctx); } catch (e) { gdraw = '' + e; }
check(!gdraw, 'the friend\'s screen draws coins, weapons and armor' + (gdraw ? ': ' + gdraw : ''));

// shopping together
MG.Net.id = 0;
sc.boss = null; sc.enemies = [];
sc.camX = sc.L.length - MG.W; sc.slots.forEach(function (s, i) { s.f.x = sc.goalX + i * 30; }); frames(80);
sent = [];
menuItem(sc.menu, 'Shop Together').act(); frames(2);
var hostShop = scene();
var shopMsg = sent.map(function (s) { return s.m; }).filter(function (m) { return m.t === 'shop'; }).pop();
check(sceneName() === 'Shop' && hostShop.net && shopMsg && shopMsg.pl.length === 3, 'Shop Together: the host opens the shop and tells everyone');
check(shopMsg.pl.find(function (q) { return q.id === 1; }).coins === 321, 'everyone sees everybody\'s coins');
MG.Net.id = 1;
guest.onNet(shopMsg);
var guestShop = scene();
check(sceneName() === 'Shop' && guestShop.guest, 'a friend\'s device opens their own shop');
sent = [];
guestShop.done();
var gearMsg = sent.map(function (s) { return s.m; }).filter(function (m) { return m.t === 'gear'; }).pop();
check(gearMsg && gearMsg.ready && gearMsg.lo, 'the friend presses I\'M READY (their gear goes with it)');
MG.Engine.setScene(hostShop); MG.Net.id = 0;
hostShop.onNet(gearMsg, 1);
check(MG.Gear.friends[1].ready, 'the host sees who is ready');
var drawErr = null; try { hostShop.draw(MG.Engine.ctx); guestShop.view = shopMsg; guestShop.draw(MG.Engine.ctx); } catch (e) { drawErr = '' + e; }
check(!drawErr, 'both shops draw everyone\'s wallets' + (drawErr ? ': ' + drawErr : ''));
hostShop.done(); frames(2);
check(sceneName() === 'Campaign' && scene().net && scene().slots.length === 3, 'the host starts the next map with everyone');
var firstSnap = JSON.parse(JSON.stringify(MG.Sync.snapshot(scene())));
MG.Engine.setScene(guestShop); MG.Net.id = 1;
guestShop.onNet(firstSnap);
check(sceneName() === 'Remote', 'the friend\'s shop turns into the game when it starts');

MG.Net.send = realSend; MG.Net.role = null; MG.Net.status = 'off'; MG.Net.token = null; MG.Net.onMessage = null; MG.Net.id = 0;
done('shop');
