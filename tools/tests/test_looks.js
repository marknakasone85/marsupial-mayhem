// The graphics pass (14 Nov 2026): the title screen's cast, logo and quokka, light and atmosphere in
// every world (MG.Light), its Settings switch and the safety net for slow devices; and livelier
// movement: squash and stretch, ears and tails that follow through, and motion smears.
function fresh() { localStorage.clear(); MG.Settings.lighting = true; MG.Settings.contrast = false; }
// a drawing context that writes down what's drawn: calls, and blend modes as 'op:<mode>'
function recCtx() {
  var log = [], store = {};
  var ctx = new Proxy(store, {
    get: function (t, p) {
      if (p in t) return t[p];
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return function () { log.push(p); return { addColorStop: function () {} }; };
      if (p === 'measureText') return function () { return { width: 10 }; };
      return function () { log.push(p); if (p === 'scale' || p === 'lineTo') log.push([p, arguments[0], arguments[1]]); };
    },
    set: function (t, p, v) { if (p === 'globalCompositeOperation') log.push('op:' + v); t[p] = v; return true; },
  });
  return { ctx: ctx, log: log, has: function (x) { return log.indexOf(x) >= 0; } };
}
fresh();

// ---- the title screen
var drawn = {}, poses = {}, quokkaGrin = 0;
var realChar = MG.Art.character, realQuokka = MG.Art.quokka;
MG.Art.character = function (ctx, def, o) { drawn[def.id] = (drawn[def.id] || 0) + 1; (poses[def.id] = poses[def.id] || {})[o.pose] = 1; return realChar.apply(this, arguments); };
MG.Art.quokka = function (ctx, x, y, o) { if (o && o.grin > quokkaGrin) quokkaGrin = o.grin; return realQuokka.apply(this, arguments); };
var m = new MG.MenuScene(); MG.Engine.setScene(m); frames(2);
check(m.intro !== null && m.intro < 0.5, 'the logo drops in letter by letter the first time');
frames(60 * 3);
check(m.intro === null, '...and then stays put');
var m2 = new MG.MenuScene(); MG.Engine.setScene(m2); frames(2);
check(m2.intro === null, 'coming back to the title screen, the logo is already there');
drawn = {}; frames(1);
var cast = MG.CHARACTERS.filter(function (c) { return drawn[c.id]; });
check(cast.length === 12, 'all 12 marsupials stand on the title screen (' + cast.length + ')');
check(!drawn.ghost && !drawn.cuscus, 'the secret characters stay hidden until they\'re unlocked');
poses = {}; quokkaGrin = 0;
frames(60 * 12);
var hopped = MG.CHARACTERS.filter(function (c) { return poses[c.id] && (poses[c.id].jump || poses[c.id].win); });
check(hopped.length === 12, 'everyone joins the Mexican wave (' + hopped.length + ' of 12)');
check(poses.boomer.jump && poses.drowsy.win, '...kangaroos hop, the others jump up cheering');
check(quokkaGrin > 0.5, 'the Smile Squad quokka on the mesa grins now and then');
MG.Unlocks.unlock('ghost'); MG.Unlocks.unlock('cuscus');
drawn = {}; frames(1);
check(drawn.ghost && drawn.cuscus, 'unlocked secret characters join the line-up at the back');
check(drawn.boomer >= 2, 'the joeys come too (a mini Boomer on his back)');
MG.Art.character = realChar; MG.Art.quokka = realQuokka;
fresh();
var err = null;
try { var r = recCtx(); for (var i = 0; i < 5; i++) m2.draw(r.ctx); } catch (e) { err = '' + e; }
check(!err, 'the title screen draws' + (err ? ': ' + err : ''));
m2.menu.sel = 0; tap('Enter'); frames(5);
check(sceneName() === 'Select', 'the menu still works in front of the cast (PLAY)');

