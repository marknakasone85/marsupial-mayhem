// Milestone 1: the Outback map, gates and checkpoints, Big Buck, winning and losing, settings,
// on-screen controls in every mode, and 2 players on one keyboard.
function fresh(players) {
  MG.Engine.setScene(new MG.CampaignScene(players ? { level: 0, players: players } : { charId: 'boomer', level: 0 }));
  frames(2);
  return scene();
}
function press(code, n) { key(code, true); frames(1); key(code, false); frames(n === undefined ? 20 : n); }

var sc = fresh(), L = MG.LEVELS[0];
check(MG.LEVELS.length >= 1 && L.world === 'THE OUTBACK', 'map 1 is in the Outback: ' + L.name);
check(L.length >= L.boss.x + 580, 'the map is long enough for the boss arena');
var types = {}; L.enemies.forEach(function (e) { types[e.type] = (types[e.type] || 0) + 1; });
check(types.rabbit >= 10 && types.cat >= 2 && types.pig >= 2 && L.boss.type === 'bigBuck', 'rabbits, cats, pigs and Big Buck: ' + JSON.stringify(types));
check(sc.platforms.length >= 3 && sc.crates.length >= 3 && sc.gates.length >= 1, 'platforms, crates and checkpoint gates');
check(sc.crates.some(function (c) { return c.label === 'GRIN ISLE'; }), 'one crate is stencilled GRIN ISLE (a clue)');
var hearts = sc.pickups.filter(function (p) { return p.type === 'heart'; });
var powers = sc.pickups.filter(function (p) { return MG.POWER_TYPES.indexOf(p.type) >= 0; });
check(sc.gates.every(function (g) { return hearts.some(function (h) { return h.x > g.x && h.x - g.x < 200; }); }), 'a heart after every gate');
check(hearts.some(function (h) { return h.x < sc.arenaX && sc.arenaX - h.x < 200; }), 'a heart before the boss');
check(powers.length === 2, 'two power-ups on the map');
check(sc.pickups.some(function (p) { return p.type === 'gatling'; }), 'the GUMNUT GATLING waits on a high platform');

// gates: closed until every pest in front of them is gone, then a checkpoint
var g0 = sc.gates[0], p = sc.player;
p.x = g0.x - 100; frames(5);
key('KeyD', true); frames(60); key('KeyD', false);
check(!g0.opened && p.x < g0.x, 'a closed gate stops Boomer');
check(sc.hudModel().gateLeft > 0, 'the gate hint says how many pests are left');
check(sc.enemies.filter(function (e) { return e.zone === 0 && e.type === 'cat'; }).every(function (e) { return !e.hidden; }), 'near the gate, hiding cats come out');
// a pest left far behind comes running to the gate
var straggler = sc.enemies.find(function (e) { return e.zone === 0 && e.type === 'pig'; });
sc.enemies.forEach(function (e) { if (e.zone === 0 && e !== straggler) e.alive = false; });
straggler.x = g0.x - 900; straggler.homeX = straggler.x; frames(60 * 5);
check(straggler.aggro && g0.x - straggler.x < 400, 'the last pest in front of a gate comes running, even from far behind');
sc.enemies.forEach(function (e) { if (e.zone === 0) e.alive = false; }); frames(5);
check(g0.opened && sc.checkpoint > g0.x, 'clear them and the gate opens: CHECKPOINT');

// knocked out: continue from the checkpoint with your grenades
p.grenades = 5; p.invuln = 0; p.powers = {}; p.joey.rescueUsed = true; // (the joey's rescue is tested in test_joey.js)
p.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(150);
check(sc.state === 'dead' && !!menuItem(sc.menu, 'Continue from Checkpoint'), 'knocked out: Continue from Checkpoint');
menuItem(sc.menu, 'Continue from Checkpoint').act(); frames(5);
check(sc.state === 'play' && sc.player.hp === sc.player.maxHp && Math.abs(sc.player.x - sc.checkpoint) < 60 && sc.player.grenades === 5,
  'back at the checkpoint, full health, grenades kept');

