// The graphics pass (14 Nov 2026): the title screen's cast, logo and quokka, and light and
// atmosphere in every world (MG.Light), its Settings switch and the safety net for slow devices.
function fresh() { localStorage.clear(); MG.Settings.lighting = true; MG.Settings.contrast = false; }
// a drawing context that writes down what's drawn: calls, and blend modes as 'op:<mode>'
function recCtx() {
  var log = [], store = {};
  var ctx = new Proxy(store, {
    get: function (t, p) {
      if (p in t) return t[p];
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return function () { log.push(p); return { addColorStop: function () {} }; };
      if (p === 'measureText') return function () { return { width: 10 }; };
      return function () { log.push(p); };
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
fresh();
done('looks');