// ---- light and atmosphere in every world
var themes = {};
MG.LEVELS.forEach(function (L) { themes[L.theme || 'outback'] = 1; });
var missing = Object.keys(themes).filter(function (th) { return !MG.Light.LOOKS[th]; });
check(missing.length === 0, 'every world has its own light (' + Object.keys(themes).length + ' worlds)' + (missing.length ? ': missing ' + missing.join(', ') : ''));
var v = function (theme, sunset) { return { theme: theme, sunset: !!sunset, camX: 1200, t: 3, groundY: MG.GROUND_Y }; };
var ok = Object.keys(themes).every(function (th) {
  var r = recCtx(); MG.Light.back(r.ctx, v(th)); var hazed = r.has('createLinearGradient') && r.has('fillRect');
  r = recCtx(); MG.Light.front(r.ctx, v(th));
  return hazed && r.has('op:soft-light') && r.has('createRadialGradient');
});
check(ok, 'each one: haze over the far scenery, a colour grade and a vignette');
var r = recCtx(); MG.Light.front(r.ctx, v('rainforest'));
check(r.has('op:multiply') && r.has('op:screen') && r.has('fill'), 'the rainforest: canopy shade and shafts of light');
r = recCtx(); MG.Light.front(r.ctx, v('rift'));
check(r.log.filter(function (x) { return x === 'op:screen'; }).length >= 1 && MG.Light.LOOKS.rift.under, 'the Time Rift: lava glowing from below');
r = recCtx(); MG.Light.front(r.ctx, v('outback'));
check(r.has('op:screen') && MG.Light.LOOKS.outback.sun, 'the Outback: the sun\'s glow');
check(MG.Light.look(v('outback', true)).sun[1] === MG.GROUND_Y - 60 && MG.Light.look(v('city', true)).warm === MG.Light.SUNSET.warm, 'a sunset sky: the sun sits low and everything turns orange');
check(MG.Light.look(v('nowhere')) === MG.Light.LOOKS.outback, 'an unknown world gets the Outback\'s light');

// in the game: maps (host and Wi-Fi friends share drawCampaignWorld) and duels
var calls = { back: 0, front: 0 };
var realBack = MG.Light.back, realFront = MG.Light.front;
MG.Light.back = function () { calls.back++; return realBack.apply(this, arguments); };
MG.Light.front = function () { calls.front++; return realFront.apply(this, arguments); };
Object.keys(MG.STORY).forEach(function (id) { MG.Story.markSeen(id); });
err = null;
var seenTheme = {};
MG.LEVELS.forEach(function (L, i) {
  if (seenTheme[L.theme] && L.sky !== 'sunset') return;
  seenTheme[L.theme] = 1;
  try { MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: i })); frames(3); scene().draw(recCtx().ctx); } catch (e) { err = L.id + ': ' + e; }
});
check(!err && calls.back > 0 && calls.front === calls.back, 'every world draws with its light, in front of and behind the action' + (err ? ': ' + err : ''));
calls = { back: 0, front: 0 };
MG.Engine.setScene(new MG.DuelScene({ players: [{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'tank', cpu: 1 }], stage: 2 })); frames(5);
check(calls.back > 0 && calls.front > 0, 'Tournament Duel stages get it too');
MG.Light.back = realBack; MG.Light.front = realFront;