// Big Buck: wakes up in the arena, foot-thumps for rabbits, and can be beaten; then the finish line
sc = fresh(); p = sc.player;
sc.enemies.forEach(function (e) { if (!e.isBoss) e.alive = false; }); frames(5);
p.x = sc.arenaX + 150; sc.camX = sc.arenaX; frames(10);
check(sc.bossAwake && sc.enemies.indexOf(sc.boss) >= 0, 'Big Buck appears in his arena');
var boss = sc.boss, sawThump = false, sawLeap = false, sawRabbits = false;
for (var i = 0; i < 60 * 14; i++) {
  p.hp = p.maxHp; p.invuln = 1;
  frames(1);
  if (boss.state === 'thumpWind') sawThump = true;
  if (boss.state === 'leap') sawLeap = true;
  if (sc.enemies.some(function (e) { return e.type === 'rabbit' && e.alive; })) sawRabbits = true;
}
check(sawLeap && sawThump && sawRabbits, 'Big Buck leaps, thumps his foot and the warren answers with rabbits');
check(p.x >= sc.arenaX, 'players are kept in the arena during the fight');
for (i = 0; i < 40 && boss.alive; i++) boss.takeHit({ dmg: 30, kbx: 0, kby: 0, big: true, dir: 1 }, sc);
frames(200);
check(!boss.alive && !sc.enemies.some(function (e) { return e.alive; }), 'beat Big Buck and the rest of the warren scatters');
p = sc.player; p.invuln = 0;
key('KeyD', true); frames(400); key('KeyD', false);
check(sc.state === 'won' && sc.hpBonus > 0, 'reach the FINISH: STAGE CLEAR with a health bonus');
check((MG.Save.get('best', {}))[L.id] === sc.score, 'the best score is saved in the browser');
frames(80);
check(!!menuItem(sc.menu, 'Play Again') && !!menuItem(sc.menu, 'Main Menu'), 'the win screen offers Play Again and Main Menu');

// blood: ON by default (red drops), OFF turns it into confetti
sc = fresh(); p = sc.player;
var r = sc.addEnemy('rabbit', p.x + 50); r.hidden = false; sc.enemies.push(r);
MG.Settings.blood = true; sc.fx.parts = [];
r.takeHit({ dmg: 1, kbx: 0, kby: 0, dir: 1 }, sc);
check(sc.fx.parts.some(function (q) { return q.kind === 'drop' && q.color === '#d62828'; }), 'blood ON: red splatter');
MG.toggleBlood(); sc.fx.parts = [];
r.takeHit({ dmg: 1, kbx: 0, kby: 0, dir: 1 }, sc);
check(sc.fx.parts.some(function (q) { return q.kind === 'confetti'; }) && !sc.fx.parts.some(function (q) { return q.kind === 'drop'; }), 'blood OFF: confetti instead');
MG.toggleBlood();

// pause menu and controls are always there
sc = fresh(); sc.t = 5; frames(2);
tap('Escape'); frames(2);
check(sc.state === 'paused' && ['Resume', 'Controls', 'Blood: ON', 'Restart Map', 'Quit to World Map'].every(function (t) { return !!menuItem(sc.menu, t); }),
  'pause menu: Resume, Controls, Blood, Restart, Quit to World Map');
menuItem(sc.menu, 'Controls').act(); frames(2);
check(sc.showControls, 'Pause -> Controls opens the controls page');
tap('Escape'); frames(2); tap('Escape'); frames(2);
check(sc.state === 'play', 'Esc goes back to the game');
var strip = sc.hudModel().strips;
check(strip.length === 1 && strip[0].fighter === sc.player, 'the key-hint strip shows during play');

