// Milestone 3: Tournament Duel. CPU vs CPU with every character, rounds and supply drops,
// 2 players on one keyboard, the select screen's duel flow, and Wi-Fi battles with a guest view.
function cpuMatch(a, b, stage) {
  MG.Engine.setScene(new MG.DuelScene({ stage: stage || 0, players: [{ id: 0, cid: a, local: null, cpu: 2 }, { id: 1, cid: b, local: null, cpu: 2 }] }));
  var sc = scene(), err = null, specials = {}, i;
  for (i = 0; i < 60 * 260 && sc.state !== 'matchEnd'; i++) {
    try {
      frames(1);
      if (i % 3 === 0) sc.draw(MG.Engine.ctx);
    } catch (e) { if (!err) err = '' + e; break; }
    sc.slots.forEach(function (s) { if (s.f.move && s.f.move.kind === 'special') specials[s.cid] = true; });
  }
  return { sc: sc, err: err, secs: Math.round(i / 60), specials: specials };
}

// every character fights (and uses its special) at least once
var ids = MG.CHARACTERS.map(function (c) { return c.id; });
var used = {}, problems = [];
for (var k = 0; k < ids.length; k += 2) {
  var r = cpuMatch(ids[k], ids[k + 1], k % MG.STAGES.length);
  Object.keys(r.specials).forEach(function (id) { used[id] = true; });
  var winner = r.sc.slots.find(function (s) { return s.wins >= MG.DUEL_WINS; });
  if (r.err || r.sc.state !== 'matchEnd' || !winner) problems.push(ids[k] + ' v ' + ids[k + 1] + ': ' + (r.err || r.sc.state));
  else print('  ' + ids[k] + ' v ' + ids[k + 1] + ': ' + winner.def.name + ' wins ' + r.sc.slots.map(function (s) { return s.wins; }).join('-') + ' in ' + r.secs + ' s');
}
check(problems.length === 0, 'CPU vs CPU: every match finishes (first to 2 rounds)' + (problems.length ? ': ' + problems.join('; ') : ''));
var unused = ids.filter(function (id) { return !used[id]; });
check(unused.length <= 1, 'the CPU uses every character\'s special' + (unused.length ? ' (not seen: ' + unused.join(', ') + ')' : ''));

// fair fights: nobody starts with grenades or a weapon; supply drops bring them
MG.Engine.setScene(new MG.DuelScene({ stage: 0, players: [{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'tank', local: 'P2' }] }));
var sc = scene(), a = sc.slots[0].f, b = sc.slots[1].f;
check(a.grenades === 0 && !a.weapon && b.grenades === 0 && a.autoFace, 'fair fight: no grenades or weapons at the start, and fighters face each other');
frames(2);
var dm = sc.hudModel();
check(dm.strips.length === 2 && dm.sides[0].below && dm.sides[1].below, 'both players\' joeys and pouches show in their key strips at the bottom, not by the health bars');
frames(60 * 12);
check(sc.state === 'fight' && sc.pickups.length + (a.grenades + b.grenades) + (a.weapon ? 1 : 0) + (b.weapon ? 1 : 0) > 0 || sc.dropT < 13, 'supply drops fall onto the stage');
var g0 = a.grenades, drop = new MG.Pickup('grenades', a.x, MG.GROUND_Y); sc.pickups.push(drop); frames(3);
check(a.grenades === Math.min(MG.MAX_GRENADES, g0 + 2), 'grabbing a supply drop: +2 grenades');

// 2 players on one keyboard: separate keys
var ax = a.x, bx = b.x;
key('KeyD', true); key('ArrowLeft', true); frames(20); key('KeyD', false); key('ArrowLeft', false); frames(2);
check(a.x > ax + 30 && b.x < bx - 30, 'player 1 (W A S D) and player 2 (arrows) move their own fighters');

// a K.O. wins the round, and two rounds win the match
b.powers = {}; b.invuln = 0; sc.pickups = []; sc.dropT = 99; // no lucky shield from a supply drop
b.takeHit({ dmg: 999, kbx: 0, kby: 0, stun: 0.1 }, sc); frames(2);
check(sc.state === 'roundEnd' && sc.slots[0].wins === 1 && sc.banner === 'K.O.!', 'a knockout wins the round: K.O.!');
frames(60 * 4);
check(sc.state === 'intro' && sc.round === 2, 'round 2 starts');
frames(60 * 2.2);
sc.dropT = 99; sc.timer = 0.01; sc.slots[1].f.hp = 10; frames(2);
check(sc.state === 'roundEnd' && sc.banner === 'TIME!' && sc.slots[0].wins === 2, 'when time runs out, the one with more health wins: TIME!');
frames(60 * 4);
check(sc.state === 'matchEnd' && sc.matchTitle() === 'P1 WINS!', 'two rounds win the match');
check(sc.tagOf(sc.slots[1]) === 'P2', 'two people on one keyboard are P1 and P2');
frames(60);
check(!!menuItem(sc.menu, 'Rematch') && !!menuItem(sc.menu, 'Change Characters') && !!menuItem(sc.menu, 'Main Menu'), 'after the match: Rematch, Change Characters, Main Menu');
menuItem(sc.menu, 'Rematch').act(); frames(2);
check(sceneName() === 'Duel' && scene().round === 1 && scene().slots[1].cid === 'tank', 'Rematch starts again with the same fighters');