// ---- switching it off: Settings, high contrast
MG.Settings.lighting = false;
r = recCtx(); MG.Light.back(r.ctx, v('outback')); MG.Light.front(r.ctx, v('outback'));
check(r.log.length === 0, 'Light and haze OFF: nothing extra is drawn');
MG.Settings.lighting = true; MG.Settings.contrast = true;
r = recCtx(); MG.Light.front(r.ctx, v('outback'));
var front = r.log.length;
r = recCtx(); MG.Light.back(r.ctx, v('outback'));
check(front === 0 && r.log.length > 0, 'high contrast keeps only the haze (it makes the action stand out)');
MG.Settings.contrast = false;
var st = new MG.SettingsScene(); MG.Engine.setScene(st); frames(2);
var li = st.items.findIndex(function (it) { return /^Light and haze/.test(typeof it.label === 'function' ? it.label() : it.label); });
check(li >= 0 && /ON$/.test(st.items[li].label()), 'Settings: "Light and haze: ON"');
st.activate(li);
check(MG.Settings.lighting === false && MG.Save.get('lighting', null) === false && /OFF/.test(st.items[li].label()), '...one press switches it off, and it\'s saved');
st.activate(li);
check(MG.Settings.lighting === true && MG.Save.get('lighting', null) === true, '...and back on');
var last = st.rect(st.items.length - 1);
check(last.y + last.h < MG.H - 26, 'every setting still fits above the hint line');
err = null; try { st.draw(recCtx().ctx); } catch (e) { err = '' + e; }
check(!err, 'the Settings page draws' + (err ? ': ' + err : ''));

// ---- the safety net: slow frames switch it off (only if the player hasn't chosen)
function runFrames(ms, n) { MG.Light.lastT = undefined; MG.Light.n = 0; MG.Light.slowN = 0; MG.Light.slowRuns = 0; for (var i = 0; i < n; i++) { now += ms; MG.Light.front(recCtx().ctx, v('outback')); } }
fresh(); MG.Light.autoOff = false;
runFrames(16.7, 400);
check(MG.Settings.lighting === true, 'smooth frames: the light stays on');
runFrames(40, 400);
check(MG.Settings.lighting === false && MG.Light.autoOff && MG.Save.get('lighting', null) === null, 'frames keep taking 40 ms: it switches itself off for this visit (not saved)');
fresh(); MG.Save.set('lighting', true); MG.Light.autoOff = false;
runFrames(40, 400);
check(MG.Settings.lighting === true && !MG.Light.autoOff, '...but not when the player chose ON in Settings');
fresh(); MG.Light.autoOff = false;
for (var k = 0; k < 6; k++) { runFrames(16.7, 60); runFrames(400, 3); }
check(MG.Settings.lighting === true, 'a pause or a hidden tab doesn\'t count as slow');

// ---- livelier movement: squash and stretch
fresh();
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0 })); var sc = scene(); frames(3);
sc.enemies = []; sc.boss = null; var b = sc.player; b.x = 300; frames(20);
var still = b.renderState();
check(!still.sq && !still.vy, 'standing still: no squash and no falling speed (Wi-Fi updates stay small)');
var rising = 0, falling = 0, landing = 0, after = 1;
key('KeyW', true); frames(3);
for (var i = 0; i < 120 && (i < 5 || !b.onGround); i++) { frames(1); var q = b.squash(); if (b.vy < -200) rising = Math.max(rising, q); if (b.vy > 200) falling = Math.max(falling, q); }
key('KeyW', false);
frames(1); landing = b.squash();
var landState = b.renderState();
frames(30); after = b.squash();
check(rising > 0.08 && falling > 0.05, 'stretched tall by speed in the air (rising ' + rising.toFixed(2) + ', falling ' + falling.toFixed(2) + ')');
check(landing < -0.08 && landState.sq < 0, 'squashed flat on landing (' + landing.toFixed(2) + '), and Wi-Fi friends get it too');
check(Math.abs(after) < 0.01, '...and back to normal half a second later');
b.invuln = 0; b.mercy = 0; b.takeHit({ dmg: 1, kbx: 0, kby: 0, stun: 0.2 }, sc); frames(1);
check(b.squash() < -0.05, 'a hit makes them wobble');
b.state = 'ko';
check(b.squash() === 0, 'knocked out: no squash');
b.state = 'idle';

