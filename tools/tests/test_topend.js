// The Top End (a bonus world around Darwin, with saltwater crocodiles and Old Snapjaw), and the shop
// from the world map: the big SHOP button, coming back to the same stop, and shopping after every map.
load('tools/editor-core.js');
function fresh() { localStorage.clear(); }
function lv(id) { return MG.LEVELS.findIndex(function (L) { return L.id === id; }); }
function press(code, n) { key(code, true); frames(1); key(code, false); frames(n === undefined ? 2 : n); }
function seeAll() { Object.keys(MG.STORY).forEach(function (id) { MG.Story.markSeen(id); }); }
var players = [{ id: 0, cid: 'boomer', local: 'SOLO' }];
fresh();

// ---- the map and where it sits
var D = lv('darwin-1'), L = MG.LEVELS[D];
check(D === 26 && MG.LEVELS.slice(0, 26).every(function (M, i) { return M.id !== 'darwin-1'; }), 'DARWIN HARBOUR is appended as map 27 (no map moved or replaced)');
check(L.after === 'rainforest-3' && L.theme === 'topend' && L.boss.type === 'snapjaw' && MG.MAP_STOPS['darwin-1'], 'it opens after the Rainforest, on the north coast of the world map');
var topend = MG.WORLDS.find(function (w) { return w.id === 'topend'; });
check(topend && topend.bonus && topend.levels[0] === 'darwin-1', 'THE TOP END is a bonus world');
check(L.enemies.filter(function (e) { return e.type === 'crocLand'; }).length >= 3 && L.npcs.filter(function (n) { return n.kind === 'croc'; }).length === 2, 'salties on the mud, and crocs lurking in the harbour water');
check(MG.EditorCore.check(L).length === 0, 'the level editor finds no problems with it' + (MG.EditorCore.check(L).length ? ': ' + MG.EditorCore.check(L).join('; ') : ''));
check(!MG.Progress.isOpen(D), 'locked at first');
MG.Progress.clear('rainforest-3');
check(MG.Progress.isOpen(D) && MG.Progress.next(lv('rainforest-3')) === lv('cane-1'), 'clearing Big Tom\'s Den opens it (and Next Map still goes on to the Cane Fields)');
check(MG.Progress.next(D) === -1 && MG.Progress.next(lv('iom-1')) === -1 && MG.Progress.next(lv('grin-4')) === -1, 'after a bonus map there\'s no "Next Map"');
var order = MG.WorldMapScene.walkOrder();
check(order.indexOf('darwin-1') === order.indexOf('rainforest-3') + 1 && order.indexOf('iom-1') === order.indexOf('outback-1') + 1, 'the arrow keys walk to it right after the Rainforest (and to the Isle of Man after map 1)');

// walking there and the story
fresh(); seeAll();
var seen = MG.Save.get('story', {}); delete seen.topend; MG.Save.set('story', seen);
['outback-1', 'outback-2', 'outback-3', 'outback-4', 'rainforest-1', 'rainforest-2', 'rainforest-3'].forEach(function (id) { MG.Progress.clear(id); });
var map = new MG.WorldMapScene({ players: players, at: lv('rainforest-3') }); MG.Engine.setScene(map); frames(3);
check(map.stops[map.cur] === 'rainforest-3', 'standing on Big Tom\'s Den');
check(map.stops[map.startStop()] === 'cane-1', 'the map still starts you on the main path (not the bonus)');
press('ArrowRight', 2); frames(60);
check(map.stops[map.cur] === 'darwin-1', 'right: walk to the Top End');
var drawErr = null; try { map.draw(MG.Engine.ctx); } catch (e) { drawErr = '' + e; }
check(!drawErr, 'the world map draws with the new stop' + (drawErr ? ': ' + drawErr : ''));
press('Enter', 2);
check(scene() instanceof MG.StoryScene && scene().id === 'topend', 'the Top End story plays the first time');
for (var pg = 0; pg < MG.STORY.topend.length; pg++) { frames(25); press('Space', 2); }
check(sceneName() === 'Campaign' && scene().L.id === 'darwin-1', '...then DARWIN HARBOUR starts');
var sc = scene();
drawErr = null; try { for (var k = 0; k < 6; k++) { sc.camX = k * 900; sc.draw(MG.Engine.ctx); } } catch (e) { drawErr = '' + e; }
check(!drawErr, 'the whole map draws' + (drawErr ? ': ' + drawErr : ''));

