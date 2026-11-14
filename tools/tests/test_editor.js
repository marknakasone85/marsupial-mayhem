// Milestone 8: the level editor (tools/editor.html, a developer tool). Its rules live in
// tools/editor-core.js, checked here; the page itself is checked by opening it.
load('tools/editor-core.js');
var E = MG.EditorCore;

// the page loads the same game scripts as index.html (except main.js, which starts the game)
var game = []; readFile('index.html').replace(/<script src="js\/([^"]+)"/g, function (m, s) { if (s !== 'main.js') game.push(s); return m; });
var ed = []; readFile('tools/editor.html').replace(/<script src="\.\.\/js\/([^"]+)"/g, function (m, s) { ed.push(s); return m; });
check(game.join() === ed.join(), 'the editor loads the same game scripts as index.html' + (game.join() === ed.join() ? '' : ' (update tools/editor.html: ' + game.filter(function (s) { return ed.indexOf(s) < 0; }).join(', ') + ')'));
check(!/share_server|net\/send/.test(readFile('tools/editor.js')), 'the editor never talks to the network');

// building a map
var L = E.blank('my-test-map');
check(E.check(L).some(function (p) { return /No pests/.test(p); }), 'an empty map says it needs pests');
E.place(L, 'platform', 600, 360, { w: 200 });
var rab = E.place(L, 'pest', 700, 470, { type: 'rabbit' });
E.place(L, 'pest', 900, 300, { type: 'laceMonitor' });
E.place(L, 'crate', 1000, 470, { loot: 'w:snag' });
E.place(L, 'coin', 620, 330, { v: 5 });
E.place(L, 'decor', 400, 470, { type: 'sign' });
E.place(L, 'npc', 800, 470, { type: 'quokka' });
E.place(L, 'gate', 1500, 470);
E.place(L, 'water', 2200, 470, { w: 400 });
E.place(L, 'npc', 2200, 470, { type: 'croc' });
E.place(L, 'grass', 1200, 470, { w: 240 });
E.place(L, 'pickup', 1800, 470, { type: 'heart' });
E.place(L, 'boss', 3200, 470, { type: 'bigBuck' });
check(L.platforms.length === 1 && L.platforms[0].x === 500 && L.enemies.length === 2 && L.enemies[1].y === 300 && L.coins[0].v === 5 && L.decor[0].text,
  'every tool places the right thing (platforms centred on the click, a lace monitor up high, a 5-coin, a signpost text)');
check(L.length >= 3200 + 580, 'placing a boss makes the map long enough for its arena');
check(E.check(L).length === 0, 'this map passes every check: ' + E.check(L).join('; '));
var sel = E.pick(L, 702, 455);
check(sel && sel.item === rab, 'clicking near the rabbit picks it');
E.move(L, sel, 50, 0);
check(rab.x === 750, '...dragging moves it');
E.remove(L, sel);
check(L.enemies.indexOf(rab) < 0, '...Delete removes it');
check(E.pick(L, 600, 362).list === 'platforms', 'clicking a platform\'s top picks the platform');
E.place(L, 'gate', 2250, 470);
check(E.check(L).some(function (p) { return /in the water/.test(p); }), 'a gate in the water is flagged');
L.gates.pop();
E.place(L, 'npc', 100, 470, { type: 'croc' });
check(E.check(L).some(function (p) { return /out of the water/.test(p); }), 'a croc out of the water is flagged');
L.npcs.pop();
L.id = MG.LEVELS[0].id;
check(E.check(L).some(function (p) { return /already uses/.test(p); }), 'reusing another map\'s id is flagged');
L.id = 'my-test-map';

// the exported text is a real map the game can play
var text = E.serialize(L);
var back = eval('(' + text.replace(/,\s*$/, '') + ')');
check(back.id === 'my-test-map' && back.platforms.length === 1 && Array.isArray(back.decor) && !('_water' in back), 'Export gives text to paste into MG.LEVELS');
MG.LEVELS.push(back);
var err = null;
try {
  var sc = new MG.CampaignScene({ charId: 'boomer', level: MG.LEVELS.length - 1 }); MG.Engine.setScene(sc); frames(30);
  sc.camX = 1800; sc.draw(MG.Engine.ctx);
} catch (e) { err = '' + e; }
MG.LEVELS.pop();
check(!err, 'an exported map loads and plays in the game' + (err ? ': ' + err : ''));
// every existing map round-trips through the editor unchanged
var same = MG.LEVELS.every(function (M) { var c = eval('(' + E.serialize(M).replace(/,\s*$/, '') + ')'); return JSON.stringify(c.enemies) === JSON.stringify(M.enemies) && c.length === M.length && c.id === M.id; });
check(same, 'every existing map opens in the editor and exports unchanged');
done('editor');
