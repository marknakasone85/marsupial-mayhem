// Milestone 2: home Wi-Fi. The host runs the game; friends send button presses and draw snapshots.
// (The real relay server is tested in test_server.py.)
var sent = [];
var realSend = MG.Net.send;
function recordSends() { sent = []; MG.Net.send = function (m, to) { sent.push({ m: m, to: to === undefined ? 'all' : to }); return true; }; }
function sentOf(t) { return sent.filter(function (s) { return s.m && s.m.t === t; }); }
function asHost() { MG.Net.role = 'host'; MG.Net.id = 0; MG.Net.status = 'connected'; MG.Net.code = '1234'; MG.Net.token = 'host'; MG.Net.address = 'http://192.168.0.5:8020'; MG.Net.lastHeard = performance.now(); }
function asGuest(id) { MG.Net.role = 'guest'; MG.Net.id = id; MG.Net.status = 'connected'; MG.Net.code = '1234'; MG.Net.token = 'g' + id; MG.Net.lastHeard = performance.now(); }
function offline() { MG.Net.role = null; MG.Net.id = null; MG.Net.status = 'off'; MG.Net.token = null; MG.Net.onMessage = null; }

// ---------------------------------------------------------------- 3 players play the whole map
function runCoop(li) {
  recordSends(); asHost();
  MG.Engine.setScene(new MG.CampaignScene({ level: li, net: true, players: [0, 1, 2].map(function (i) { return { id: i, cid: 'boomer', local: null }; }) }));
  var sc = scene(), guest = new MG.RemoteScene({ level: li });
  MG.Net.id = 1; guest.enter(); MG.Net.onMessage = null;
  var seq = 0, err = null, maxBytes = 0, sizes = [], i;
  for (i = 0; i < 60 * 300 && sc.state !== 'won'; i++) {
    if (sc.state === 'dead') { if (sc.menu && sc.checkpoint) sc.respawn(); else if (sc.menu) break; }
    sc.slots.forEach(function (sl, k) {
      var f = sl.f;
      var near = sc.targets('player').filter(function (t) { return t.alive && Math.abs(t.x - f.x) < 100 && Math.abs((t.box.y + t.box.h / 2) - (f.y - f.h / 2)) < 110; });
      var right = near.length ? near[0].x > f.x : true;
      var p = [];
      if (near.length && (i + k * 4) % 10 === 0) p.push('attackP');
      if (near.length && (i + k * 9) % 41 === 0) p.push('bigP');
      if (f.canSpecial && near.length) p.push('specialP');
      if (near.length >= 2 && f.grenades > 0 && (i + k * 30) % 150 === 0) p.push('grenadeP');
      if ((i + k * 13) % 90 === 0) p.push('jumpP');
      sc.netInput(sl.id, { n: ++seq, l: right ? 0 : 1, r: right ? 1 : 0, d: 0, s: f.weapon ? 1 : 0, j: 1, p: p });
    });
    frames(1);
    if (i % 2 === 0) {
      var txt = JSON.stringify(MG.Sync.snapshot(sc));
      maxBytes = Math.max(maxBytes, txt.length);
      sizes.push(txt.length);
      try { guest.onNet(JSON.parse(txt)); guest.update(1 / 30); guest.draw(MG.Engine.ctx); } catch (e) { if (!err) err = '' + e + (e.stack ? ' ' + e.stack.split('\n')[0] : ''); }
    }
  }
  check(sc.state === 'won' && !err, 'map ' + (li + 1) + ' ' + MG.LEVELS[li].name + ': 3 Wi-Fi players won in ' + Math.round(i / 60) +
    ' s, the guest view drew every update' + (err ? ' ERROR: ' + err : ''));
  sizes.sort(function (a, b) { return a - b; });
  var typical = sizes[Math.floor(sizes.length * 0.95)];
  check(typical < 3000, '95% of Wi-Fi updates are under ' + (typical / 1024).toFixed(1) + ' KB (the plan allows about 3 KB)');
  check(maxBytes < 4500, 'the biggest burst (a ground pound flattening several pests) is ' + (maxBytes / 1024).toFixed(1) + ' KB');
  check(sentOf('snap').length > 60 * 5, 'the host sent ' + sentOf('snap').length + ' updates (about 30 a second)');
}
for (var li = 0; li < MG.LEVELS.length; li++) runCoop(li);