// drawn around the feet, with ears and tails that follow through
var got = null, realC = MG.Art.character;
MG.Art.character = function (ctx, def, o) { got = o; return realC.apply(this, arguments); };
var world = { groundY: 470 };
function drawS(extra) { var r = recCtx(); MG.Fighter.drawState(r.ctx, Object.assign({ cid: 'earl', x: 400, y: 470, f: 1, pose: 'idle', t: 1 }, extra), world); return r; }
var r = drawS({ sq: -0.2 });
var sc1 = r.log.filter(function (x) { return x[0] === 'scale'; }).some(function (x) { return Math.abs(x[1] - 1.12) < 0.01 && Math.abs(x[2] - 0.8) < 0.01; });
check(sc1, 'a squash is drawn wider and flatter, around the feet (keeping the volume)');
check(got.ears > 0.2 && got.tailLag > 0.2, 'landing: ears flop forward and the tail bounces down');
drawS({ pose: 'walk', vx: 330 });
check(got.ears < -0.15, 'running: ears swept back');
drawS({ pose: 'jump', vy: -60, sq: 0.1 });
check(got.tailLag > 0.3, 'jumping up: the tail trails below');
drawS({ pose: 'jump', vy: 60 });
check(got.tailLag < -0.3, 'falling: the tail lifts');
var breathScale = function (r) { return r.log.some(function (x) { return x[0] === 'scale' && Math.abs(x[2] - (1 + Math.sin(1.5) * 0.018)) < 0.001; }); };
check(breathScale(drawS({ pose: 'idle', t: 0.5 })), 'standing critters breathe (a gentle rise and fall)');
check(!breathScale(drawS({ cid: 'boomer', pose: 'idle', t: 0.5 })), 'kangaroos keep their own breathing (no double breath)');
MG.Art.character = realC;
var err = null;
try { MG.CHARACTERS.concat(MG.SECRETS).forEach(function (d) { ['jump', 'idle', 'hurt', 'walk'].forEach(function (pose) { drawS({ cid: d.id, pose: pose, sq: pose === 'idle' ? -0.2 : 0.12, vy: 50, vx: 500 }); }); }); } catch (e) { err = '' + e; }
check(!err, 'every character draws squashed, stretched and flying' + (err ? ': ' + err : ''));

// motion smears and speed lines
var styles = {};
MG.CHARACTERS.concat(MG.SECRETS).forEach(function (d) { [d.basic, d.big].forEach(function (m) { if (m && m.style) styles[m.style] = 1; }); });
var NONE = { bumBlock: 1, treeHug: 1 };
var unknown = Object.keys(styles).filter(function (st) { return !MG.Art.SMEAR[st] && !NONE[st]; });
check(unknown.length === 0, 'every attack style smears (or is a shove or a hug): ' + Object.keys(styles).length + ' styles' + (unknown.length ? '; missing ' + unknown.join(', ') : ''));
function sw(style, big) { var r = recCtx(); MG.Art.swoosh(r.ctx, 0, 0, 1, 120, 1, style, big); return r; }
check(sw('punch').has('stroke') && sw('swipe').has('fill') && sw('kick', true).has('fill') && sw('spinKick').has('fill') && sw('bite').has('stroke'), 'punches streak, swipes and kicks swoosh, bites lunge');
check(sw('bumBlock').log.length === 0 && sw('punch').log.length > 0 && (function () { var r = recCtx(); MG.Art.swoosh(r.ctx, 0, 0, 1, 120, 0, 'punch'); return r.log.length === 0; })(), 'nothing for shoves, and nothing before the blow lands');
var lowest = -99;
['kick', 'doubleKick', 'tailFlick'].forEach(function (st) { [false, true].forEach(function (big) { sw(st, big).log.forEach(function (x) { if (x[0] === 'lineTo') lowest = Math.max(lowest, x[2]); }); }); });
check(lowest <= 0.5, 'kick swooshes never dip under the ground (lowest ' + lowest.toFixed(1) + ')');
var real = MG.Art.swoosh, sws = [];
MG.Art.swoosh = function (ctx, x, y, f, h, k, style, big) { sws.push(style + (big ? '!' : '')); };
drawS({ cid: 'boomer', jab: 0.95 }); drawS({ cid: 'boomer', kick: 0.95 }); drawS({ cid: 'chompers', jab: 0.95 }); drawS({ cid: 'chompers', kick: 0.95 }); drawS({ cid: 'boomer', jab: 0.4 });
MG.Art.swoosh = real;
check(sws.join() === 'punch,kick!,punch,kick!', 'in the game: Boomer and Chompers punch and kick (and nothing mid wind-up): ' + sws.join());
var lines = 0, realL = MG.Art.speedLines;
MG.Art.speedLines = function (ctx, x, y, w, h, dir, k) { if (k > 0) lines++; };
drawS({ pose: 'walk', vx: 300 }); var walking = lines;
drawS({ pose: 'hurt', vx: -600 }); drawS({ pose: 'walk', vx: 300, tea: 1 });
MG.Art.speedLines = realL;
check(walking === 0 && lines === 2, 'speed lines when flying back from a hit or dashing (and with Billy Tea), not when walking');