// phones: touch buttons appear in play and drive Boomer, including the grenade
MG.Touch.enabled = true;
sc = fresh(); sc.t = 5; p = sc.player; frames(2);
check(sc.wantsTouch() && sc.hudModel().strips.length === 0, 'touch buttons replace the key strip on phones');
MG.Input.keys.TouchGrenade = false; MG.Input.pressed.TouchGrenade = true; frames(25);
check(sc.grenades.length === 1, 'the BOOM button drops a grenade');
MG.Input.pressed.TouchAttack = true; frames(5);
check(sc.grenades[0].kicked > 0, 'the PUNCH button kicks it');
check(sc.hudModel().players[0].below, '...and the joey and pouch leave the top panel (they show on the buttons)');
check(MG.Touch.buttons.find(function (b) { return b.id === 'Attack'; }).label === 'PUNCH' && MG.Touch.buttons.find(function (b) { return b.id === 'Big'; }).label === 'KICK', 'the buttons say PUNCH and KICK');
// computers (a mouse or trackpad): every button in one row along the bottom, and a mouse click presses them
var phone = MG.Touch.layout();
check(phone.find(function (b) { return b.id === 'Pause'; }).y < 100, 'phones keep the thumb layout (pause at the top)');
window.matchMedia = function (q) { return { matches: /pointer: fine/.test(q) }; };
function rowOk(vw, vh) {
  window.innerWidth = vw; window.innerHeight = vh;
  var row = MG.Touch.layout(), ok = row.length === MG.Touch.buttons.length;
  row.forEach(function (b, i) {
    ok = ok && Math.abs(b.y - row[0].y) < 0.01 && b.y + b.r <= vh && b.y - b.r > vh * 0.78 && b.x - b.r >= 0 && b.x + b.r <= vw;
    row.forEach(function (c, j) { if (j > i) ok = ok && Math.hypot(b.x - c.x, b.y - c.y) > b.r + c.r; });
  });
  var at = function (id) { return row.find(function (b) { return b.id === id; }).x; };
  return ok && at('Left') < vw / 3 && at('Attack') > vw * 2 / 3 && at('Attack') === Math.max.apply(null, row.map(function (b) { return b.x; }));
}
check(rowOk(1280, 720) && rowOk(960, 540) && rowOk(700, 500) && rowOk(1920, 1080), 'computers: every button (pause too) in one row along the bottom, moving on the left and PUNCH at the right end, never overlapping, in any window size');
MG.Touch.enabled = true; MG.Touch.points.clear();
sc = fresh(); sc.t = 5; frames(2);
var punchB = MG.Touch.layout().find(function (b) { return b.id === 'Attack'; });
fire('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: punchB.x, clientY: punchB.y, preventDefault: noop }); frames(1);
var clicked = MG.Input.keys.TouchAttack === true && sc.player.state === 'attack';
fire('pointerup', { pointerType: 'mouse', pointerId: 1, clientX: punchB.x, clientY: punchB.y, preventDefault: noop }); frames(1);
check(clicked && !MG.Input.keys.TouchAttack, 'a mouse click on PUNCH punches (on a computer), and letting go releases it');
frames(40);
var kickB = MG.Touch.layout().find(function (b) { return b.id === 'Big'; });
fire('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: kickB.x, clientY: kickB.y, preventDefault: noop });
fire('pointerup', { pointerType: 'mouse', pointerId: 1, clientX: kickB.x, clientY: kickB.y, preventDefault: noop }); frames(1);
check(sc.player.move && sc.player.move.kind === 'kick', '...and a very quick click on KICK (let go before the next frame) still kicks');
fire('pointerdown', { pointerType: 'mouse', pointerId: 1, clientX: 480, clientY: 200, preventDefault: noop }); frames(1);
check(!Object.keys(MG.Input.keys).some(function (k) { return /^Touch/.test(k) && MG.Input.keys[k]; }), '...and a click away from the buttons presses nothing');
fire('pointerup', { pointerType: 'mouse', pointerId: 1, clientX: 480, clientY: 200, preventDefault: noop });
MG.Touch.enabled = false; MG.Touch.points.clear(); delete window.matchMedia; window.innerWidth = 960; window.innerHeight = 540;

// the key strip: punch and kick, the joey's level (and a bar while it rests) and the pouch's saved item
function texts(fn) {
  var out = [];
  var ctx = new Proxy({}, {
    get: function (t, p) {
      if (p in t) return t[p];
      if (p === 'measureText') return function (s) { return { width: String(s).length * 6 }; };
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return function () { return { addColorStop: noop }; };
      if (p === 'fillText') return function (s) { out.push(String(s)); };
      return noop;
    },
    set: function (t, p, v) { t[p] = v; return true; },
  });
  fn(ctx);
  return out;
}
sc = fresh(); sc.t = 5; frames(2);
var hm = sc.hudModel(), pouchDrawn = 0, realPouch = MG.UI.pouchItem;
MG.UI.pouchItem = function () { pouchDrawn++; };
sc.player.pouch = 'heart';
var stripT = texts(function (c) { MG.UI.keyStrip(c, sc.player, 1, {}); });
var duoT = texts(function (c) { MG.UI.keyStrip(c, sc.player, 1, { compact: true, layout: 'p1', x: 16, align: 'left', tag: 'P1' }); });
MG.UI.pouchItem = realPouch;
check(['punch', 'kick', 'joey Lv' + sc.player.joey.level, 'pouch'].every(function (w) { return stripT.indexOf(w) >= 0 && duoT.indexOf(w) >= 0; })
  && stripT.indexOf('attack') < 0 && stripT.indexOf('big') < 0, 'the key strip says punch and kick, and shows the joey\'s level and the pouch (both strips)');
check(pouchDrawn === 2, '...with the pouch\'s saved item on it');
sc.player.pouch = null;
var panelT = texts(function (c) { MG.CampaignHUD.draw(c, sc.hudModel()); });
check(hm.players[0].below && !panelT.some(function (w) { return /^JOEY|^POUCH$/.test(w); }), 'the top panel leaves out JOEY and POUCH while the strip shows them');
sc.showStrip = false;
panelT = texts(function (c) { MG.CampaignHUD.draw(c, sc.hudModel()); });
check(!sc.hudModel().players[0].below && panelT.some(function (w) { return /^JOEY Lv/.test(w); }) && panelT.indexOf('POUCH') >= 0, '...but keeps them when the on-screen controls are off');
sc.showStrip = true;

// ---- on a computer every key's job is labelled at the bottom during play (the owner, 15 Nov 2026)
function measured() {
  var labels = [];
  var ctx = new Proxy({}, {
    get: function (t, k) {
      if (k in t) return t[k];
      if (k === 'measureText') return function (str) { var m = /(\d+)px/.exec(t.font || '') || [0, 12]; return { width: String(str).length * +m[1] * 0.62 }; };
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return function () { return { addColorStop: noop }; };
      if (k === 'fillText') return function (str) { labels.push(String(str)); };
      return noop;
    },
    set: function (t, k, v) { t[k] = v; return true; },
  });
  return { ctx: ctx, labels: labels };
}
var allJobs = ['move', 'jump', 'block', 'punch', 'kick', 'special', 'shoot', 'grenade', 'joey Lv' + sc.player.joey.level, 'pouch', 'pause'];
var stripsOk = ['wasd', 'arrows', 'pad'].every(function (lay) {
  var r = measured(), where = MG.UI.keyStrip(r.ctx, sc.player, 1, { layout: lay });
  return where.x >= 0 && where.x + where.w <= 960 && allJobs.every(function (j) { return r.labels.indexOf(j) >= 0; });
});
check(stripsOk, 'the key strip labels every job (move, jump, block, punch, kick, special, shoot, grenade, joey, pouch, pause) and fits the screen, for keys, arrow keys and a gamepad');
var r1 = measured(), r2 = measured();
var left = MG.UI.keyStrip(r1.ctx, sc.player, 1, { layout: 'p1', compact: true, x: 16, align: 'left', tag: 'P1' });
var right = MG.UI.keyStrip(r2.ctx, sc.player, 1, { layout: 'p2', compact: true, x: 944, align: 'right', tag: 'P2' });
check(left.x >= 0 && left.x + left.w < right.x && right.x + right.w <= 960 && allJobs.slice(0, 10).every(function (j) { return r1.labels.indexOf(j) >= 0 && r2.labels.indexOf(j) >= 0; }),
  'two players: two labelled strips side by side, not overlapping');
['up', 'attack', 'big', 'special', 'shoot', 'grenade'].forEach(function (a, i) { MG.Keys.set('P1', a, ['NumpadMultiply', 'NumpadSubtract', 'NumpadDecimal', 'NumpadDivide', 'NumpadEnter', 'NumpadAdd'][i]); });
var rl = measured(), long = MG.UI.keyStrip(rl.ctx, sc.player, 1, { layout: 'wasd' });
MG.Keys.reset();
check(long.k < 1 && long.x >= 0 && long.x + long.w <= 960.5, 'long key names chosen in Settings: the strip shrinks to fit instead of running off the screen');
// it can't be switched off on a computer (phones and tablets keep their switch)
var wasTouch = MG.Touch.isTouchDevice;
MG.Touch.isTouchDevice = false; MG.Save.set('keyStrip', false);
var pcScene = fresh();
check(MG.stripOn() && pcScene.showStrip && pcScene.hudModel().strips.length === 1, 'on a computer the key hints are always on (even if they were switched off before)');
MG.cycleOnscreen(pcScene); var l1 = MG.onscreenLabel(pcScene), strips1 = pcScene.hudModel().strips.length;
MG.cycleOnscreen(pcScene); var l2 = MG.onscreenLabel(pcScene), strips2 = pcScene.hudModel().strips.length;
check(/BUTTONS/.test(l1) && /KEY HINTS/.test(l2) && strips2 === 1 && !MG.Touch.enabled, 'Pause > On-screen controls switches between key hints and buttons, never to nothing');
var setScene = new MG.SettingsScene({});
var hintRow = setScene.items.find(function (it) { return /^Key hints/.test(typeof it.label === 'function' ? it.label() : it.label); });
hintRow.change(1);
check(/ALWAYS ON/.test(hintRow.label()) && MG.stripOn(), 'Settings: "Key hints at the bottom: ALWAYS ON" on a computer');
MG.Touch.isTouchDevice = true;
check(!MG.stripOn(), '...while a phone or tablet can still switch them off');
MG.Touch.isTouchDevice = wasTouch; MG.Touch.enabled = false; MG.Save.set('keyStrip', true);
sc = fresh();

// ---- the screens around the game get the same labelled key bar (the owner, 15 Nov 2026)
function barOf(makeScene, setup) {
  var bars = [], real = MG.UI.keyBar;
  MG.UI.keyBar = function (c, items, opts) {
    var r = real.apply(this, arguments);
    bars.push({ labels: items.filter(function (it) { return Array.isArray(it); }).map(function (it) { return it[1]; }),
      keys: items.filter(function (it) { return Array.isArray(it); }).map(function (it) { return it[0].join(' '); }), where: r, opts: opts || {} });
    return r;
  };
  try {
    MG.Engine.setScene(makeScene()); frames(3);
    if (setup) setup(scene());
    bars.length = 0; // only the frame drawn here
    scene().draw(measured().ctx);
  } finally { MG.UI.keyBar = real; }
  return bars;
}
function barFits(b) { return b && b.where.x >= -0.5 && b.where.x + b.where.w <= 960.5; }
var solo = [{ id: 0, cid: 'boomer', local: 'SOLO' }], duo = [{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'tank', local: 'P2' }];
Object.keys(MG.STORY).forEach(function (id) { MG.Story.markSeen(id); }); // (straight to the map, no story panels)
var wm = barOf(function () { return new MG.WorldMapScene({ players: solo }); });
check(wm.length === 1 && barFits(wm[0]) && ['walk', 'play', 'shop', 'title screen'].every(function (l) { return wm[0].labels.indexOf(l) >= 0; }) && wm[0].keys.indexOf('B') >= 0 && wm[0].opts.x === 16,
  'world map: ← → walk, Enter play, B shop, Esc title screen (a box at the bottom left, under the stop\'s panel)');
var shopB = barOf(function () { return new MG.ShopScene({ players: solo, fromMenu: true }); });
check(shopB.length === 1 && barFits(shopB[0]) && ['buy', 'sell back'].every(function (l) { return shopB[0].labels.indexOf(l) >= 0; }) && shopB[0].keys.indexOf('X') >= 0, 'shop: look, Enter buy, X sell back, Esc');
var selB = barOf(function () { return new MG.SelectScene({ mode: 'campaign' }); });
check(selB.length === 1 && barFits(selB[0]) && selB[0].labels.indexOf('pick') >= 0 && selB[0].labels.indexOf('back') >= 0, 'character select: choose, Enter pick, Esc back');
var coopB = barOf(function () { return new MG.SelectScene({ mode: 'coop' }); });
check(coopB.length === 1 && barFits(coopB[0]) && coopB[0].keys.join('|') === 'W A S D|F|E|← ↑ ↓ →|,|.|Esc', 'two players picking: P1 W A S D, F pick, E change; P2 arrows, , pick, . change (the real keys)');
var setB = barOf(function () { return new MG.SettingsScene({}); });
var keysB = barOf(function () { return new MG.SettingsScene({}); }, function (st) { st.page = 'keys'; });
var waitB = barOf(function () { return new MG.SettingsScene({}); }, function (st) { st.page = 'keys'; st.waiting = true; });
check(setB.length === 1 && keysB.length === 1 && waitB.length === 1 && [setB, keysB, waitB].every(function (b) { return barFits(b[0]); }) && waitB[0].labels.indexOf('cancel') >= 0,
  'Settings and its keys pages (and while waiting for a new key)');
var lastKeyRow = new MG.SettingsScene({}).keyRect(MG.Keys.ACTIONS.length + 1);
check(lastKeyRow.y + lastKeyRow.h <= 490, '...with every key row above the bar');
var storyB = barOf(function () { return new MG.StoryScene({ id: 'opening', after: function () { return new MG.MenuScene(); } }); });
check(storyB.length === 1 && barFits(storyB[0]) && storyB[0].labels.indexOf('skip the story') >= 0, 'story panels: Enter next (any key), Esc skips the story');
var pauseB = barOf(function () { return new MG.CampaignScene({ charId: 'boomer', level: 0 }); }, function (c) { c.t = 6; c.pause(); });
check(pauseB.length === 1 && pauseB[0].labels.join() === 'choose,OK,back to the game', 'the pause menu: choose, OK, Esc back to the game');
var wonB = barOf(function () { return new MG.CampaignScene({ level: 0, net: true, players: [{ id: 0, cid: 'boomer', local: 'SOLO' }] }); }, function (c) { c.t = 6; c.win(); frames(1); });
var lastBtn = scene().menu.rect(scene().menu.items.length - 1);
check(wonB.length === 1 && scene().menu.items.length === 6 && lastBtn.y + lastBtn.h <= 490, 'Stage Clear (6 buttons on Wi-Fi): every button stays above the bar');
MG.Net.leave && MG.Net.leave();
var duelMenuB = barOf(function () { return new MG.DuelMenuScene(); });
check(duelMenuB.length === 1 && barFits(duelMenuB[0]), 'the Tournament Duel menu');
MG.Input.lastDevice = 'pad';
var padB = barOf(function () { return new MG.WorldMapScene({ players: solo }); });
MG.Input.lastDevice = 'wasd';
check(padB[0].keys.indexOf('A') >= 0 && padB[0].keys.indexOf('Y') >= 0 && padB[0].keys.indexOf('B') >= 0, '...with a gamepad\'s buttons when one is in use');
MG.Touch.enabled = true;
var tapB = barOf(function () { return new MG.WorldMapScene({ players: solo }); }).concat(barOf(function () { return new MG.ShopScene({ players: solo, fromMenu: true }); }));
MG.Touch.enabled = false;
check(tapB.length === 0, 'phones and tablets keep their tap hints instead');
MG.Touch.enabled = false;

// 2 players on one keyboard: separate controls, shared screen, tougher pests, revive after 5 s
sc = fresh([{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'boomer', local: 'P2' }]);
var a = sc.slots[0].f, b = sc.slots[1].f, ax = a.x, bx = b.x;
key('ArrowRight', true); frames(30); key('ArrowRight', false);
check(Math.abs(a.x - ax) < 2 && b.x > bx + 40, 'player 2 moves with the arrow keys only');
check(sc.enemies[0].maxHp > MG.ENEMY_TYPES[sc.enemies[0].type].hp, 'pests are tougher with two players');
check(b.coat === 1 && sc.hudModel().strips.length === 2, 'player 2 has a sandy coat and their own key strip');
b.invuln = 0; b.joey.rescueUsed = true; b.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(60 * 6);
check(sc.slots[1].f.state !== 'ko' && sc.state === 'play', 'a knocked-out partner hops back in after 5 seconds');

// ---- the practice corner (a new player's first map): a dummy and a coach board walk through the moves
localStorage.clear();
function practiceMap(players) {
  MG.Engine.setScene(new MG.CampaignScene(players ? { level: 0, players: players, practice: true } : { charId: 'boomer', level: 0, practice: true }));
  frames(2);
  return scene();
}
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0 })); frames(1);
var plain = scene().practice;
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 1, practice: true })); frames(1);
var second = scene().practice;
sc = practiceMap(); p = sc.player;
check(!!sc.practice && !plain && !second, 'the practice corner is on the first map, only when started from the world map (opts.practice)');
check(sc.targets('player').indexOf(sc.practice.dummy) >= 0 && sc.practice.view().say === 'PUNCH the dummy', 'the dummy stands there to hit, and the coach says: PUNCH the dummy');
var rx = sc.enemies.map(function (e) { return e.x; });
frames(120);
check(sc.enemies.every(function (e, i) { return Math.abs(e.x - rx[i]) < 1; }) && sc.player.hp === sc.player.maxHp, 'the pests wait while you practise');
// the moves, one by one
function nextTo() { p.x = sc.practice.dummy.x - 55; p.facing = 1; p.vx = 0; }
var score0 = sc.score;
[18, 18, 30].forEach(function (n) { nextTo(); press('KeyF', n); });
check(sc.practice.view().say === 'KICK it' && sc.score === score0, 'three punches on the dummy (no points for it), then: KICK it');
nextTo(); press('KeyE', 45);
check(sc.practice.view().say === 'JUMP', 'a kick, then: JUMP');
press('KeyW', 50);
check(sc.practice.view().say === 'BLOCK (hold it)', 'a jump, then: BLOCK');
key('KeyS', true); frames(40); key('KeyS', false); frames(5);
check(/GRENADE/.test(sc.practice.view().say), 'holding block, then: drop a GRENADE and punch or kick it');
p.grenades = 0; frames(2);
check(p.grenades === 1, 'out of grenades? the coach hands you one');
nextTo(); press('KeyG', 30); press('KeyF', 20);
check(sc.practice.done && !sc.practice.skipped && MG.Save.get('practiced', false) === true, 'a punted grenade finishes the practice (and it\'s saved)');
var view = sc.practice.view();
frames(60 * 4);
check(view && view.done && !sc.practice.view() && sc.targets('player').indexOf(sc.practice.dummy) < 0, '"READY! CLEAR THE PESTS" for 3 seconds, and the dummy is just scenery now');
var moved = sc.enemies.some(function (e, i) { return Math.abs(e.x - rx[i]) > 5; });
check(moved, '...and the pests come');
check(!practiceMap().practice, 'once it\'s done, the first map starts without it');
// walking on skips it; clearing the first map ends it too
localStorage.clear();
sc = practiceMap(); p = sc.player;
key('KeyD', true); frames(100); key('KeyD', false); frames(2);
check(sc.practice.done && sc.practice.skipped && !sc.practice.view() && MG.Save.get('practiced', false), 'walking on past the dummy skips the practice');
localStorage.clear(); MG.Progress.clear(MG.LEVELS[0].id);
check(!practiceMap().practice, 'no practice once the first map has been cleared');
localStorage.clear();
// the coach board: keys for this player (touch: the buttons; two players: both keys)
sc = practiceMap();
var board = texts(function (c) { MG.CampaignHUD.draw(c, sc.hudModel()); });
check(board.indexOf('PRACTICE CORNER') >= 0 && board.indexOf('PUNCH the dummy') >= 0 && board.indexOf(MG.Keys.label('P1', 'attack')) >= 0, 'the coach board shows the move and its key');
MG.Touch.enabled = true;
check(sc.hudModel().practice.keyNames[0][0] === 'PUNCH', '...the button name on a touch screen');
MG.Touch.enabled = false;
sc = practiceMap([{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'tank', local: 'P2' }]);
var kn = sc.hudModel().practice.keyNames;
check(kn.length === 2 && kn[0][0] === MG.Keys.label('P1', 'attack') && kn[1][0] === MG.Keys.label('P2', 'attack'), '...both players\' keys with two on one keyboard');
sc.restart(); frames(1);
check(!!scene().practice, 'Restart Map keeps the practice corner (until it\'s done)');
MG.Engine.setScene(new MG.CampaignScene({ level: 0, net: true, players: [{ id: 0, cid: 'boomer', local: 'SOLO' }], practice: true }));
check(!scene().practice, 'not in Wi-Fi games');
MG.Net.leave && MG.Net.leave();
localStorage.clear();
done('campaign');