// ---------------------------------------------------------------- the host's lobby
recordSends(); asHost();
var lob = new MG.LobbyScene({ resume: true, players: [{ id: 0, cid: 'boomer', ready: true }] });
MG.Engine.setScene(lob); frames(2);
check(lob.ready && sentOf('lobby').length >= 1, 'the lobby is open and tells everyone who is in it');
lob.onNet({ t: 'joined', id: 1 }, 'server');
check(lob.players.length === 2 && sentOf('welcome').some(function (s) { return s.to === 1 && s.m.inGame === false; }), 'a friend joins: welcomed to the lobby');
lob.onNet({ t: 'pick', cid: '__proto__', ready: true }, 1);
lob.onNet({ t: 'pick', cid: 'constructor', ready: true }, 1);
check(lob.players[1].cid === null && !lob.players[1].ready, 'made-up character names are ignored');
lob.onNet({ t: 'pick', cid: 'boomer', ready: true }, 1);
check(lob.players[1].ready && lob.players[1].cid === 'boomer', 'the friend picks Boomer and is READY');
lob.onNet({ t: 'pick', cid: 'boomer', ready: true }, 3);
check(lob.players.length === 2, 'a pick from someone who never joined is ignored');
tap('Enter'); frames(2);
var sc = scene();
check(sceneName() === 'Campaign' && sc.net && sc.slots.length === 2 && sc.slots[1].local === null, 'Enter starts the map with the host and the friend');
check(sentOf('start').length === 1, 'everyone is told the game started');
var p1 = sc.slots[1].f;
check(p1.coat === 1 && sc.slots[0].f.coat === 0, 'the friend\'s Boomer has a different coat');

// a friend's buttons arrive as messages
var x0 = p1.x;
sc.netInput(1, { n: 1, l: 0, r: 1, d: 0, s: 0, j: 0, p: [] }); frames(30);
check(p1.x > x0 + 60, 'holding right (sent over Wi-Fi) moves the friend\'s Boomer');
sc.netInput(1, { n: 2, l: 0, r: 0, d: 0, s: 0, j: 0, p: ['grenadeP', 'constructor', '__proto__'] }); frames(25);
check(sc.grenades.length === 1 && p1.grenades === MG.START_GRENADES - 1, 'the friend\'s grenade press drops a grenade');
check(!Object.prototype.hasOwnProperty.call(sc.slots[1].presses, 'constructor'), 'made-up button names are ignored');
sc.netInput(1, { n: 1, l: 1, r: 0, d: 0, p: [] }); frames(5);
check(!sc.slots[1].held.left, 'an old, late message cannot undo a newer one');

// a third player drops in during the game, then leaves
var rabbitHp = sc.enemies.find(function (e) { return e.type === 'rabbit'; }).maxHp;
sc.onNet({ t: 'joined', id: 2 }, 'server');
check(sentOf('welcome').some(function (s) { return s.to === 2 && s.m.inGame === true; }), 'someone joining mid-game is told a map is being played');
sc.onNet({ t: 'pick', cid: 'boomer', ready: true }, 2); frames(2);
check(sc.slots.length === 3 && sc.slots[2].f.coat === 2, 'they drop in next to the team in their own coat');
check(sc.enemies.find(function (e) { return e.type === 'rabbit'; }).maxHp > rabbitHp, 'pests get tougher for 3 players');
sc.onNet({ t: 'pick', cid: 'boomer', ready: true }, 2);
check(sc.slots.length === 3, 'a second "ready" from the same player does not add another Boomer');
sc.onNet({ t: 'left', id: 2 }, 'server');
check(sc.slots.length === 2, 'a player who leaves disappears from the game');

// a friend whose messages stop lets go of every key (no ghost walking off on its own)
sc.netInput(1, { n: 50, l: 0, r: 1, d: 0, p: [] }); frames(10);
var ghostX = sc.slots[1].f.x; frames(150);
check(!sc.slots[1].held.right && sc.slots[1].f.x - ghostX < 400, 'a friend whose connection stalls stops walking after a moment');
// the Wi-Fi connection drops and comes back: friends rejoin by themselves
sc.onRehosted();
check(sc.slots.length === 1 && sc.slots[0].local, 'after a reconnect only the host is left...');
sc.onNet({ t: 'pick', cid: 'boomer', ready: true }, 1);
check(sc.slots.length === 2, '...and friends drop back in when their game rejoins');

// pause menu: back to the lobby, or end the Wi-Fi game
sc.t = 5; tap('Escape'); frames(2);
check(!!menuItem(sc.menu, 'Back to Lobby') && !!menuItem(sc.menu, 'End Wi-Fi Game'), 'the host\'s pause menu has Back to Lobby and End Wi-Fi Game');
sent = [];
menuItem(sc.menu, 'Back to Lobby').act(); frames(2);
check(sceneName() === 'Lobby' && sentOf('toLobby').length === 1 && scene().players.length === 2, 'Back to Lobby keeps the same code and players');