// ---- livelier pests (15 Nov 2026): squash and stretch, ears, tails and a cat's walk
var stub = { groundY: MG.GROUND_Y, platforms: [], fighters: [], fx: { shake: noop, ring: noop, burst: noop, text: noop, gore: noop, splat: noop }, spawn: noop };
function hop(type, vy) {
  // a real hop through the pest's own physics: the most stretch in the air, the deepest squash on landing
  var e = new MG.Enemy(type, 300, MG.GROUND_Y - 1, { hidden: false }), air = 0, land = 0, end = 0;
  e.onGround = false; e.vy = vy;
  for (var i = 0; i < 150; i++) {
    e.t += 1 / 60; e.physics(1 / 60, stub);
    var q = e.squash();
    if (!e.onGround) air = Math.max(air, q); else land = Math.min(land, q);
    end = q;
  }
  return { air: air, land: land, end: end, e: e };
}
var rh = hop('rabbit', -340), bh = hop('bigBuck', -980);
check(rh.air > 0.05 && rh.land < -0.08 && Math.abs(rh.end) < 0.01, 'a rabbit\'s hop: stretched in the air (' + rh.air.toFixed(2) + '), squashed on landing (' + rh.land.toFixed(2) + '), then back to normal');
check(bh.land < rh.land - 0.05, 'a bigger drop, a bigger squash (Big Buck landing from his leap: ' + bh.land.toFixed(2) + ')');
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0 })); sc = scene(); frames(3);
var pest = sc.enemies.filter(function (e) { return e.type === 'rabbit' && e.alive; })[0];
pest.t = 9; pest.landT = -9; pest.onGround = true; pest.vy = 0;
var calm = pest.squash();
pest.takeHit({ dmg: 1, kbx: 0, kby: 0, dir: 1, from: sc.player }, sc);
check(calm === 0 && pest.squash() < -0.08, 'standing still: no squash; a hit makes a pest wobble');
var hid = new MG.Enemy('cat', 300); hid.landT = hid.t;
var dead = hop('rabbit', -340).e; dead.landT = dead.t; dead.alive = false;
check(hid.hidden && hid.squash() === 0 && dead.squash() === 0, 'a cat hiding in the grass and a knocked-out pest don\'t squash');
var seenSq = null, realRabbit = MG.Art.rabbit;
MG.Art.rabbit = function (ctx, x, y, o) { seenSq = o.sq; return realRabbit.apply(this, arguments); };
pest.t = 20; pest.hurtAt = -9; pest.landT = 20; pest.landV = 700;
r = recCtx(); pest.draw(r.ctx, sc);
MG.Art.rabbit = realRabbit;
var wide = r.log.some(function (x) { return x[0] === 'scale' && x[1] > 1.05 && x[2] < 0.9; });
check(seenSq < -0.15 && wide, 'a landing pest is drawn wider and flatter around its feet, and the art is told (sq ' + seenSq + ')');
pest.landT = -9;
r = recCtx(); pest.draw(r.ctx, sc);
check(!r.log.some(function (x) { return x[0] === 'scale' && Math.abs(Math.abs(x[1]) - Math.abs(x[2])) > 0.001; }), '...and a pest standing still isn\'t squashed at all');
// follow-through in the art
var ears = [], realOval = MG.Art.oval;
MG.Art.oval = function (ctx, x, y, rx, ry, rot) { if (rx === 3.8 && ry === 11.5) ears.push(rot); return realOval.apply(this, arguments); };
function earsAt(o) { ears = []; MG.Art.rabbit(recCtx().ctx, 0, 0, o); return ears[0]; }
var earStand = earsAt({ t: 1 }), earFly = earsAt({ t: 1, air: true, sq: 0.1 }), earThud = earsAt({ t: 1, sq: -0.15 });
MG.Art.oval = realOval;
check(earFly < -0.95 && earThud > earStand + 0.4, 'rabbit ears: swept back in a hop (' + earFly.toFixed(2) + '), flopping forward on a thud (' + earThud.toFixed(2) + ')');
var tapers = [], realTaper = MG.Art.taper;
MG.Art.taper = function (ctx, x0, y0, x1, y1, x2, y2) { tapers.push([x2, y2]); return realTaper.apply(this, arguments); };
function catAt(o) { tapers = []; MG.Art.cat(recCtx().ctx, 0, 0, o); return tapers.slice(); }
var tailStill = catAt({ t: 0 })[0], tailLeap = catAt({ t: 0, air: true, sq: 0.1 })[0], tailThud = catAt({ t: 0, sq: -0.15 })[0];
var walk1 = catAt({ t: 0, moving: true }), walk2 = catAt({ t: 0.15, moving: true }), stand1 = catAt({ t: 0 }), stand2 = catAt({ t: 0.15 });
MG.Art.taper = realTaper;
check(tailLeap[0] < tailStill[0] - 3 && tailLeap[1] > tailStill[1] + 5 && tailThud[1] < tailStill[1] - 4, 'a cat\'s tail streams out behind in a leap and whips up when it lands');
check(walk1[1][0] !== walk2[1][0] && stand1[1][0] === stand2[1][0] && stand1[3][0] === stand2[3][0], 'a cat walks on its legs (they stood still before), and stands still when it stops');
// Wi-Fi: the squash goes in the update, trailing zeros don't
var snap0 = JSON.parse(JSON.stringify(MG.Sync.snapshot(sc)));
check(snap0.en.length > 0 && snap0.en.every(function (a) { return a.length <= 7 || a[a.length - 1]; }), 'pests in Wi-Fi updates: zeros at the end are left off (smaller updates)');
var other = sc.enemies.filter(function (e) { return e.alive && e !== pest; })[0];
other.landT = other.t; other.landV = 700; other.hurtAt = -9;
var snap1 = JSON.parse(JSON.stringify(MG.Sync.snapshot(sc)));
var row = snap1.en.filter(function (a) { return a[0] === other.uid; })[0];
check(row && row.length === 14 && row[13] < -15 && row[13] === Math.round(row[13]), 'a landing pest\'s squash goes to Wi-Fi friends (field 13, in hundredths: ' + (row && row[13]) + ')');
MG.Net.id = 1;
var guest = new MG.RemoteScene({ level: 0 }), gErr = null, gWide = false;
try {
  guest.onNet(snap1); guest.update(1 / 30);
  var ge = guest.enemies.get(other.uid);
  r = recCtx(); ge.draw(r.ctx, guest);
  gWide = ge.remoteSq < -0.15 && r.log.some(function (x) { return x[0] === 'scale' && x[1] > 1.05 && x[2] < 0.9; });
  guest.draw(recCtx().ctx);
  snap1.n += 1; snap1.en.forEach(function (a) { if (a[0] === other.uid) a[2] += 4; });
  guest.onNet(snap1);
} catch (e) { gErr = '' + e; }
check(!gErr && gWide, 'a friend\'s screen draws the squash too' + (gErr ? ': ' + gErr : ''));
check(!gErr && Math.abs(guest.enemies.get(other.uid).vx) > 10 && guest.enemies.get(pest.uid).vx === 0, '...and knows which pests are walking (a cat\'s legs, a pig\'s trot)');
MG.Net.id = 0; MG.Net.onMessage = null;

