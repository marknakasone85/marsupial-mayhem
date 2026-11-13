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
check(sc.state === 'paused' && ['Resume', 'Controls', 'Blood: ON', 'Restart Map', 'Quit to Menu'].every(function (t) { return !!menuItem(sc.menu, t); }),
  'pause menu: Resume, Controls, Blood, Restart, Quit');
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
check(sc.grenades[0].kicked > 0, 'the HIT button kicks it');
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
done('campaign');
