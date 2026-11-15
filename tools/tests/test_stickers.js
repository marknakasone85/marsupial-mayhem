// The sticker book (15 Nov 2026): 27 stickers saved in this browser, earned in play by the people on
// this computer (never the CPU, CPU champions or Wi-Fi friends' fighters on the host), a pop-up when
// one is earned, the stickers that come from saves, and the book itself.
var S = MG.Stickers;
function reset() { localStorage.clear(); S.toasts.length = 0; Object.keys(MG.STORY).forEach(function (id) { MG.Story.markSeen(id); }); }
function arena(cid, opts) {
  MG.Engine.setScene(new MG.CampaignScene(Object.assign({ charId: cid || 'boomer', level: 0 }, opts || {})));
  var sc = scene();
  sc.enemies = []; sc.crates = []; sc.pickups = []; sc.boss = null;
  sc.gates.forEach(function (g) { g.opened = true; });
  sc.player.x = 600; sc.player.facing = 1; sc.t = 5;
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

reset();
// ---- the list
var ids = S.LIST.map(function (s) { return s.id; });
check(S.LIST.length === 27 && ids.every(function (id, i) { return ids.indexOf(id) === i; }), '27 stickers, each its own');
check(S.LIST.every(function (s) { return s.name && s.how && s.icon; }) && S.LIST.filter(function (s) { return s.hidden; }).length === 4, 'every sticker has a name, how to get it and a picture; 4 are secrets (no spoilers)');
check(S.LIST.filter(function (s) { return s.world; }).every(function (s) { return MG.WORLDS.some(function (w) { return w.id === s.world; }); }), 'every world sticker matches a world');

// ---- earning: once, saved, a pop-up
check(S.earn('shopper') && !S.earn('shopper') && S.has('shopper') && JSON.parse(localStorage.getItem('marsupialmayhem.stickers')).shopper, 'a sticker is earned once and saved in this browser');
check(S.toasts.length === 1 && S.toasts[0].ids[0] === 'shopper', '...with a pop-up');
var drawn = [];
var tctx = new Proxy({}, { get: function (t, k) { if (k in t) return t[k]; if (k === 'measureText') return function () { return { width: 10 }; }; if (k === 'fillText') return function (s) { drawn.push(String(s)); }; if (k === 'createLinearGradient' || k === 'createRadialGradient') return function () { return { addColorStop: noop }; }; return noop; }, set: function (t, k, v) { t[k] = v; return true; } });
S.drawToast(tctx);
check(drawn.indexOf('NEW STICKER!') >= 0 && drawn.indexOf('First Purchase') >= 0, 'the pop-up says NEW STICKER! and its name');
MG.Engine.setScene(new MG.MenuScene()); frames(60 * 4);
check(S.toasts.length === 0, '...and goes away after about 3 seconds (the game draws it over any screen)');
check(!S.earn('nonsense') && !S.has('nonsense'), 'unknown stickers are ignored');

// ---- earned in play
reset();
var sc = arena('boomer'), p = sc.player, d = dummy(sc, 'pig', 650, 900);
[18, 18, 30].forEach(function (n) { d.x = p.x + 50; d.vx = 0; press('KeyF', n); });
check(S.has('combo'), 'punch, punch, hook: "One-Two-Three"');
d.x = p.x + 50; p.combo = 9; press('KeyF', 20);
check(S.has('tenhits'), '10 hits in a row: "Mayhem Maker"');
p.meter = MG.SPECIAL_COST; d.x = p.x + 50; press('KeyH', 90);
check(S.has('special'), 'a special: "Super Duper"');
p.pouch = 'heart'; p.hp = 50; press('KeyT', 5);
check(S.has('pouch'), 'using the pouch: "Saved for Later"');
sc = arena('boomer'); p = sc.player; d = dummy(sc, 'pig', 760, 900); p.joey.cool = 0; frames(2);
press('KeyQ', 60);
check(S.has('joeyrush'), 'a Joey Rush that hits: "Go Get \'Em, Joey!"');
sc = arena('boomer'); p = sc.player; var weak = dummy(sc, 'rabbit', 640, 1);
var g = new MG.Grenade(620, MG.GROUND_Y - 20, 0, 0, p); g.kicked = 1; g.kickedBy = p; sc.grenades.push(g); g.explode(sc);
check(!weak.alive && S.has('grenade'), 'a pest knocked out by a kicked grenade: "Footy Star"');
// not for the CPU champions or Wi-Fi friends' fighters on the host
reset();
sc = arena('boomer');
var ally = sc.makeAlly('tank', 600);
MG.Engine.setScene(new MG.CampaignScene({ level: 0, players: [{ id: 0, cid: 'boomer', local: 'SOLO' }, { id: 1, cid: 'zip', local: null }] }));
var hostScene = scene();
check(!S.earn('combo', ally, sc) && !S.earn('combo', hostScene.slots[1].f, hostScene) && S.earn('combo', hostScene.slots[0].f, hostScene),
  'CPU champions and Wi-Fi friends\' fighters don\'t earn this computer\'s stickers; its own player does');

// ---- clearing a map: no knockouts, with a friend, who cleared it
reset();
sc = arena('zip'); sc.win();
check(S.has('flawless') && !S.has('mates') && S.team() === 1, 'a map with no knockouts: "Not a Scratch" (and Zip counts towards the mob)');
reset();
sc = arena('zip'); sc.player.joey.rescueUsed = true; sc.player.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(5); sc.koSeen = sc.koSeen; sc.win();
check(!S.has('flawless'), '...not after a knockout');
reset();
MG.Engine.setScene(new MG.CampaignScene({ level: 0, players: [{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'tank', local: 'P2' }] })); frames(3); scene().win();
check(S.has('mates') && S.team() === 2, 'two players clearing a map: "Mates"');
reset();
MG.Engine.setScene(new MG.CampaignScene({ level: 0 })); frames(2);
var wonSnap = MG.Sync.snapshot(scene()); wonSnap.st = 'won'; wonSnap.t = 'snap'; wonSnap.n = 5;
var guest = new MG.RemoteScene({ level: 0 }); MG.Engine.setScene(guest); guest.onNet(wonSnap);
check(S.has('mates'), 'a Wi-Fi friend gets "Mates" on their own device when the map is cleared');
MG.Net.leave && MG.Net.leave();
// six and twelve marsupials
reset();
MG.CHARACTERS.slice(0, 6).forEach(function (c) { S.cleared(c.id); });
S.check();
check(S.has('team6') && !S.has('team12'), '6 marsupials have cleared maps: "Mob of Six"');
MG.CHARACTERS.forEach(function (c) { S.cleared(c.id); }); S.cleared('ghost'); S.check();
check(S.has('team12') && S.team() === 12, 'all 12: "The Whole Mob"');
// the practice corner
reset();
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0, practice: true })); frames(2);
scene().practice.finish(true);
check(!S.has('practice'), 'skipping the practice corner earns nothing');
reset();
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0, practice: true })); frames(2);
scene().practice.finish(false);
check(S.has('practice'), 'finishing it: "Top Student"');