// ---- more detail in the ground
var gThemes = Object.keys(themes);
var noGround = gThemes.filter(function (th) { return !MG.GROUND_DETAIL[th]; });
check(noGround.length === 0, 'every world has ground detail (' + gThemes.length + ' worlds)' + (noGround.length ? ': missing ' + noGround.join(', ') : ''));
// a context that checks every number it's given
function numCtx() {
  var bad = [], paints = 0, ells = [];
  var ctx = new Proxy({}, {
    get: function (t, p) {
      if (p in t) return t[p];
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return function () { return { addColorStop: noop }; };
      return function () {
        for (var i = 0; i < arguments.length; i++) if (typeof arguments[i] === 'number' && !isFinite(arguments[i])) bad.push(p);
        if (p === 'fill' || p === 'stroke' || p === 'fillRect') paints++;
        if (p === 'ellipse') ells.push(Math.round(arguments[0] * 10) / 10);
      };
    },
    set: function (t, p, v) { t[p] = v; return true; },
  });
  return { ctx: ctx, bad: bad, paints: function () { return paints; }, ells: ells };
}
var gBad = [], gMost = 0, gEmpty = [];
gThemes.forEach(function (th) {
  [0, 777.5, 5321].forEach(function (cx) {
    [false, true].forEach(function (sunset) {
      var n = numCtx();
      MG.Art.groundDetail(n.ctx, th, cx, MG.GROUND_Y, 3.3, sunset);
      if (n.bad.length) gBad.push(th + ' ' + n.bad[0]);
      if (!n.paints()) gEmpty.push(th);
      gMost = Math.max(gMost, n.paints());
    });
  });
});
check(gBad.length === 0 && gEmpty.length === 0, 'each world\'s ground detail draws, with no broken numbers' + (gBad.length ? ': ' + gBad.slice(0, 3).join(', ') : '') + (gEmpty.length ? '; nothing in ' + gEmpty.join(', ') : ''));
check(gMost <= 12, 'cheap: batched into a few fills and strokes a frame (at most ' + gMost + ')');
var o1 = numCtx(), o2 = numCtx();
MG.Art.groundDetail(o1.ctx, 'outback', 500, MG.GROUND_Y, 0); MG.Art.groundDetail(o2.ctx, 'outback', 600, MG.GROUND_Y, 0);
var inView = o1.ells.filter(function (x) { return x > 200 && x < 700; });
check(inView.length > 5 && inView.every(function (x) { return o2.ells.indexOf(Math.round((x - 100) * 10) / 10) >= 0; }), 'pebbles and tracks scroll with the ground (' + inView.length + ' checked)');
var og = MG.GROUND_DETAIL.outback;
check(og.stones && og.cracks && og.tufts && og.strata && og.tracks, 'the Outback\'s red dirt: pebbles, cracks, tufts, layers and kangaroo tracks');
var gCalls = 0, realGD = MG.Art.groundDetail;
MG.Art.groundDetail = function () { gCalls++; return realGD.apply(this, arguments); };
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 4 })); frames(2); var inMaps = gCalls;
MG.Engine.setScene(new MG.DuelScene({ players: [{ id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'tank', cpu: 1 }], stage: 0 })); frames(2);
MG.Art.groundDetail = realGD;
check(inMaps > 0 && gCalls > inMaps, 'the maps and the duel stages draw it');

fresh();
done('looks');