// ---------------------------------------------------------------- a friend's device
recordSends(); asGuest(1);
var js = new MG.JoinScene(); MG.Engine.setScene(js); frames(2);
['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].forEach(function (k) { tap(k); });
check(js.code === '1234', 'typing the 4-digit code (no more than 4 digits)');
tap('Backspace');
check(js.code === '123', 'Backspace removes a digit');
js.onNet({ t: 'welcome', inGame: false });
check(js.phase === 'pick' && sentOf('pick').length === 1 && !sentOf('pick')[0].m.ready, 'welcomed: choose your character');
tap('Enter');
check(js.isReady && sentOf('pick').pop().m.ready === true, 'Enter = I\'m ready');
js.onNet({ t: 'start', mode: 'campaign', level: 0 });
var rs = scene();
check(sceneName() === 'Remote', 'when the host starts, the friend\'s screen shows the game');
// a real host scene makes the snapshots for this friend
asHost();
var hostScene = new MG.CampaignScene({ level: 0, net: true, players: [{ id: 0, cid: 'boomer', local: null }, { id: 1, cid: 'boomer', local: null }] });
asGuest(1);
hostScene.grenades.push(new MG.Grenade(300, 470, 0, 0, hostScene.slots[0].f));
var drawErr = null;
for (var n = 0; n < 20; n++) {
  try { rs.onNet(JSON.parse(JSON.stringify(MG.Sync.snapshot(hostScene)))); frames(1); } catch (e) { drawErr = '' + e; }
}
check(!drawErr && Object.keys(rs.players).length === 2 && rs.enemies.size > 0 && rs.nades.length === 1, 'the friend draws players, pests and grenades from the snapshots' + (drawErr ? ': ' + drawErr : ''));
check(rs.wantsTouch(), 'phones get touch buttons in a Wi-Fi game too');
var hf = hostScene.slots[1].f; hf.startJab(); var snapJab = JSON.parse(JSON.stringify(MG.Sync.snapshot(hostScene)));
hf.state = 'idle'; hf.move = null; var snapIdle = JSON.parse(JSON.stringify(MG.Sync.snapshot(hostScene)));
snapJab.pl[1].jab = 1; rs.onNet(snapJab); rs.onNet(snapIdle);
check(!rs.players[1].jab && !rs.players[1].mk, 'a finished punch is not left drawn on friends\' screens');
sent = [];
key('KeyG', true); frames(1); key('KeyG', false); frames(1);
key('KeyD', true); frames(3); key('KeyD', false); frames(1);
var ins = sentOf('in');
check(ins.some(function (s) { return s.to === 'host' && s.m.p.indexOf('grenadeP') >= 0; }), 'the friend\'s grenade key is sent to the host');
check(ins.some(function (s) { return s.m.r === 1; }), 'held keys (like right) are sent to the host');
tap('Escape');
check(!!rs.menu && !!menuItem(rs.menu, 'Leave Wi-Fi Game') && !!menuItem(rs.menu, 'Controls'), 'the friend\'s menu has Controls and Leave Wi-Fi Game');
tap('Escape');
rs.onNet({ t: 'snap', n: 1 });
check(!rs.menu, 'old updates that arrive late are ignored');
rs.onNet({ t: 'toLobby' });
check(sceneName() === 'Join' && scene().phase === 'pick', 'host goes back to the lobby: the friend gets ready again');
MG.Engine.setScene(rs); rs.onNet({ t: 'hostLeft', reason: 'The host ended the game.' });
check(!!rs.ended && !!menuItem(rs.menu, 'Back to Menu'), 'host ends the game: the friend sees GAME OVER and a way back');

// ---------------------------------------------------------------- the WI-FI menu
offline();
location.protocol = 'http:'; location.hostname = 'localhost';
var wf = new MG.WifiScene(); MG.Engine.setScene(wf); frames(2);
var hostSceneMade = false, realHost = MG.Net.host;
MG.Net.host = function () { hostSceneMade = true; return new Promise(function () {}); };
menuItem(wf.menu, 'HOST CO-OP GAME').act(); frames(2);
check(sceneName() === 'Lobby' && hostSceneMade && scene().mode === 'campaign', 'on the sharing computer, HOST CO-OP GAME opens the co-op lobby');
MG.Net.host = realHost;
location.hostname = '192.168.0.5';
wf = new MG.WifiScene(); MG.Engine.setScene(wf); frames(2);
menuItem(wf.menu, 'HOST BATTLE').act(); frames(2);
check(sceneName() === 'Wifi' && /localhost:8020/.test(wf.info.join(' ')), 'on another device, HOST explains it must be the sharing computer');
tap('Space');
menuItem(wf.menu, 'JOIN A GAME').act(); frames(2);
check(sceneName() === 'Join', 'on another device, JOIN A GAME asks for the code');
location.hostname = ''; location.protocol = 'file:';
MG.Net.send = realSend;
offline();
done('co-op');