// ---- duels: a person on this computer wins; beating the LEGEND CPU
reset();
MG.Engine.setScene(new MG.DuelScene({ stage: 0, players: [{ id: 0, cid: 'boomer', local: 'SOLO' }, { id: 1, cid: 'tank', local: null, cpu: 2 }] })); frames(2);
var duel = scene(); duel.slots[0].wins = MG.DUEL_WINS; duel.endMatch();
check(S.has('duel') && S.has('legend'), 'winning a duel against the LEGEND CPU: "Duel Winner" and "Legend Slayer"');
reset();
MG.Engine.setScene(new MG.DuelScene({ stage: 0, players: [{ id: 0, cid: 'boomer', local: 'SOLO' }, { id: 1, cid: 'tank', local: null, cpu: 0 }] })); frames(2);
duel = scene(); duel.slots[1].wins = MG.DUEL_WINS; duel.endMatch();
check(!S.has('duel') && !S.has('legend'), '...not when the CPU wins');
check(!S.earn('combo', duel.slots[1].f, duel), 'the CPU never earns stickers');
MG.Engine.setScene(new MG.DuelScene({ stage: 0, players: [{ id: 0, cid: 'boomer', local: 'SOLO' }, { id: 1, cid: 'tank', local: null, cpu: 0 }] })); frames(2);
duel = scene(); duel.slots[0].wins = MG.DUEL_WINS; duel.endMatch();
check(S.has('duel') && !S.has('legend'), 'beating an easier CPU: "Duel Winner" only');