// Old Snapjaw
sc.enemies = [sc.boss]; sc.npcs = [];
sc.gates.forEach(function (g) { g.opened = true; });
var boss = sc.boss;
check(boss && boss.d.name === 'OLD SNAPJAW' && boss.d.native && boss.d.captain, 'the boss is OLD SNAPJAW, a huge saltie in a captain\'s cap');
sc.player.x = sc.arenaX + 200; sc.camX = sc.arenaX; if (sc.player.joey) sc.player.joey.cool = 9999; frames(5);
var moves = {}, said = {};
var realText = sc.fx.text;
sc.fx.text = function (x, y, str) { said[str] = 1; return realText.apply(this, arguments); };
for (var i = 0; i < 60 * 25 && Object.keys(moves).length < 4; i++) {
  frames(1);
  if (/Wind$/.test(boss.state)) moves[boss.state.replace('Wind', '')] = 1;
  sc.player.hp = sc.player.maxHp; sc.player.invuln = 1;
}
sc.fx.text = realText;
check(moves.chomp && moves.tail && moves.leap && moves.roll, 'he chomps, sweeps his tail, croc-jumps and death-rolls (' + Object.keys(moves).join(', ') + ')');
check(said['CROC JUMP!'], '...and shouts CROC JUMP! before he leaps');
drawErr = null; try { ['chomp', 'roll', 'tailWind', 'leapWind', 'leap'].forEach(function (s) { boss.state = s; boss.stateT = 0.2; boss.draw(MG.Engine.ctx, sc); }); } catch (e) { drawErr = '' + e; }
check(!drawErr, 'every pose draws' + (drawErr ? ': ' + drawErr : ''));
boss.takeHit({ dmg: 9999, kbx: 0, kby: 0, big: true, from: sc.player }, sc); frames(60);
check(!boss.alive && sc.state !== 'lost', 'beaten, he swims off in a huff (no blood: salties are natives)');
sc.player.x = sc.goalX; frames(80);
check(sc.state === 'won' && MG.Progress.isCleared('darwin-1') && !menuItem(sc.menu, 'Next Map') && menuItem(sc.menu, 'World Map'), 'cleared: World Map (no Next Map after a bonus)');

// ---- shopping after a map: a standout line, and two ways out of the shop
var shopLine = sc.menu.items.find(function (it) { return /^Shop/.test(typeof it.label === 'function' ? it.label() : it.label); });
check(shopLine && shopLine.accent && sc.menu.items.indexOf(shopLine) <= 1, 'STAGE CLEAR: the Shop line stands out, near the top, with your coins');
shopLine.act(); frames(2);
check(sceneName() === 'Shop' && scene().opts.toMap && scene().opts.mapAt === D, 'after a bonus map the shop leads back to the map');
press('Escape', 3);
check(scene() instanceof MG.WorldMapScene && scene().stops[scene().cur] === 'darwin-1', '...standing at Darwin again');

fresh(); seeAll();
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0 })); sc = scene(); frames(3);
sc.boss = null; sc.enemies = []; sc.gates.forEach(function (g) { g.opened = true; });
sc.player.x = sc.goalX; frames(80);
var items = sc.menu.items.map(function (it) { return typeof it.label === 'function' ? it.label() : it.label; });
check(items[0] === 'Next Map' && /^Shop/.test(items[1]), 'after map 1: Next Map, then Shop');
menuItem(sc.menu, 'Shop: spend your coins').act(); frames(2);
var shop = scene();
check(shop.hasMapButton() && shop.level === 1, 'the shop\'s PLAY goes on to map 2, and there\'s a WORLD MAP button too');
var mr = shop.mapRect();
MG.Input.pointer.x = mr.x + 10; MG.Input.pointer.y = mr.y + 10; MG.Input.pointer.pressed = true; frames(2);
check(scene() instanceof MG.WorldMapScene && scene().stops[scene().cur] === 'outback-1', 'WORLD MAP: back to the map, at the map you just cleared');
// and when you lose
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0 })); sc = scene(); frames(3);
if (sc.player.joey) sc.player.joey.rescueUsed = true;
sc.player.invuln = 0; sc.player.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(60 * 3);
var lost = sc.menu && sc.menu.items.find(function (it) { return /^Shop/.test(it.label); });
check(lost && lost.accent, 'knocked out: "Shop, then try again" stands out too');
if (lost) { lost.act(); frames(2); }
check(sceneName() === 'Shop' && scene().level === 0 && scene().hasMapButton(), '...PLAY tries this map again');

// ---- the big SHOP button on the world map
fresh(); seeAll();
['outback-1', 'outback-2'].forEach(function (id) { MG.Progress.clear(id); });
MG.Gear.addCoins('p1', 500);
map = new MG.WorldMapScene({ players: players, at: 2 }); MG.Engine.setScene(map); frames(3);
var stopBefore = map.stops[map.cur];
check(stopBefore === 'outback-3', 'standing on map 3');
check(MG.Gear.canBuySomething('p1'), 'with 500 coins there\'s something new to buy (the button shows "!")');
var r = map.shopRect();
MG.Input.pointer.x = r.x + 20; MG.Input.pointer.y = r.y + 20; MG.Input.pointer.pressed = true; frames(2);
check(sceneName() === 'Shop' && scene().opts.toMap && scene().opts.mapAt === 2, 'tap SHOP on the map: the platypus\'s shop');
press('KeyF');
check(MG.Gear.get('p1').weapon === 'shanghai', 'buy something...');
press('Escape', 3);
check(scene() instanceof MG.WorldMapScene && scene().stops[scene().cur] === stopBefore, '...and you\'re back where you were on the map');
map = scene(); press('KeyB', 2);
check(sceneName() === 'Shop', 'B opens the shop from the map too');
press('Escape', 3);
check(scene() instanceof MG.WorldMapScene && scene().stops[scene().cur] === stopBefore, '...and comes back to the same stop');
// the shop stop is still on the map
map = scene(); map.cur = 0; map.pos = MG.MAP_STOPS.shop.slice(); map.choose(); frames(2);
check(sceneName() === 'Shop' && scene().opts.mapAt === 'shop', 'the shop is still a stop on the map');
press('Escape', 3);
check(scene() instanceof MG.WorldMapScene && scene().stops[scene().cur] === 'shop', '...and you come back to it');
done('topend');