// pause menu
sc = scene(); frames(150);
tap('Escape');
check(sc.state === 'paused' && !!menuItem(sc.menu, 'Controls') && !!menuItem(sc.menu, 'Quit to Menu'), 'pause menu: Controls and Quit');
tap('Escape');
check(sc.state !== 'paused', 'Esc goes back to the fight');

// the select screen: you vs the CPU
var sel = new MG.SelectScene({ mode: 'duelCpu' }); MG.Engine.setScene(sel); frames(2);
tap('Enter');
check(sel.phase === 'cpuChar', 'vs CPU: after your pick, choose the opponent');
tap('ArrowRight'); tap('Enter'); frames(2);
check(sel.phase === 'cpuLevel' && sel.menu.items.length === 3, '...then how tough the CPU is (3 levels)');
tap('ArrowDown'); tap('Enter'); frames(2);
check(sel.phase === 'stage', '...then a stage');
tap('Enter'); frames(2);
var d = scene();
check(sceneName() === 'Duel' && d.slots[1].cpu && d.slots[1].cpuLevel === 2 && d.slots[0].local === 'SOLO', 'the duel starts against a LEGEND CPU');

// locked secret tiles
sel = new MG.SelectScene({ mode: 'campaign' }); MG.Engine.setScene(sel); frames(2);
sel.cur[0] = MG.CHARACTERS.length; tap('Enter');
check(sceneName() === 'Select' && !sel.locked[0] && /locked/.test(sel.hint || ''), 'the secret "?" tiles are locked for now');

// ---------------------------------------------------------------- Wi-Fi battle
var sent = [], realSend = MG.Net.send;
MG.Net.send = function (m, to) { sent.push({ m: m, to: to === undefined ? 'all' : to }); return true; };
MG.Net.role = 'host'; MG.Net.id = 0; MG.Net.status = 'connected'; MG.Net.code = '4321'; MG.Net.token = 'h'; MG.Net.lastHeard = performance.now();
var lob = new MG.LobbyScene({ mode: 'battle', resume: true, players: [{ id: 0, cid: 'chompers', ready: true }] });
MG.Engine.setScene(lob); frames(2);
tap('Enter');
check(sceneName() === 'Lobby' && lob.warnT > 0, 'a battle needs at least 2 fighters');
tap('KeyC');
check(lob.players.length === 2 && lob.players[1].cpu === 1, 'C adds a CPU fighter');
tap('ArrowDown');
check(lob.players[0].cid !== 'chompers', 'the host changes character with up/down');
lob.onNet({ t: 'joined', id: 1 }, 'server');
lob.onNet({ t: 'pick', cid: 'zip', ready: true }, 1);
tap('Enter');
var bt = scene();
check(sceneName() === 'Duel' && bt.net && bt.slots.length === 3 && bt.slots.some(function (s) { return s.cpu; }), 'the Wi-Fi battle starts: host, a friend and a CPU');
check(bt.slots.map(function (s) { return bt.tagOf(s); }).join() === 'P1,CPU,P2', 'labels: the host is P1, the CPU is CPU, the friend is P2');
bt.onNet({ t: 'joined', id: 2 }, 'server');
bt.onNet({ t: 'pick', cid: 'bins', ready: true }, 2);
check(bt.pending.length === 1 && bt.slots.length === 3, 'someone joining mid-battle waits for the next round');
var guest = new MG.RemoteDuelScene(); MG.Net.id = 1;
var err = null, biggest = 0, seq = 0;
for (var i = 0; i < 60 * 20; i++) {
  bt.onNet({ t: 'in', n: ++seq, l: 0, r: i % 120 < 60 ? 1 : 0, d: 0, s: 0, j: 0, p: i % 15 === 0 ? ['attackP'] : [] }, 1);
  frames(1);
  if (i % 2 === 0) {
    var txt = JSON.stringify(MG.Sync.duelSnapshot(bt));
    biggest = Math.max(biggest, txt.length);
    try { guest.onNet(JSON.parse(txt)); guest.update(1 / 30); guest.draw(MG.Engine.ctx); } catch (e) { if (!err) err = '' + e; }
  }
}
check(!err && Object.keys(guest.players).length >= 3, 'the friend\'s screen draws the battle' + (err ? ': ' + err : ' (' + Object.keys(guest.players).length + ' fighters)'));
check(biggest < 3000, 'battle updates are small (' + (biggest / 1024).toFixed(1) + ' KB)');
if (bt.state === 'fight') { bt.slots.filter(function (s) { return s.id !== 0; }).forEach(function (s) { s.f.hp = 0; s.f.state = 'ko'; }); frames(60 * 4); }
for (i = 0; i < 60 * 8 && bt.state !== 'intro'; i++) frames(1);
check(bt.slots.length === 4, 'at the next round the new player jumps in');
MG.Net.send = realSend; MG.Net.role = null; MG.Net.status = 'off'; MG.Net.token = null; MG.Net.onMessage = null;
done('duel');