// ---- the shop and what's saved
reset();
MG.Gear.addCoins('p1', 5000);
MG.Engine.setScene(new MG.ShopScene({ fromMenu: true })); frames(3);
var shop = scene(), sh = shop.shoppers[0];
sh.cur = 0; shop.press(sh);
check(S.has('shopper'), 'buying something: "First Purchase"');
shop.press(sh); shop.press(sh); frames(1);
check(S.has('maxed'), 'a weapon up to level 3: "Fully Loaded"');
reset();
MG.WORLDS[0].levels.forEach(function (id) { MG.Progress.clear(id); });
MG.Save.set('joeyLevels', { boomer: MG.JOEY_MAX_LEVEL });
MG.Unlocks.unlock('ghost');
var fresh = S.check();
check(['outback', 'joey5', 'ghost'].every(function (id) { return S.has(id); }) && !S.has('rainforest') && fresh.length === 3, 'from the saves: a world cleared, a joey at level 5, a secret unlocked');
check(S.toasts.length === 1 && S.toasts[0].ids.length === 3, '...all in one pop-up ("3 NEW STICKERS!")');
reset();
MG.Save.set('cleared', { 'outback-1': 1 }); MG.Engine.setScene(new MG.MenuScene()); frames(2);
check(!S.has('outback'), 'a world needs every one of its maps');
MG.WORLDS[0].levels.forEach(function (id) { MG.Progress.clear(id); }); MG.Engine.setScene(new MG.MenuScene()); frames(2);
check(S.has('outback'), 'the title screen checks the saves (players who got there before the book existed get theirs)');

// ---- the book
reset();
S.earn('combo', null, null, true); S.earn('ghost', null, null, true);
var menu = new MG.MenuScene(); MG.Engine.setScene(menu); frames(2);
var bookItem = menu.menu.items.find(function (it) { return /^STICKER BOOK/.test(label(it)); });
check(bookItem && label(bookItem) === 'STICKER BOOK  2/27', 'the title screen has STICKER BOOK  2/27');
bookItem.act(); frames(2);
var book = scene();
check(book instanceof MG.StickerScene && book.fresh.combo && book.fresh.ghost, 'it opens the book; new stickers get a NEW! tag');
var arts = [], realArt = MG.StickerArt.draw, texts = [];
MG.StickerArt.draw = function (c, s, x, y, r, got) { arts.push([s.id, got]); };
var bctx = new Proxy({}, { get: function (t, k) { if (k in t) return t[k]; if (k === 'measureText') return function () { return { width: 10 }; }; if (k === 'fillText') return function (s) { texts.push(String(s)); }; if (k === 'createLinearGradient' || k === 'createRadialGradient') return function () { return { addColorStop: noop }; }; return noop; }, set: function (t, k, v) { t[k] = v; return true; } });
book.sel = S.LIST.map(function (s) { return s.id; }).indexOf('cuscus');
book.draw(bctx);
MG.StickerArt.draw = realArt;
check(arts.length === 27 && arts.filter(function (a) { return a[1]; }).length === 2, 'the page shows all 27 spots, 2 of them stuck on');
check(texts.indexOf('???') >= 0 && texts.indexOf('2 of 27 stickers') >= 0 && texts.indexOf('Long-Lost Cousin') < 0, 'a secret you haven\'t found stays ???');
book.sel = S.LIST.map(function (s) { return s.id; }).indexOf('ghost'); texts = []; book.draw(bctx);
check(texts.some(function (t) { return /^Ghostly Friend/.test(t); }) && texts.some(function (t) { return /got it/.test(t); }), '...and once you have it, its name and "got it!"');
book.sel = 0; tap('ArrowLeft');
check(book.sel === 26, 'arrows move around the page (and wrap)');
tap('ArrowDown');
check(book.sel === 8, '...up and down by rows');
var c5 = book.cell(5);
MG.Input.pointer.x = c5.x; MG.Input.pointer.y = c5.y; MG.Input.pointer.pressed = true; frames(1);
check(book.sel === 5, 'a click or tap picks a sticker');
// every sticker's picture draws, got or not
var artErr = null;
S.LIST.forEach(function (s) { [true, false].forEach(function (got) { try { MG.StickerArt.draw(makeCtx(), s, 100, 100, 37, got, 1); } catch (e) { artErr = s.id + ': ' + e; } }); });
check(!artErr, 'every sticker\'s picture draws' + (artErr ? ' ' + artErr : ''));
MG.Engine.setScene(new MG.StickerScene()); frames(2);
check(!scene().fresh.combo, 'once seen, the NEW! tags go');
tap('Escape'); frames(2);
check(sceneName() === 'Menu', 'Esc goes back to the title screen');
reset();
done('stickers');
